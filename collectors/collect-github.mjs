// GitHub 수집기 — repos.json의 저장소들에서 커밋/릴리스/project.yaml(stage)을 읽어
// projects / events 테이블에 반영한다.
// env: GH_TOKEN (repo 읽기 권한), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { requireEnv, sbUpsert, sbInsertIgnore, sbUpdate, sbSelect, DRY } from "./lib.mjs";

requireEnv();
const GH = process.env.GH_TOKEN;
const here = dirname(fileURLToPath(import.meta.url));
const { repos } = JSON.parse(readFileSync(join(here, "repos.json"), "utf8"));

async function gh(path) {
  const r = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(GH ? { Authorization: `Bearer ${GH}` } : {}),
      "User-Agent": "groundrooted-collector",
    },
  });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GitHub ${path} ${r.status}: ${await r.text()}`);
  return r.json();
}

/** project.yaml — "stage: 개발" 같은 단순 key: value만 파싱 */
function parseProjectYaml(text) {
  const out = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Za-z_]+):\s*(.+?)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const sinceIso = new Date(Date.now() - 26 * 3600 * 1000).toISOString(); // 최근 26시간

let failures = 0;

for (const { slug, name, kind, repo } of repos) {
  if (repo.startsWith("OWNER/")) { console.log(`skip ${slug} (repos.json의 OWNER를 실제 계정으로 바꾸세요)`); continue; }
  console.log(`▸ ${repo}`);
  try {

  // 1) project.yaml → stage
  let stage;
  const yamlFile = await gh(`/repos/${repo}/contents/project.yaml`);
  if (yamlFile?.content) {
    const meta = parseProjectYaml(Buffer.from(yamlFile.content, "base64").toString("utf8"));
    stage = meta.stage;
  }

  // 2) 프로젝트 upsert
  await sbUpsert(
    "projects",
    { slug, name, kind, repo, ...(stage ? { stage } : {}), status: "active", updated_at: new Date().toISOString() },
    "slug"
  );

  // projects.id 조회 (이벤트 연결용)
  const found = await sbSelect("projects", `select=id&slug=eq.${slug}&limit=1`);
  const projectId = found[0]?.id ?? null;

  // 3) 최근 커밋 → events
  const commits = (await gh(`/repos/${repo}/commits?since=${sinceIso}&per_page=30`)) ?? [];
  const commitEvents = commits.map((c) => ({
    project_id: projectId,
    source: "github",
    type: "commit",
    title: `${repo.split("/")[1]}: ${c.commit.message.split("\n")[0].slice(0, 120)}`,
    external_id: c.sha,
    occurred_at: c.commit.author?.date ?? new Date().toISOString(),
    detail: { repo, url: c.html_url },
  }));
  await sbInsertIgnore("events", commitEvents, "source,external_id");
  console.log(`  commits: ${commitEvents.length}`);

  // 4) 최근 릴리스 → events
  const releases = (await gh(`/repos/${repo}/releases?per_page=5`)) ?? [];
  const fresh = releases.filter((r) => r.published_at && r.published_at >= sinceIso);
  await sbInsertIgnore(
    "events",
    fresh.map((r) => ({
      project_id: projectId,
      source: "github",
      type: "release",
      title: `${repo.split("/")[1]} ${r.tag_name} 릴리스`,
      external_id: `release-${r.id}`,
      occurred_at: r.published_at,
      detail: { repo, url: r.html_url },
    })),
    "source,external_id"
  );
  if (fresh.length) console.log(`  releases: ${fresh.length}`);
  } catch (e) {
    failures++;
    console.error(`  ✗ ${repo} 수집 실패: ${e.message.split("\n")[0]}`);
  }
}

console.log(DRY ? "완료 (DRY RUN — 실제 쓰기 없음)" : "완료");
if (failures && failures === repos.filter((r) => !r.repo.startsWith("OWNER/")).length) process.exit(1);
