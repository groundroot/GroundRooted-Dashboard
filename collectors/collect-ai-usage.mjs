// AI 에이전트 사용량 수집기 — 이 맥의 로컬 로그를 읽어 ai_usage 테이블에 집계한다.
//
// ⚠️ GitHub Actions에서는 못 돈다. 로그가 이 맥에만 있으므로 로컬에서 실행해야 한다.
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node collectors/collect-ai-usage.mjs
//
// ⚠️ 금액은 "이만큼 API로 썼다면 얼마"인 공식 정가 환산액이다. Claude Code와 Codex는
//    구독제로 쓰고 있어서(Codex 로그에 plan_type: plus) 실제 청구액과는 다르다.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { requireEnv, sbUpsert, DRY } from "./lib.mjs";

requireEnv();

// 100만 토큰당 USD.
// Claude: Anthropic 공식 단가. 캐시 읽기 = input×0.1, 캐시 쓰기 = input×1.25(5분) / ×2(1시간).
// OpenAI: 공개 가격 페이지 기준. 캐시 입력 = input×0.1.
const PRICING = {
  "claude-fable-5": { in: 10, out: 50 },
  "claude-mythos-5": { in: 10, out: 50 },
  "claude-opus-5": { in: 5, out: 25 },
  "claude-opus-4-8": { in: 5, out: 25 },
  "claude-opus-4-7": { in: 5, out: 25 },
  "claude-opus-4-6": { in: 5, out: 25 },
  "claude-opus-4-5": { in: 5, out: 25 },
  "claude-sonnet-5": { in: 3, out: 15 },
  "claude-sonnet-4-6": { in: 3, out: 15 },
  "claude-sonnet-4-5": { in: 3, out: 15 },
  "claude-haiku-4-5": { in: 1, out: 5 },
  "gpt-5.6-sol": { in: 5, out: 30 },
  "gpt-5.6-terra": { in: 2, out: 12 },
  "gpt-5.6-luna": { in: 0.2, out: 1.2 },
  "gpt-5.5": { in: 5, out: 30 },
  "gpt-5.4": { in: 2.5, out: 15 },
  "gpt-5.3-codex": { in: 1.75, out: 14 },
};

/** claude-haiku-4-5-20251001 → claude-haiku-4-5, claude-opus-4-8[1m] → claude-opus-4-8 */
function normalizeModel(model) {
  return model.replace(/\[1m\]$/, "").replace(/-\d{8}$/, "");
}

const unpriced = new Set();
const rows = new Map(); // "tool|model|date" → row
const projects = new Map(); // "project|tool" → row

const HOME = homedir();

/** 작업 경로를 프로젝트 이름으로 접는다. 하위 디렉터리에서 실행한 것도 같은 프로젝트로 묶인다. */
function projectFromCwd(cwd) {
  if (!cwd) return null;
  const rel = cwd.startsWith(HOME) ? cwd.slice(HOME.length + 1) : cwd;
  for (const root of ["orca/projects/", "코딩/"]) {
    if (rel.startsWith(root)) {
      const rest = rel.slice(root.length);
      return rest.split("/")[0] || null;
    }
  }
  if (!rel || rel === cwd) return cwd; // 홈 밖 경로는 그대로
  return rel.split("/")[0] || null;
}

/** Command Code는 cwd를 슬러그로 바꿔 폴더명에 쓴다: users-chrictvictory-orca-projects-band-score */
function projectFromSlug(slug) {
  const m = slug.match(/orca-projects-(.+)$/) || slug.match(/^users-[^-]+-(.+)$/);
  return m ? m[1].replace(/-/g, " ") : slug;
}

function addProject(project, tool, cost, tokens) {
  if (!project) return;
  const key = `${project}|${tool}`;
  const r = projects.get(key) ?? { project, tool, cost_usd: 0, tokens: 0 };
  r.cost_usd += cost;
  r.tokens += tokens;
  projects.set(key, r);
}

function bucket(tool, model, date) {
  const key = `${tool}|${model}|${date}`;
  let r = rows.get(key);
  if (!r) {
    r = {
      tool,
      model,
      usage_date: date,
      input_tokens: 0,
      cache_write_tokens: 0,
      cache_read_tokens: 0,
      output_tokens: 0,
      cost_usd: 0,
      priced: true,
    };
    rows.set(key, r);
  }
  return r;
}

function walk(dir, ext = ".jsonl") {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, ext));
    else if (e.isFile() && e.name.endsWith(ext)) out.push(p);
  }
  return out;
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

/** Cline CLI / Command Code는 로그에 비용을 이미 계산해 넣는다 — 그 값을 그대로 쓴다. */
function addPrecomputed(tool, model, date, u, cost) {
  const r = bucket(tool, model, date);
  r.priced = true;
  r.input_tokens += u.inputTokens ?? 0;
  r.cache_write_tokens += u.cacheWriteTokens ?? 0;
  r.cache_read_tokens += u.cacheReadTokens ?? 0;
  r.output_tokens += u.outputTokens ?? 0;
  r.cost_usd += cost ?? 0;
}

// ── Claude Code ──────────────────────────────────────────────────────────────
// assistant 레코드마다 message.usage가 붙는다. 같은 메시지가 여러 세션 파일에
// 중복 기록될 수 있어 message.id로 중복을 제거한다.
function collectClaude() {
  const files = walk(join(homedir(), ".claude", "projects"));
  const seen = new Set();
  let messages = 0;

  for (const file of files) {
    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const line of text.split("\n")) {
      if (!line || !line.includes('"usage"')) continue;
      let d;
      try {
        d = JSON.parse(line);
      } catch {
        continue;
      }
      const m = d.message;
      if (!m || typeof m !== "object" || !m.usage || !m.model) continue;
      if (m.model === "<synthetic>") continue;
      if (m.id) {
        if (seen.has(m.id)) continue;
        seen.add(m.id);
      }
      const date = String(d.timestamp || "").slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

      const u = m.usage;
      const model = normalizeModel(m.model);
      const r = bucket("claude-code", model, date);

      // 캐시 쓰기는 5분/1시간 TTL 단가가 다르다. 세부값이 없으면 전부 5분으로 본다.
      const cc = u.cache_creation || {};
      const w5 = cc.ephemeral_5m_input_tokens ?? u.cache_creation_input_tokens ?? 0;
      const w1h = cc.ephemeral_1h_input_tokens ?? 0;
      const read = u.cache_read_input_tokens ?? 0;
      const inp = u.input_tokens ?? 0;
      const outp = u.output_tokens ?? 0;

      r.input_tokens += inp;
      r.cache_write_tokens += w5 + w1h;
      r.cache_read_tokens += read;
      r.output_tokens += outp;

      const p = PRICING[model];
      let cost = 0;
      if (p) {
        cost =
          (inp * p.in + w5 * p.in * 1.25 + w1h * p.in * 2 + read * p.in * 0.1 + outp * p.out) / 1e6;
        r.cost_usd += cost;
      } else {
        r.priced = false;
        unpriced.add(model);
      }
      addProject(projectFromCwd(d.cwd), "claude-code", cost, inp + w5 + w1h + read + outp);
      messages++;
    }
  }
  console.log(`  Claude Code: 파일 ${files.length}개, 메시지 ${messages}건`);
}

// ── Codex ────────────────────────────────────────────────────────────────────
// token_count 이벤트의 total_token_usage는 세션 누적값이다. 이전 값과의 차분을 내서
// 그 시점의 turn_context.model에 귀속시킨다 (모델을 바꿔 쓴 세션도 정확히 나뉜다).
function collectCodex() {
  const files = walk(join(homedir(), ".codex", "sessions"));
  let sessions = 0;

  for (const file of files) {
    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    let model = null;
    let cwd = null;
    let prev = { input: 0, cached: 0, output: 0 };
    let counted = false;

    for (const line of text.split("\n")) {
      if (!line) continue;
      let d;
      try {
        d = JSON.parse(line);
      } catch {
        continue;
      }
      if (d.type === "session_meta" && d.payload?.cwd) cwd = d.payload.cwd;
      if (d.type === "turn_context" && d.payload?.model) {
        model = normalizeModel(d.payload.model);
        if (d.payload.cwd) cwd = d.payload.cwd;
        continue;
      }
      if (d.type !== "event_msg" || d.payload?.type !== "token_count") continue;
      const t = d.payload.info?.total_token_usage;
      if (!t || !model) continue;

      const cur = {
        input: t.input_tokens ?? 0,
        cached: t.cached_input_tokens ?? 0,
        output: t.output_tokens ?? 0,
      };
      // 누적값이 줄었다면 세션이 리셋된 것으로 보고 기준을 다시 잡는다.
      if (cur.input < prev.input) prev = { input: 0, cached: 0, output: 0 };

      const dIn = cur.input - prev.input;
      const dCached = cur.cached - prev.cached;
      const dOut = cur.output - prev.output;
      prev = cur;
      if (dIn <= 0 && dOut <= 0) continue;

      const date = String(d.timestamp || "").slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

      const r = bucket("codex", model, date);
      const fresh = Math.max(0, dIn - dCached); // cached_input_tokens는 input_tokens의 부분집합
      r.input_tokens += fresh;
      r.cache_read_tokens += Math.max(0, dCached);
      r.output_tokens += Math.max(0, dOut);

      const p = PRICING[model];
      let cost = 0;
      if (p) {
        cost = (fresh * p.in + Math.max(0, dCached) * p.in * 0.1 + Math.max(0, dOut) * p.out) / 1e6;
        r.cost_usd += cost;
      } else {
        r.priced = false;
        unpriced.add(model);
      }
      addProject(projectFromCwd(cwd), "codex", cost, fresh + Math.max(0, dCached) + Math.max(0, dOut));
      counted = true;
    }
    if (counted) sessions++;
  }
  console.log(`  Codex: 파일 ${files.length}개, 사용량 있는 세션 ${sessions}개`);
}

// ── Cline CLI ────────────────────────────────────────────────────────────────
// 메시지 단위(metrics)로 집계한다. 세션 메타(metadata.usage)는 중간에 끊긴 세션에서
// 갱신되지 않아 실측보다 적게 잡힌다.
function collectCline() {
  const files = walk(join(homedir(), ".cline", "data", "sessions"), ".json").filter(
    (p) => !p.endsWith(".messages.json")
  );
  let messages = 0;
  for (const file of files) {
    const s = readJson(file);
    if (!s?.model) continue;
    const model = normalizeModel(s.model);
    const parsed = readJson(file.replace(/\.json$/, ".messages.json"));
    const msgs = Array.isArray(parsed) ? parsed : parsed?.messages;
    if (!Array.isArray(msgs)) continue;

    for (const m of msgs) {
      const t = m?.metrics;
      if (!t || !(t.inputTokens || t.outputTokens)) continue;
      const date = new Date(m.ts ?? s.ended_at ?? 0).toISOString().slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date === "1970-01-01") continue;
      addPrecomputed("cline", model, date, t, t.cost);
      addProject(
        projectFromCwd(s.cwd),
        "cline",
        t.cost ?? 0,
        (t.inputTokens ?? 0) + (t.outputTokens ?? 0) + (t.cacheReadTokens ?? 0) + (t.cacheWriteTokens ?? 0)
      );
      messages++;
    }
  }
  console.log(`  Cline: 세션 ${files.length}개, 메시지 ${messages}건`);
}

// ── Command Code (cmd) ───────────────────────────────────────────────────────
function collectCommandCode() {
  const files = walk(join(homedir(), ".commandcode", "projects")).filter(
    (p) => !p.endsWith(".checkpoints.jsonl")
  );
  let messages = 0;
  for (const file of files) {
    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const project = projectFromSlug(file.split("/").at(-2) ?? "");
    for (const line of text.split("\n")) {
      if (!line || !line.includes('"usage"')) continue;
      let d;
      try {
        d = JSON.parse(line);
      } catch {
        continue;
      }
      if (!d.usage || !d.model) continue;
      const date = String(d.timestamp || "").slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      const u = d.usage;
      addPrecomputed("command-code", normalizeModel(d.model), date, u, u.costUsd);
      addProject(
        project,
        "command-code",
        u.costUsd ?? 0,
        (u.inputTokens ?? 0) + (u.outputTokens ?? 0) + (u.cacheReadTokens ?? 0) + (u.cacheWriteTokens ?? 0)
      );
      messages++;
    }
  }
  console.log(`  Command Code: 파일 ${files.length}개, 메시지 ${messages}건`);
}

console.log("▸ 로컬 AI 로그 집계");
collectClaude();
collectCodex();
collectCline();
collectCommandCode();
// Antigravity는 사용량을 로컬에 저장하지 않는다 (쿼터를 localhost language server RPC로
// 실시간 조회만 하고, 대화 기록은 스키마 없는 protobuf라 토큰 필드를 식별할 수 없다).

const list = [...rows.values()].map((r) => ({
  ...r,
  cost_usd: Math.round(r.cost_usd * 10000) / 10000,
  updated_at: new Date().toISOString(),
}));

const byTool = new Map();
for (const r of list) byTool.set(r.tool, (byTool.get(r.tool) ?? 0) + r.cost_usd);
for (const [tool, cost] of [...byTool].sort((a, b) => b[1] - a[1])) {
  console.log(`    ${tool.padEnd(14)} $${cost.toFixed(2)}`);
}
const total = list.reduce((s, r) => s + r.cost_usd, 0);
console.log(`  집계 ${list.length}행, 총 환산액 $${total.toFixed(2)}`);
if (unpriced.size) {
  console.log(`  ⚠ 단가 미등록 모델(비용 0으로 집계됨): ${[...unpriced].join(", ")}`);
}

const projectList = [...projects.values()]
  .filter((r) => r.cost_usd > 0.005)
  .map((r) => ({
    ...r,
    cost_usd: Math.round(r.cost_usd * 10000) / 10000,
    updated_at: new Date().toISOString(),
  }));

const topProjects = new Map();
for (const r of projectList) topProjects.set(r.project, (topProjects.get(r.project) ?? 0) + r.cost_usd);
console.log(`  프로젝트 ${topProjects.size}개 — 상위 5개:`);
for (const [p, c] of [...topProjects].sort((a, b) => b[1] - a[1]).slice(0, 5)) {
  console.log(`    ${p.padEnd(28)} $${c.toFixed(2)}`);
}

await sbUpsert("ai_usage", list, "tool,model,usage_date");
await sbUpsert("ai_project_cost", projectList, "project,tool");
console.log(DRY ? "완료 (DRY RUN — 실제 쓰기 없음)" : "완료");
