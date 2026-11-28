// 클로드 비디오 키트 콘텐츠의 구매자 표식 (서버 전용, 의존성 없음).
// 약속: FCP 키트 저장소 docs/update_server_contract_v3.md §3 · §10 · §11. 참조 구현은 키트 저장소 scripts/vk_mark.py이고,
// 이 파일은 그것을 줄 단위로 옮긴 것이다. 같은 (키, 묶음, 버전)이면 파일 내용이 바이트 단위로 같아야 한다
// (시험: scripts/test-videokit-content.mjs가 scripts/fixtures/videokit-content-v3/ 의 기대값과 비교).
// 파이썬과 JS가 갈리는 곳: \w(한글 포함) · str.strip의 공백 정의 · replace의 $ 해석 · 빈 dict의 참거짓. 아래에서 모두 파이썬 쪽에 맞춘다.
import { createHmac } from 'node:crypto';
import { buildZip, readZipFiles } from './videokit-watermark.ts';

export const HEADER = (order: string) => `<!-- 주문 ${order} 구매자용. 공유·재배포 금지. -->`;
// 개인 사본 항목 시각 (contract §3.1)
const ENTRY_TIME = new Date('2026-01-01T00:00:00Z');

// 파이썬 str.isspace와 같은 글자 (JS trim은 U+FEFF를 떼고 \x1c-\x1f · \x85는 안 뗀다)
const WS = '\\t\\n\\v\\f\\r\\x1c-\\x20\\x85\\xa0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000';
const pyStrip = (s: string) => s.replace(new RegExp(`^[${WS}]+|[${WS}]+$`, 'g'), '');
const pyLstrip = (s: string) => s.replace(new RegExp(`^[${WS}]+`), '');
const pyRstrip = (s: string) => s.replace(new RegExp(`[${WS}]+$`), '');
const rstripChar = (s: string, c: string) => { let e = s.length; while (e > 0 && s[e - 1] === c) e--; return s.slice(0, e); };
const count = (s: string, sub: string) => (sub ? s.split(sub).length - 1 : -1);
const replaceAll = (s: string, find: string, to: string) => s.split(find).join(to);   // $ 해석 없음
// 파이썬 re의 \w (str): 글자 · 숫자 · _
const WORD = /[\p{L}\p{N}_]/u;

export const normKey = (k: string) => k.replace(/\s+/g, '').toUpperCase();
// 머리말에 넣는 주문번호: HTML 주석 · 공백이 깨지지 않게 글자 · 숫자 · . _ -만 남긴다(/d/ 링크의 markFor와 같은 규칙).
// 주문번호가 없는 키(수동 발급 등)는 TEST-<키 끝 4자>. 검출(trace)도 이 값으로 맞춰 본다.
export function orderLabel(orderId: string | null | undefined, key: string) {
  const o = (orderId ?? '').trim().replace(/[^\p{L}\p{N}._-]/gu, '_').slice(0, 100);
  return o || `TEST-${normKey(key).slice(-4)}`;
}
export function normPath(p: string) {
  const n = p.replaceAll('\\', '/').normalize('NFC');
  return n.startsWith('./') ? n.slice(2) : n;
}
const h = (secret: string, msg: string) => createHmac('sha256', Buffer.from(secret, 'utf8')).update(msg, 'utf8').digest('hex');

// 버킷 경로처럼 밖에 보일 수 있는 곳에서 키 대신 쓰는 이름
export const subject = (secret: string, key: string) => h(secret, `lic|${normKey(key)}`).slice(0, 16);
export const mark = (secret: string, key: string, pack: string, version: string, path: string, slot: string | number) =>
  h(secret, [normKey(key), pack, version, normPath(path), String(slot)].join('|'));
export const choice = (hex: string, n: number) => parseInt(hex.slice(0, 8), 16) % n;
export const footerTag = (secret: string, key: string, pack: string, version: string, path: string) => mark(secret, key, pack, version, path, 'footer').slice(0, 12);
// /d/ 링크 zip의 표식(contract §5): 키가 아니라 링크 코드 단위
export const linkTag = (secret: string, code: string, path: string) => h(secret, `link|${code}|${normPath(path)}`).slice(0, 12);
// 임대 서명: 구매자 자기 키로 서명(손상 검출용, 위조 방지 아님)
export function leaseSig(key: string, device: string, expiresAt: string, packs: Record<string, string>) {
  const joined = Object.keys(packs).sort().map(k => `${k}:${packs[k]}`).join(',');
  return h(normKey(key), `${device}|${expiresAt}|${joined}`);
}
export const contentKey = (contentSecret: string, key: string, device: string) => h(contentSecret, `${normKey(key)}|${device}`);

// ---- markdown ----
export type Slot = { find: string; alts: string[] };
export type FileSpec = { header?: boolean; footer?: boolean; spaces?: number; slots?: Slot[];
  json?: { order?: boolean; indent?: boolean; about_alts?: string[] }; bits?: unknown };
export type Variants = { files?: Record<string, FileSpec> };

function fencedLines(lines: string[]) {
  let inside = false;
  const out = new Set<number>();
  lines.forEach((l, i) => {
    if (pyLstrip(l).startsWith('```')) { out.add(i); inside = !inside; return; }
    if (inside) out.add(i);
  });
  return out;
}

// 공백 표식을 넣을 줄(마스터 기준, contract §3.2 1번). vk_mark.space_lines와 같다.
export function spaceLines(text: string, spec: FileSpec) {
  const lines = text.split('\n');
  const fence = fencedLines(lines);
  const seen = new Map<string, number>();
  for (const l of lines) seen.set(l, (seen.get(l) ?? 0) + 1);
  const finds = (spec.slots ?? []).map(s => s.find);
  const want = Math.trunc(Number(spec.spaces ?? 0));
  const out: number[] = [];
  for (let i = 0; i < lines.length - 1; i++) {
    if (out.length >= want) break;
    const l = lines[i], ls = pyLstrip(l);
    if (fence.has(i) || !pyStrip(l) || ls.startsWith('|') || ls.startsWith('#') || ls.startsWith('<!--') || l !== pyRstrip(l)
      || pyStrip(lines[i + 1]) || finds.some(f => l.includes(f)) || seen.get(l) !== 1 || !WORD.test(l)) continue;
    out.push(i);
  }
  return out;
}

export function markMd(text: string, spec: FileSpec, secret: string, key: string, pack: string, version: string, rawPath: string, order: string) {
  const path = normPath(rawPath);
  const spaced = spaceLines(text, spec);
  (spec.slots ?? []).forEach((s, n) => {
    const c = count(text, s.find);
    if (c !== 1) throw new Error(`${path}: slot ${n} find occurs ${c} times`);
    text = replaceAll(text, s.find, s.alts[choice(mark(secret, key, pack, version, path, n), s.alts.length)]);
  });
  const lines = text.split('\n');
  spaced.forEach((li, i) => { if (choice(mark(secret, key, pack, version, path, `spaces:${i}`), 2)) lines[li] += '  '; });
  text = lines.join('\n');
  if (spec.header) text = `${HEADER(order)}\n${text}`;
  if (spec.footer) text = `${rstripChar(text, '\n')}\n\n<!-- vk:${footerTag(secret, key, pack, version, path)} -->\n`;
  return text;
}

// ---- JSON (2차 presets). 텍스트 단위로만 바꾼다: 다시 stringify하면 1.0이 1이 된다 ----
function topMembers(raw: string) {
  const body = pyStrip(raw);
  if (!body.startsWith('{') || !body.endsWith('}')) throw new Error('json: not an object');
  let inner = body.slice(1, -1);
  while (inner.startsWith('\n')) inner = inner.slice(1);
  inner = rstripChar(inner, '\n');
  const blocks: string[] = [];
  let cur: string[] = [];
  for (const l of inner.split('\n')) {
    if (/^ {2}"/.test(l) && cur.length) { blocks.push(cur.join('\n')); cur = []; }
    cur.push(l);
  }
  if (cur.length) blocks.push(cur.join('\n'));
  return blocks;
}

// JSON 값이 같은지 (dict 키 순서 무시, 1.0 == 1)
function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) || Array.isArray(b)) return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, i) => sameValue(x, b[i]));
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a), kb = Object.keys(b);
    return ka.length === kb.length && ka.every(k => Object.hasOwn(b, k) && sameValue((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
  }
  return false;
}

export function markJson(raw: string, spec: FileSpec, secret: string, key: string, pack: string, version: string, path: string) {
  const data = JSON.parse(raw);
  const j = spec.json ?? {};
  if (j.about_alts?.length) {
    const alts = j.about_alts;
    const c = choice(mark(secret, key, pack, version, path, 'about:0'), alts.length);
    const look = data?.about?.look;
    if (typeof look !== 'string') throw new Error(`${path}: about.look is missing`);
    const old = JSON.stringify(look);
    if (count(raw, old) !== 1) throw new Error(`${path}: about.look must appear exactly once`);
    raw = replaceAll(raw, old, JSON.stringify(alts[c]));
  }
  let members = topMembers(raw);
  if (j.order && choice(mark(secret, key, pack, version, path, 'order'), 2)) members = members.reverse();
  let out = `{\n${members.map(m => rstripChar(pyRstrip(m), ',')).join(',\n')}\n}\n`;
  if (j.indent && choice(mark(secret, key, pack, version, path, 'indent'), 2)) out = out.replace(/^((?: {2})+)/gm, (_, s: string) => ' '.repeat(s.length / 2));
  if (!sameValue(JSON.parse(out), JSON.parse(raw))) throw new Error(`${path}: JSON value changed`);
  return out;
}

// ---- 개인 사본 (.vkp = zip) ----
// 변형 파일에 없는 파일은 그대로 복사한다. 항목 순서 = 이름순, 시각 고정 → 같은 구매자는 늘 같은 바이트.
// 마스터 항목에 .. · 절대 경로가 있으면 throw(키트는 그런 항목을 풀지 않는다).
const hasSpec = (s: FileSpec | undefined): s is FileSpec => !!s && Object.keys(s).length > 0;
export function personalCopy(masterZip: Buffer, variants: Variants, o: { secret: string; key: string; pack: string; version: string; order: string }) {
  const specs = variants.files ?? {};
  const { files } = readZipFiles(masterZip);
  const names = [...files.keys()].filter(n => !n.endsWith('/')).sort();
  const out = names.map(name => {
    const p = normPath(name);
    if (p.startsWith('/') || p.split('/').includes('..')) throw new Error(`master: bad entry name ${p}`);
    let data: Buffer = files.get(name)!.content;
    const spec = specs[p];
    if (hasSpec(spec) && p.endsWith('.md')) data = Buffer.from(markMd(data.toString('utf8'), spec, o.secret, o.key, o.pack, o.version, p, o.order), 'utf8');
    else if (hasSpec(spec) && p.endsWith('.json')) data = Buffer.from(markJson(data.toString('utf8'), spec, o.secret, o.key, o.pack, o.version, p), 'utf8');
    return { name: p, content: data };
  });
  return buildZip(out, '', ENTRY_TIME);
}

// ---- 검출 (contract §2.4, 참조 vk_mark.trace · trace_link) ----
export type Observation = { path: string; slot: string; value: number; n: number };
export type Literal = { order_id?: string; path?: string; tag?: string };
export type TraceKey = { key: string; order_id: string | null; email?: string | null };

// 자리마다 확률이 다른 독립 시행에서 m번 이상 맞을 확률 (포아송 이항)
export function tailProb(ps: number[], m: number) {
  let dist = [1];
  for (const p of ps) {
    const nd = new Array(dist.length + 1).fill(0);
    dist.forEach((v, k) => { nd[k] += v * (1 - p); nd[k + 1] += v * p; });
    dist = nd;
  }
  return dist.slice(m).reduce((a, b) => a + b, 0);
}

export function trace(secret: string, keys: TraceKey[], pack: string, version: string, observations: Observation[], literal: Literal[] = [], threshold = 1e-3) {
  const literalHits: { order_id: string; where: string }[] = [];
  for (const l of literal) {
    if (l.order_id) literalHits.push(...keys.filter(k => orderLabel(k.order_id, k.key) === l.order_id).map(k => ({ order_id: k.order_id ?? '', where: 'header' })));
    else if (l.tag && l.path) literalHits.push(...keys.filter(k => footerTag(secret, k.key, pack, version, l.path!) === l.tag).map(k => ({ order_id: k.order_id ?? '', where: `footer ${l.path}` })));
  }
  const ps = observations.map(o => 1 / o.n);
  const scored = keys.map(k => ({ k, hit: observations.filter(o => choice(mark(secret, k.key, pack, version, o.path, o.slot), o.n) === o.value).length }));
  scored.sort((a, b) => b.hit - a.hit);
  const total = observations.length;
  const candidates = scored.slice(0, 3).map(({ k, hit }) => ({
    k, order_id: k.order_id ?? '', matched: hit, total, p_false: total ? Math.min(1, Math.max(keys.length - 1, 1) * tailProb(ps, hit)) : 1,
  }));
  const verdict = candidates.length && total && candidates[0].p_false < threshold && (candidates.length < 2 || candidates[0].matched > candidates[1].matched) ? 'match' : 'inconclusive';
  return { verdict: verdict as 'match' | 'inconclusive', candidates, literalHits };
}

export function traceLink<L extends { code: string }>(secret: string, links: L[], tags: { path: string; tag: string }[]) {
  return links.map(l => ({ l, matched: tags.filter(t => linkTag(secret, l.code, t.path) === t.tag).length, total: tags.length }))
    .filter(x => x.matched > 0).sort((a, b) => b.matched - a.matched);
}
