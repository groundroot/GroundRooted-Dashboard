// 키트 1.4.2 콘텐츠 서버 (계약 v3: FCP 키트 저장소 docs/update_server_contract_v3.md). 네트워크 없이 돈다.
// §12 시험 계획 중 서버가 맡는 것: 1 오류 응답 · 2 have와 서명 링크 · 3 같은 구매자 다른 기기 · 4 다른 구매자 · 5 사본 실패 시 마스터 안 나감
// · 6 §10 벡터와 §11 고정 자료(바이트 비교) · 7 검출(1,000명 키, 50명 사본). 8(/d/ 확장)은 scripts/test-videokit-link.mjs.
// 표 · 버킷은 아래 가짜 의존성이 같은 규칙으로 흉내 낸다(sql/videokit-content.sql의 실제 Postgres 적용은 PR 본문에 적는다).
import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { tooMany, resetLimits, newKey } from '../products/videokit-license.ts';
import { readZipFiles, buildZip } from '../products/videokit-watermark.ts';
import * as M from '../products/videokit-mark.ts';
import { handleContent, handleTrace, resetContentLimits, emailHint, MAKE_LIMIT } from '../products/videokit-content.ts';

const sha = b => createHash('sha256').update(b).digest('hex');
const quiet = async (fn) => { const e = console.error, l = console.log; console.error = () => {}; console.log = () => {}; try { return await fn(); } finally { console.error = e; console.log = l; } };
const FIX = new URL('./fixtures/videokit-content-v3/', import.meta.url);
const S = 'TEST-MARK-SECRET', CS = 'TEST-CONTENT-SECRET', V = '2026.12.05-1';

// ---- §10 시험 벡터 ----
{
  const K = 'VK-TEST-AAAA-BBBB', P = 'references/variety/report.md', D = 'bd956b56e6884b1592a6e8d71eed458e45608c5a8f8a5b12ad001a50b1c2ffa1';
  const m3 = M.mark(S, K, 'research', V, P, 3);
  assert.equal(M.subject(S, K), '32c958a2429acb2c');
  assert.equal(m3, '815145b82e057d87f0d82ce33be6da1ac7dda584921b1853d862d1dc9e0e07d3');
  assert.deepEqual([M.choice(m3, 2), M.choice(m3, 3), M.choice(m3, 4)], [0, 1, 0]);
  assert.equal(M.footerTag(S, K, 'research', V, P), '70e905b60d2a');
  assert.equal(M.mark(S, K, 'research', V, P, 'spaces:0'), '305aec42ddc86ba533c88a8e9f397b19f1ad592bf74b57b10a8ea5daf3d9049c');
  assert.equal(M.leaseSig(K, D, '2026-12-26T03:00:00Z', { research: V, presets: V }), 'e582557aaa1ad8c379d99ed5905b180ef0f514085e847843df5be23b382e6b6a');
  assert.equal(M.contentKey(CS, K, D), 'c0fc882cf537d733ec5df6cccdb0965f043f5813e0610471055d38af58fdea9f');
  assert.equal(M.linkTag(S, 'AbC123xy', '.claude/skills/shorts/SKILL.md'), 'f137ba26af5b');
  // 소문자 · 공백이 섞인 키, NFD 경로도 같은 값
  assert.equal(M.mark(S, ' vk-test- aaaa-bbbb ', 'research', V, P, 3), m3);
  assert.equal(M.mark(S, K, 'r', 'v', '한글/파일.md'.normalize('NFD'), 0), M.mark(S, K, 'r', 'v', '한글/파일.md', 0));
  console.log('PASS: §10 test vectors (subject, mark, choice, footer, spaces, lease sig, content_key, link tag)');
}

// ---- §11 고정 자료: 네 키의 사본 파일 내용이 참조 구현과 바이트 단위로 같다 ----
const MASTER = readFileSync(new URL('master.zip', FIX));
const VARIANTS = JSON.parse(readFileSync(new URL('variants.json', FIX), 'utf8'));
{
  const sums = JSON.parse(readFileSync(new URL('expected/SHA256SUMS.json', FIX), 'utf8'));
  let n = 0;
  for (const key of ['VK-TEST-AAAA-BBBB', 'VK-TEST-CCCC-DDDD', 'VK-TEST-EEEE-FFFF', 'VK-TEST-GGGG-HHHH']) {
    const vkp = M.personalCopy(MASTER, VARIANTS, { secret: S, key, pack: 'research', version: V, order: 'ORD-TEST' });
    const { files } = readZipFiles(vkp);
    assert.deepEqual([...files.keys()], ['demo.json', 'guide.md', 'references/demo/checklist.md'], 'entries sorted by path');
    for (const [name, f] of files) {
      assert.equal(sha(f.content), sums[`${key}/${name}`], `${key}/${name}`);
      assert.deepEqual(f.content, readFileSync(new URL(`expected/${key}/${name}`, FIX)));
      assert.equal(f.externalAttr >>> 16, 0o100644);
      n++;
    }
    // 결정적: 다시 만들어도 같은 바이트(같은 sha256)
    assert.equal(sha(M.personalCopy(MASTER, VARIANTS, { secret: S, key, pack: 'research', version: V, order: 'ORD-TEST' })), sha(vkp));
  }
  assert.equal(n, 12);
  // find가 마스터에 없으면 실패
  const broken = structuredClone(VARIANTS); broken.files['guide.md'].slots[0].find = '없는 문장';
  assert.throws(() => M.personalCopy(MASTER, broken, { secret: S, key: 'VK-TEST-AAAA-BBBB', pack: 'research', version: V, order: 'X' }), /find occurs 0 times/);
  assert.throws(() => M.personalCopy(buildZip([{ name: '../x.md', content: 'x' }]), {}, { secret: S, key: 'VK-TEST-AAAA-BBBB', pack: 'r', version: V, order: 'X' }), /bad entry/);
  console.log('PASS: §11 fixture — 4 keys × 3 files byte-identical to vk_mark.py, deterministic, bad variants throw');
}

// ---- 표식 지우기: 사본에서 표식을 빼면 마스터와 같다 (§12 4) ----
function unmarkMd(text, spec) {
  text = text.replace(/^<!-- 주문 \S+ 구매자용\. 공유·재배포 금지\. -->\n/, '').replace(/\n\n<!-- vk:[0-9a-f]{12} -->\n$/, '\n');
  for (const s of spec.slots ?? []) for (const a of s.alts.slice(1)) text = text.split(a).join(s.alts[0]);
  return text.split('\n').map(l => l.replace(/ {2}$/, '')).join('\n');
}

// ---- 가짜 의존성 ----
const D1 = 'a'.repeat(64), D2 = 'b'.repeat(64), D3 = 'c'.repeat(64), DX = 'd'.repeat(64);
const GOOD = 'VK-GKKD-AAAA-2345', OTHER = 'VK-THRX-BBBB-2345', REVOKED = 'VK-REVK-CCCC-2345';
const INDEX = { packs: { research: { version: V, min_kit: '1.4.2', platforms: ['mac', 'windows'], files: 3 } }, notice: '새 장르 레퍼런스가 추가되었습니다' };
function fake(over = {}) {
  const st = {
    objects: new Map([['content/index.json', JSON.stringify(INDEX)], [`content/master/research/${V}/master.zip`, MASTER], [`content/master/research/${V}/variants.json`, JSON.stringify(VARIANTS)]]),
    personal: [], leases: new Map(), touched: [], signed: [], puts: [], removed: [],
  };
  const devices = { [GOOD]: [D1, D2, D3], [OTHER]: [D3] };
  let clock = 0;
  const deps = {
    secrets: { mark: S, content: CS },
    enforce: false,
    async findLicense(key) { return { [GOOD]: { revoked: false, order_id: 'ORD-1' }, [OTHER]: { revoked: false, order_id: null }, [REVOKED]: { revoked: true, order_id: 'ORD-R' } }[key] ?? null; },
    async checkDevice(key, device) { const l = devices[key] ?? [], i = l.indexOf(device); return { rank: i < 0 ? null : i + 1, used: l.length, limit: 2 }; },
    async readIndex() { const o = st.objects.get('content/index.json'); return o === undefined ? null : JSON.parse(o); },
    async findPersonal(key) { return st.personal.filter(r => r.license_key === key).map(r => ({ ...r })); },
    async readMaster(pack, version) {
      const z = st.objects.get(`content/master/${pack}/${version}/master.zip`), v = st.objects.get(`content/master/${pack}/${version}/variants.json`);
      if (!z || !v) throw new Error('missing'); return { zip: z, variants: JSON.parse(v) };
    },
    async putPersonal(path, body) { st.puts.push(path); st.objects.set(path, body); },
    async savePersonal(row) { const r = { ...row, created_at: new Date(Date.parse('2026-12-05T00:00:00Z') + clock++).toISOString() }; st.personal.push(r); return r; },
    async removePersonal(rows) { st.removed.push(...rows.map(r => r.path)); st.personal = st.personal.filter(p => !rows.some(r => r.path === p.path)); },
    async sign(path) { st.signed.push(path); return `https://signed.example/${path}?t=600`; },
    async touchDevice(key, device, kit) { st.touched.push([key, device, kit]); },
    async recordLease(r) { const k = `${r.key}|${r.device}|${r.pack}`; const o = st.leases.get(k); st.leases.set(k, { ...r, downloads: (o?.downloads ?? 0) + (r.download ? 1 : 0) }); },
    now: Date.parse('2026-12-05T03:00:00.456Z'),
    ...over,
  };
  return { st, deps };
}
const req = (q, { key = GOOD, device = D1, headers = {} } = {}) => new Request(`https://groundrooted.com/api/videokit/content?${q}`, {
  headers: { ...(key ? { Authorization: `Bearer ${key}` } : {}), ...(device ? { 'X-VK-Device': device } : {}), ...headers },
});
// 분당 10번 카운터는 429 시험(keep)에서만 남긴다
const call = async (deps, q = 'platform=mac&kit=1.4.2', o) => { if (!deps.keep) resetLimits(); const r = await quiet(() => handleContent(req(q, o), deps)); return { status: r.status, body: await r.json(), headers: r.headers }; };
const fresh = () => { resetLimits(); resetContentLimits(); };

// ---- §12 1: 오류 응답과 검사 순서 ----
{
  fresh();
  const { deps } = fake();
  assert.deepEqual((await call(deps, undefined, { key: 'nope' })).body, { error: 'invalid_key' });
  assert.equal((await call(deps, undefined, { key: null })).status, 401);
  assert.equal((await call(deps, undefined, { key: 'VK-ZZZZ-ZZZZ-ZZZZ' })).status, 401, 'unknown key');
  assert.equal((await call(deps, undefined, { key: REVOKED })).status, 401, 'revoked key');
  // 키 형식이 맞아도 DB 오류면 503
  assert.deepEqual((await call({ ...deps, findLicense: async () => { throw new Error('db'); } })).body, { error: 'unavailable' });
  // 파라미터: platform 먼저, 그다음 기기 헤더 · kit · have
  assert.deepEqual((await call(deps, 'platform=linux&kit=1.4.2')).body, { error: 'bad_platform' });
  assert.deepEqual((await call(deps, 'kit=1.4.2')).body, { error: 'bad_platform' });
  for (const [q, o] of [['platform=mac&kit=1.4.2', { device: null }], ['platform=mac&kit=1.4.2', { device: 'xyz' }], ['platform=mac', {}], ['platform=mac&kit=1.4.2 beta', {}],
    ['platform=mac&kit=1.4.2&have=research', {}], ['platform=mac&kit=1.4.2&have=research:1.0', {}], ['platform=mac&kit=1.4.2&have=Research:2026.12.05-1', {}]]) {
    const r = await call(deps, q, o);
    assert.equal(r.status, 400, q); assert.deepEqual(r.body, { error: 'bad_request' }, q);
  }
  // 기기: 미등록 403(v2와 같은 본문), 한도 밖은 스위치가 켜져 있을 때만 403
  const un = await call(deps, undefined, { device: DX });
  assert.equal(un.status, 403); assert.equal(un.body.error, 'device_unregistered'); assert.equal(un.body.used, 3); assert.equal(un.body.limit, 2);
  const over = await call({ ...deps, enforce: true }, undefined, { device: D3 });
  assert.equal(over.status, 403); assert.deepEqual(over.body, { error: 'device_limit', limit: 2, used: 3, manage_url: 'https://groundrooted.com/videokit#contact' });
  assert.equal((await call({ ...deps, enforce: false }, undefined, { device: D3 })).status, 200, 'over the limit but switch off: served');
  assert.equal((await call({ ...deps, checkDevice: async () => { throw new Error('db'); } })).status, 503);
  console.log('PASS: content 401 (format, unknown, revoked) · 400 (bad_platform, header, kit, have) · 403 (unregistered, device_limit)');
}

// 429: /latest와 같은 키당 분당 10번 카운터
{
  fresh();
  const { deps } = fake();
  for (let i = 0; i < 10; i++) tooMany(GOOD, deps.now);   // /latest가 10번 부른 것과 같다
  const r = await call({ ...deps, keep: true });
  assert.equal(r.status, 429); assert.deepEqual(r.body, { error: 'rate_limited' }); assert.equal(r.headers.get('retry-after'), '60');
  assert.equal((await call({ ...deps, keep: true }, undefined, { key: OTHER, device: D3 })).status, 200, 'other key has its own counter');
  console.log('PASS: content 429 shares the /latest per-key counter');
}

// 503 no_content · unavailable
{
  fresh();
  let { st, deps } = fake(); st.objects.delete('content/index.json');
  assert.deepEqual((await call(deps)).body, { error: 'no_content' });
  ({ deps } = fake());
  assert.deepEqual((await call(deps, 'platform=mac&kit=1.4.1')).body, { error: 'no_content' }, 'min_kit 1.4.2 > kit 1.4.1');
  assert.equal((await call(deps, 'platform=mac&kit=1.4.10')).status, 200, '1.4.10 >= 1.4.2 (numeric parts)');
  ({ st, deps } = fake()); st.objects.set('content/index.json', JSON.stringify({ packs: { research: { ...INDEX.packs.research, platforms: ['windows'] } } }));
  assert.deepEqual((await call(deps)).body, { error: 'no_content' }, 'no pack for this platform');
  ({ st, deps } = fake()); st.objects.set('content/index.json', JSON.stringify({ packs: { research: { ...INDEX.packs.research, version: '../x' } } }));
  assert.deepEqual((await call(deps)).body, { error: 'unavailable' }, 'malformed index');
  assert.deepEqual((await call({ ...deps, readIndex: async () => { throw new Error('bucket'); } })).body, { error: 'unavailable' });
  // §12 5: find가 없는 변형 파일 → 사본 실패 → 503, 마스터도 사본도 나가지 않음
  ({ st, deps } = fake());
  const broken = structuredClone(VARIANTS); broken.files['guide.md'].slots[1].find = '마스터에 없는 문장';
  st.objects.set(`content/master/research/${V}/variants.json`, JSON.stringify(broken));
  assert.deepEqual((await call(deps)).body, { error: 'unavailable' });
  assert.deepEqual(st.signed, [], 'nothing signed'); assert.deepEqual(st.puts, [], 'no copy uploaded'); assert.equal(st.personal.length, 0);
  // 업로드 · 서명 실패도 503
  ({ deps } = fake());
  assert.equal((await call({ ...deps, putPersonal: async () => { throw new Error('quota'); } })).status, 503);
  assert.equal((await call({ ...deps, sign: async () => null })).status, 503);
  console.log('PASS: content 503 no_content (no index, min_kit, platform) · unavailable (malformed index, bucket, bad variants → master never sent)');
}

// ---- §12 2 · 3 · 4: 정상 응답 ----
{
  fresh();
  const { st, deps } = fake();
  const r = await call(deps);
  assert.equal(r.status, 200);
  assert.deepEqual(Object.keys(r.body), ['lease', 'content_key', 'packs', 'notice']);
  assert.deepEqual(r.body.lease, { issued_at: '2026-12-05T03:00:00Z', renew_after: '2026-12-12T03:00:00Z', expires_at: '2026-12-26T03:00:00Z',
    sig: createHmac('sha256', GOOD).update(`${D1}|2026-12-26T03:00:00Z|research:${V}`).digest('hex') });
  assert.equal(r.body.content_key, M.contentKey(CS, GOOD, D1));
  assert.equal(r.body.notice, INDEX.notice);
  const [p] = r.body.packs;
  assert.deepEqual(Object.keys(p), ['id', 'version', 'size', 'sha256', 'files', 'min_kit', 'url']);
  assert.deepEqual({ ...p, url: undefined, size: undefined, sha256: undefined }, { id: 'research', version: V, files: 3, min_kit: '1.4.2', url: undefined, size: undefined, sha256: undefined });
  const path = `content/personal/${M.subject(S, GOOD)}/research-${V}.vkp`;
  assert.equal(p.url, `https://signed.example/${path}?t=600`);
  const got = st.objects.get(path);
  assert.equal(sha(got), p.sha256); assert.equal(got.length, p.size, 'downloaded bytes = response sha256 · size');
  assert.ok(!path.includes(GOOD), 'bucket path has no key');
  // 표식: 머리말의 주문번호 = 라이선스 order_id, 표식을 빼면 마스터와 같음
  const mine = readZipFiles(got).files, master = readZipFiles(MASTER).files;
  assert.ok(mine.get('guide.md').content.toString().startsWith('<!-- 주문 ORD-1 구매자용. 공유·재배포 금지. -->\n'));
  for (const f of ['guide.md', 'references/demo/checklist.md'])
    assert.equal(unmarkMd(mine.get(f).content.toString(), VARIANTS.files[f]), master.get(f).content.toString(), `${f} minus marks = master`);
  const j = JSON.parse(mine.get('demo.json').content), jm = JSON.parse(master.get('demo.json').content);
  delete j.about.look; delete jm.about.look; assert.deepEqual(j, jm, 'json values equal except about.look');
  assert.deepEqual(st.touched, [[GOOD, D1, '1.4.2']]);
  assert.equal(st.leases.get(`${GOOD}|${D1}|research`).downloads, 1);
  assert.equal(st.leases.get(`${GOOD}|${D1}|research`).expiresAt, '2026-12-26T03:00:00Z');

  // have가 최신이면 url null, 임대만 새로(다운로드 수는 그대로), 사본은 다시 만들지 않음
  const again = await call({ ...deps, now: deps.now + 8 * 86400_000 }, `platform=mac&kit=1.4.2&have=research:${V}`);
  assert.equal(again.status, 200); assert.equal(again.body.packs[0].url, null);
  assert.equal(again.body.packs[0].sha256, p.sha256); assert.equal(again.body.lease.expires_at, '2027-01-03T03:00:00Z');
  assert.equal(st.leases.get(`${GOOD}|${D1}|research`).downloads, 1); assert.equal(st.puts.length, 1);
  // have가 옛 버전이면 다시 링크
  assert.ok((await call(deps, 'platform=mac&kit=1.4.2&have=research:2026.11.01-1')).body.packs[0].url);

  // 같은 구매자 다른 기기: 같은 사본(sha256), 다른 content_key. 같은 (키, 기기)는 늘 같은 content_key
  const other = await call(deps, undefined, { device: D2 });
  assert.equal(other.body.packs[0].sha256, p.sha256); assert.notEqual(other.body.content_key, r.body.content_key);
  assert.equal((await call(deps)).body.content_key, r.body.content_key);
  assert.equal(st.puts.length, 1, 'one copy per buyer');
  // 다른 구매자: 다른 sha256, 주문번호가 없으면 TEST-<키 끝 4자>
  const b = await call(deps, undefined, { key: OTHER, device: D3 });
  assert.notEqual(b.body.packs[0].sha256, p.sha256);
  assert.ok(readZipFiles(st.objects.get(`content/personal/${M.subject(S, OTHER)}/research-${V}.vkp`)).files.get('guide.md').content.toString().startsWith('<!-- 주문 TEST-2345 '));
  console.log('PASS: content 200 — lease times/sig/content_key, signed copy sha256 = response, have → url null, same buyer same copy, other buyer different, marks strip to master');
}

// notice가 평문이 아니면 비움 · 새 버전이 나오면 새 사본, 30일 뒤 옛 사본 정리 · 사본 만들기 하루 20번
{
  fresh();
  let { st, deps } = fake();
  st.objects.set('content/index.json', JSON.stringify({ ...INDEX, notice: '<b>새 소식</b>' }));
  assert.equal((await call(deps)).body.notice, '');
  const V2 = '2026.12.20-1';
  st.objects.set(`content/master/research/${V2}/master.zip`, MASTER); st.objects.set(`content/master/research/${V2}/variants.json`, JSON.stringify(VARIANTS));
  st.objects.set('content/index.json', JSON.stringify({ packs: { research: { ...INDEX.packs.research, version: V2 } } }));
  const n = await call(deps, `platform=mac&kit=1.4.2&have=research:${V}`);
  assert.equal(n.body.packs[0].version, V2); assert.ok(n.body.packs[0].url, 'new version → new link');
  assert.equal(st.personal.length, 2); assert.deepEqual(st.removed, []);
  await call({ ...deps, now: Date.parse('2027-01-10T00:00:00Z') });   // 새 사본 created_at + 30일 넘음
  assert.deepEqual(st.removed, [`content/personal/${M.subject(S, GOOD)}/research-${V}.vkp`]); assert.equal(st.personal.length, 1);

  fresh();
  ({ st, deps } = fake());
  const forget = { ...deps, findPersonal: async () => [] };   // 매번 새로 만든다(만들기 횟수 시험)
  for (let i = 0; i < MAKE_LIMIT; i++) assert.equal((await call({ ...forget, now: deps.now + i * 61_000 })).status, 200);
  const lim = await call({ ...forget, now: deps.now + MAKE_LIMIT * 61_000 });
  assert.equal(lim.status, 429); assert.equal(lim.headers.get('retry-after'), '3600');
  console.log('PASS: content notice sanitised, new pack version → new copy, old copy removed after 30 days, copy making 20/day → 429');
}

// ---- §12 7: 검출 (1,000명 키, 사본은 50명만 실제로) ----
// 키트 vk_mark.observe_md와 같은 읽기
function observeMd(leaked, masterText, spec, path) {
  const obs = [], lit = [];
  const hm = /^<!-- 주문 (\S+) 구매자용\. 공유·재배포 금지\. -->\n/.exec(leaked); if (hm) lit.push({ order_id: hm[1] });
  const fm = /\n?<!-- vk:([0-9a-f]{12}) -->\n?$/.exec(leaked); if (fm) lit.push({ path, tag: fm[1] });
  const flat = leaked.replace(/[ \t]+/g, ' ');
  (spec.slots ?? []).forEach((s, n) => {
    const hits = s.alts.map((a, i) => (leaked.includes(a) || flat.includes(a.replace(/[ \t]+/g, ' ')) ? i : -1)).filter(i => i >= 0);
    if (hits.length === 1) obs.push({ path, slot: String(n), value: hits[0], n: s.alts.length });
  });
  const ml = masterText.split('\n'), index = new Map();
  for (const l of leaked.split('\n')) { const k = l.replace(/\s+$/, ''); index.set(k, [...(index.get(k) ?? []), l]); }
  M.spaceLines(masterText, spec).forEach((li, i) => {
    const c = index.get(ml[li]) ?? [];
    if (c.length === 1) { const tail = c[0].length - c[0].replace(/ +$/, '').length; if (tail === 0 || tail === 2) obs.push({ path, slot: `spaces:${i}`, value: tail === 2 ? 1 : 0, n: 2 }); }
  });
  return { obs, lit };
}
function synth(name, slots, spaces) {
  const lines = [`# ${name}`, ''], spec = { header: true, footer: true, spaces, slots: [] };
  for (let i = 0; i < slots; i++) {
    const n = 2 + (i % 3), alts = Array.from({ length: n }, (_, k) => `${name}표현${'가나다라'[k]}${i}끝`);
    lines.push(`문단 ${i}: 이 부분은 ${alts[0]} 설명입니다.`, `보충 문장 ${name} ${i}.`, '');
    spec.slots.push({ find: alts[0], alts });
  }
  return { text: lines.join('\n'), spec };
}
{
  fresh();
  const long1 = synth('long1', 20, 10), long2 = synth('long2', 20, 10), short = synth('short', 3, 2);
  const files = { 'long1.md': long1, 'long2.md': long2, 'short.md': short };
  const master = buildZip(Object.entries(files).map(([name, f]) => ({ name, content: f.text })));
  const variants = { files: Object.fromEntries(Object.entries(files).map(([n, f]) => [n, f.spec])) };
  const keys = Array.from({ length: 1000 }, (_, i) => ({ key: newKey(), order_id: `ORD-${i}`, email: `buyer${i}@example.com` }));
  const copies = new Map(keys.slice(0, 50).map(k => [k.key, readZipFiles(M.personalCopy(master, variants, { secret: S, key: k.key, pack: 'research', version: V, order: k.order_id })).files]));
  const leak = (k, name) => copies.get(k.key).get(name).content.toString();
  const TOKEN = 'admin-token-' + 'x'.repeat(40);
  const deps = { token: TOKEN, secret: S, listKeys: async () => keys, listLinks: async () => [{ code: 'ABCD2345', order_id: 'ORD-7', email: 'buyer7@example.com' }, { code: 'EFGH2345', order_id: 'ORD-8', email: null }], now: 0 };
  let t = 0;
  const post = async (body, token = TOKEN) => { resetContentLimits(); const r = await quiet(() => handleTrace(new Request('https://x/api/videokit/admin/trace', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(body) }), { ...deps, now: t++ })); return { status: r.status, body: await r.json() }; };
  const observe = (text, name) => observeMd(text, files[name].text, files[name].spec, name);

  // 20비트 이상 md 하나 → 그 구매자 1순위 match, 머리말 · 끝 주석 리터럴도 맞음
  const a = keys[3], o1 = observe(leak(a, 'long1.md'), 'long1.md');
  const r1 = await post({ pack: 'research', version: V, observations: o1.obs, literal: o1.lit });
  assert.equal(r1.status, 200); assert.equal(r1.body.verdict, 'match'); assert.equal(r1.body.candidates[0].order_id, 'ORD-3');
  assert.equal(r1.body.candidates[0].matched, o1.obs.length); assert.equal(r1.body.candidates[0].email_hint, 'b***@e***.com');
  assert.ok(r1.body.candidates[0].p_false < 1e-3); assert.ok(r1.body.candidates.length <= 3);
  assert.deepEqual(r1.body.literal_hits, [{ order_id: 'ORD-3', where: 'header' }, { order_id: 'ORD-3', where: 'footer long1.md' }]);
  // 짧은 파일 하나 → 판정 불가
  const o2 = observe(leak(a, 'short.md'), 'short.md');
  assert.equal((await post({ pack: 'research', version: V, observations: o2.obs })).body.verdict, 'inconclusive');
  // 머리말 · 끝 주석 · 끝 공백을 지운 사본도 slots만으로 1순위
  const stripped = leak(a, 'long1.md').replace(/^<!--.*-->\n/, '').replace(/\n\n<!-- vk:.* -->\n$/, '\n').split('\n').map(l => l.trimEnd()).join('\n');
  const o3 = observe(stripped, 'long1.md');
  const r3 = await post({ pack: 'research', version: V, observations: o3.obs.filter(o => !o.slot.startsWith('spaces')) });
  assert.equal(r3.body.verdict, 'match'); assert.equal(r3.body.candidates[0].order_id, 'ORD-3');
  // 두 구매자 사본을 섞으면 1 · 2순위가 그 둘
  const b = keys[17], mixed = [...observe(leak(a, 'long1.md'), 'long1.md').obs, ...observe(leak(b, 'long2.md'), 'long2.md').obs];
  const r4 = await post({ pack: 'research', version: V, observations: mixed });
  assert.deepEqual(r4.body.candidates.slice(0, 2).map(c => c.order_id).sort(), ['ORD-17', 'ORD-3']);
  // /d/ 링크 태그
  const tags = [{ path: '.claude/skills/shorts/SKILL.md', slot: 'link', value: M.linkTag(S, 'ABCD2345', '.claude/skills/shorts/SKILL.md') }];
  assert.deepEqual((await post({ source: 'link', observations: tags })).body, { link_hits: [{ order_id: 'ORD-7', email_hint: 'b***@e***.com', matched: 1, total: 1 }] });
  // 관리 토큰만: 구매자 키 · 틀린 토큰 · 토큰 미설정은 401, 형식이 틀리면 400, 토큰당 분당 5번
  assert.equal((await post({ pack: 'research', version: V, observations: [] }, keys[0].key)).status, 401);
  assert.equal((await post({ pack: 'research', version: V, observations: [] }, 'wrong')).status, 401);
  assert.equal((await quiet(() => handleTrace(new Request('https://x', { method: 'POST', headers: { Authorization: 'Bearer ' }, body: '{}' }), { ...deps, token: '' }))).status, 401);
  for (const bad of [{ pack: 'research', version: 'x', observations: [] }, { pack: 'research', version: V, observations: [{ path: 'a', slot: '0', value: 2, n: 2 }] }, { pack: 'research', version: V }, { source: 'link', observations: [{ path: 'a', value: 'zz' }] }])
    assert.equal((await post(bad)).status, 400, JSON.stringify(bad));
  resetContentLimits();
  const once = () => quiet(() => handleTrace(new Request('https://x', { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}` }, body: JSON.stringify({ pack: 'research', version: V, observations: [] }) }), { ...deps, now: 1 }));
  for (let i = 0; i < 5; i++) assert.equal((await once()).status, 200);
  assert.equal((await once()).status, 429);
  assert.equal(emailHint('alice@gmail.com'), 'a***@g***.com'); assert.equal(emailHint(null), '');
  console.log('PASS: trace — 1,000 keys: long md → match, short → inconclusive, stripped copy → match on slots, mixed → top 2, link tag, admin token only');
}
