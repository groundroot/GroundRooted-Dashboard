// 키트 짧은 다운로드 링크 /d/<코드>. 네트워크 없이 돈다 (Supabase · Resend 호출은 가짜 fetch로 받는다).
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  newCode, normalizeCode, CODE_PATTERN, linkUrl, expiryFor, kstDay, maskName, isCurrent, fileName,
  loadLink, handleDownload, downloadPage, resetLimits, createLink, revokeLink, supabaseLinkDeps, clientIp, ipBlocked, SIGN_SECONDS, DEFAULT_MAX_DOWNLOADS,
} from '../products/videokit-link.ts';
import { db } from '../products/videokit-license.ts';
import { deliverKit, kitEmail } from '../products/videokit-delivery.ts';
import { makeOrderId, plans } from '../products/videokit.ts';

// ---- 코드 · 날짜 · 이름 ----
{
  const codes = new Set();
  for (let i = 0; i < 2000; i++) { const c = newCode(); assert.match(c, CODE_PATTERN); assert.equal(c.length, 8); assert.ok(!/[01OIl]/.test(c), c); codes.add(c); }
  assert.equal(codes.size, 2000);
  assert.equal(normalizeCode('  abcd2345 '), 'ABCD2345');
  assert.ok(CODE_PATTERN.test('ABCD2345'));
  for (const c of ['ABCDEF', 'ABCD234', 'ABCD23456', 'ABCD234O', 'ABCD2340', 'ABCD2341', 'ABCD234I', 'abcd2345', 'ABCD-234', '']) assert.ok(!CODE_PATTERN.test(c), c);
  assert.equal(linkUrl('ABCD2345'), 'https://groundrooted.com/d/ABCD2345');
  // 2026-11-27 15:00 KST 발급 → 12월 4일 23:59:59 KST(= 14:59:59 UTC)에 만료
  const issued = Date.parse('2026-11-27T06:00:00Z');
  assert.equal(new Date(expiryFor(issued)).toISOString(), '2026-12-04T14:59:59.000Z');
  assert.equal(kstDay(expiryFor(issued)), '2026년 12월 4일');
  // 자정 직후(KST) 발급도 KST 날짜로 센다: 11-27 00:30 KST(= 11-26 15:30 UTC) → 12월 4일
  assert.equal(kstDay(expiryFor(Date.parse('2026-11-26T15:30:00Z'))), '2026년 12월 4일');
  assert.equal(kstDay(expiryFor(issued, 1)), '2026년 11월 28일');
  assert.equal(maskName('강성철 (시험)'), '강*철 (시험)');
  assert.equal(maskName('김철'), '김*'); assert.equal(maskName('남궁민수'), '남**수'); assert.equal(maskName('김'), '김');
  assert.equal(maskName(''), ''); assert.equal(maskName(null), ''); assert.equal(maskName('  Jane Doe '), 'J**e Doe');
  assert.equal(fileName('mac', '1.3'), 'ClaudeVideoKit-Mac-1.3.zip'); assert.equal(fileName('windows', '1.3'), 'ClaudeVideoKit-Windows-1.3.zip');
  console.log('PASS: link code, expiry date (KST), name mask');
}

const CURRENT = { version: '1.3', mac: { path: 'kit/links/1.3/ClaudeVideoKit-Mac-1.3.zip' }, windows: { path: 'kit/links/1.3/ClaudeVideoKit-Windows-1.3.zip' } };
{
  assert.ok(isCurrent(CURRENT));
  for (const bad of [null, {}, { ...CURRENT, version: '1.3-beta' }, { ...CURRENT, version: '' }, { ...CURRENT, mac: undefined }, { ...CURRENT, windows: { path: 'releases/x.zip' } },
    { ...CURRENT, mac: { path: 'kit/../secret.zip' } }, { ...CURRENT, mac: { path: 'kit/links/1.3/x.json' } }, { ...CURRENT, mac: { path: 3 } }]) assert.equal(isCurrent(bad), false, JSON.stringify(bad));
  console.log('PASS: kit/current.json validation');
}

// ---- 페이지 · 버튼 (가짜 의존성) ----
const NOW = Date.parse('2026-11-27T06:00:00Z');
const GOOD = 'ABCD2345', OLD = 'QLDC2345', REVOKED = 'REVK2345', FULL = 'FULL2345';
const row = (code, over = {}) => ({ code, email: 'a@b.co', name: '강성철 (시험)', order_id: 'TEST-LINK-1', expires_at: new Date(expiryFor(NOW)).toISOString(), revoked: false, download_count: 0, max_downloads: 10, ...over });
function fake(over = {}) {
  const calls = { find: [], remove: [], hit: [], sign: [] };
  const rows = { [GOOD]: row(GOOD), [OLD]: row(OLD, { expires_at: new Date(NOW - 1000).toISOString() }), [REVOKED]: row(REVOKED, { revoked: true }), [FULL]: row(FULL, { download_count: 10 }) };
  const deps = {
    find: async c => { calls.find.push(c); return rows[c] ?? null; },
    remove: async c => { calls.remove.push(c); },
    hit: async (c, n) => { calls.hit.push([c, n]); },
    readCurrent: async () => CURRENT,
    sign: async (p, s, d) => { calls.sign.push([p, s, d]); return `https://x.supabase.co/storage/v1/object/sign/videokit/${p}?token=t&download=${d}`; },
    now: NOW,
    ...over,
  };
  return { deps, calls };
}

{
  let { deps, calls } = fake();
  assert.deepEqual(await loadLink('abcd2345', deps), { status: 'ok', code: GOOD, name: '강*철 (시험)', version: '1.3', expiresAt: expiryFor(NOW) });
  assert.equal(calls.sign.length, 0, 'page view does not sign'); assert.equal(calls.hit.length, 0, 'page view is not counted');
  // 만료 → gone + 행 삭제
  ({ deps, calls } = fake());
  assert.deepEqual(await loadLink(OLD, deps), { status: 'gone' }); assert.deepEqual(calls.remove, [OLD]);
  // 없음 · 막힘 → gone
  for (const c of ['ZZZZ2345', REVOKED]) { ({ deps } = fake()); assert.deepEqual(await loadLink(c, deps), { status: 'gone' }, c); }
  // 형식이 틀린 코드는 DB까지 가지 않는다
  ({ deps, calls } = fake());
  for (const c of ['', 'x', '0000OOOO', '../etc', 42, undefined]) assert.deepEqual(await loadLink(c, deps), { status: 'gone' });
  assert.equal(calls.find.length, 0);
  // DB 오류 · current.json 없음/형식 틀림은 '만료'가 아니라 unavailable
  const quiet = console.error; console.error = () => {};
  try {
    ({ deps } = fake({ find: async () => { throw new Error('relation does not exist'); } })); assert.deepEqual(await loadLink(GOOD, deps), { status: 'unavailable' });
    ({ deps } = fake({ readCurrent: async () => { throw new Error('not found'); } })); assert.deepEqual(await loadLink(GOOD, deps), { status: 'unavailable' });
    ({ deps } = fake({ readCurrent: async () => ({ version: '1.3' }) })); assert.deepEqual(await loadLink(GOOD, deps), { status: 'unavailable' });
  } finally { console.error = quiet; }
  console.log('PASS: page (ok, expired, missing, revoked, bad code, db error)');
}

let clock = NOW;
const dl = async (code, platform, over) => { const f = fake(over); f.deps.now = (clock += 61_000); const r = await handleDownload(code, platform, f.deps); return { r, ...f }; };
{
  resetLimits();
  // 정상: 10분 서명 링크로 303, 파일 이름 ClaudeVideoKit-Mac-1.3.zip, 횟수 +1
  let { r, calls } = await dl('abcd2345', 'mac');
  assert.equal(r.status, 303); assert.equal(r.headers.get('cache-control'), 'no-store');
  assert.equal(r.headers.get('location'), 'https://x.supabase.co/storage/v1/object/sign/videokit/kit/links/1.3/ClaudeVideoKit-Mac-1.3.zip?token=t&download=ClaudeVideoKit-Mac-1.3.zip');
  assert.deepEqual(calls.sign, [['kit/links/1.3/ClaudeVideoKit-Mac-1.3.zip', 600, 'ClaudeVideoKit-Mac-1.3.zip']]); assert.equal(SIGN_SECONDS, 600);
  assert.deepEqual(calls.hit, [[GOOD, 1]]);
  ({ r, calls } = await dl(GOOD, 'windows'));
  assert.equal(r.status, 303); assert.deepEqual(calls.sign, [['kit/links/1.3/ClaudeVideoKit-Windows-1.3.zip', 600, 'ClaudeVideoKit-Windows-1.3.zip']]);
  // 만료 · 없음 · 막힘 · 틀린 OS · 틀린 코드 → 페이지로 303 ("링크가 만료되었습니다"), 서명 · 기록 없음
  for (const [code, platform] of [[OLD, 'mac'], ['ZZZZ2345', 'mac'], [REVOKED, 'windows'], [GOOD, 'linux'], [GOOD, 'MAC'], ['0000OOOO', 'mac']]) {
    ({ r, calls } = await dl(code, platform));
    assert.equal(r.status, 303, `${code} ${platform}`); assert.equal(r.headers.get('location'), `/d/${normalizeCode(code)}`);
    assert.equal(calls.sign.length, 0); assert.equal(calls.hit.length, 0);
  }
  ({ calls } = await dl(OLD, 'mac')); assert.deepEqual(calls.remove, [OLD], 'expired link is deleted');
  // 링크당 횟수 상한(기본 10, max_downloads): 10번째까지 받고 넘으면 429 "다운로드 횟수를 넘었습니다" (서명하지 않음)
  assert.equal(DEFAULT_MAX_DOWNLOADS, 10);
  ({ r, calls } = await dl(FULL, 'mac'));
  assert.equal(r.status, 429); assert.match(await r.text(), /다운로드 횟수를 넘었습니다.*메일에 답장하거나 카카오톡/); assert.equal(calls.sign.length, 0); assert.equal(calls.hit.length, 0);
  ({ r, calls } = await dl(FULL, 'mac', { find: async () => row(FULL, { download_count: 9 }) }));
  assert.equal(r.status, 303); assert.deepEqual(calls.hit, [[FULL, 10]], '10th download is allowed');
  ({ r } = await dl(FULL, 'mac', { find: async () => row(FULL, { download_count: 10, max_downloads: 25 }) }));
  assert.equal(r.status, 303, 'custom --max is respected');
  // DB 오류 · current.json 문제 · 서명 실패 → 503, 횟수는 올리지 않음
  const quiet = console.error; console.error = () => {};
  try {
    for (const over of [{ find: async () => { throw new Error('db'); } }, { readCurrent: async () => { throw new Error('missing'); } }, { readCurrent: async () => ({ ...CURRENT, version: 'v 1' }) }, { sign: async () => null }, { sign: async () => { throw new Error('x'); } }]) {
      ({ r, calls } = await dl(GOOD, 'mac', over));
      assert.equal(r.status, 503); assert.match(r.headers.get('content-type'), /text\/html/); assert.equal(calls.hit.length, 0);
    }
    // 기록 실패는 다운로드를 막지 않는다
    ({ r } = await dl(GOOD, 'mac', { hit: async () => { throw new Error('x'); } })); assert.equal(r.status, 303);
  } finally { console.error = quiet; }
  // GET /d/<코드>/<os>(메일 검사기 · 미리보기가 주소를 따라감)는 세지 않고 페이지로 돌려보낸다. DB에도 가지 않는다.
  { const g = downloadPage('abcd2345'); assert.equal(g.status, 303); assert.equal(g.headers.get('location'), `/d/${GOOD}`); assert.equal(g.headers.get('cache-control'), 'no-store'); }
  console.log('PASS: download button (ok, expired, missing, revoked, platform, cap, errors, GET not counted)');
}

// ---- 요청 수 제한: 링크 하나당 1분에 10번 ----
{
  resetLimits();
  const { deps, calls } = fake();
  const at = async (now, code = GOOD) => { deps.now = now; return handleDownload(code, 'mac', deps); };
  for (let i = 0; i < 10; i++) assert.equal((await at(NOW + i * 1000)).status, 303, `req ${i + 1}`);
  const r = await at(NOW + 10_000);
  assert.equal(r.status, 429); assert.equal(r.headers.get('retry-after'), '60'); assert.match(await r.text(), /요청이 너무 많습니다/);
  assert.equal(calls.find.length, 10, 'limited request does not hit the DB');
  { const other = await at(NOW + 10_000, 'ZZZZ2345'); assert.equal(other.status, 303, 'other codes are counted separately'); assert.equal(other.headers.get('location'), '/d/ZZZZ2345'); }
  assert.equal((await at(NOW + 61_000)).status, 303, 'window slides after a minute');
  console.log('PASS: download rate limit');
}

// ---- 코드 추측 막기: 한 IP가 10분에 없는 · 만료 코드를 10번 요청하면 그 IP의 /d/* 요청을 막는다 ----
{
  resetLimits();
  const { deps, calls } = fake();
  const IP = '203.0.113.7', OTHER = '198.51.100.9';
  // 추측: 없는 코드 · 형식이 틀린 코드 · 만료 코드를 섞어 10번
  const guesses = ['ZZZZ2345', 'ZZZZ2346', '0000OOOO', OLD, 'ZZZZ2347', REVOKED, 'ZZZZ2348', 'ZZZZ2349', 'ZZZZ234A', 'ZZZZ234B'];
  for (const [i, g] of guesses.entries()) {
    deps.now = NOW + i * 1000;
    const r = i % 2 ? await handleDownload(g, 'mac', deps, IP) : await loadLink(g, deps, IP);
    assert.equal(r.status, i % 2 ? 303 : 'gone', `guess ${i + 1}`);
  }
  assert.equal(ipBlocked(IP, NOW + 10_000), true);
  const before = calls.find.length;
  deps.now = NOW + 11_000;
  // 막힌 뒤에는 맞는 코드도 DB에 가지 않고 막힌다 (페이지 'limited', 버튼 429)
  assert.deepEqual(await loadLink(GOOD, deps, IP), { status: 'limited' });
  const blocked = await handleDownload(GOOD, 'mac', deps, IP);
  assert.equal(blocked.status, 429); assert.equal(blocked.headers.get('retry-after'), '600'); assert.equal(blocked.headers.get('cache-control'), 'no-store');
  assert.equal(calls.find.length, before, 'blocked IP does not reach the DB');
  // 다른 IP · 맞는 코드는 그대로
  assert.equal((await handleDownload(GOOD, 'mac', deps, OTHER)).status, 303);
  // 맞는 코드 요청은 실패로 세지 않는다
  for (let i = 0; i < 9; i++) { deps.now = NOW + 20_000 + i * 1000; assert.equal((await loadLink(GOOD, deps, OTHER)).status, 'ok'); }
  assert.equal(ipBlocked(OTHER, deps.now), false);
  // 10분이 지나면 풀린다
  deps.now = NOW + 9 * 1000 + 10 * 60_000;
  assert.equal((await loadLink(GOOD, deps, IP)).status, 'ok');
  // IP는 x-real-ip, 없으면 x-forwarded-for의 첫 값
  assert.equal(clientIp(new Headers({ 'x-real-ip': '203.0.113.7', 'x-forwarded-for': '1.1.1.1' })), '203.0.113.7');
  assert.equal(clientIp(new Headers({ 'x-forwarded-for': '203.0.113.8, 10.0.0.1' })), '203.0.113.8');
  assert.equal(clientIp(new Headers()), undefined);
  console.log('PASS: code guessing is blocked per IP (10 misses / 10 min)');
}

// ---- 가짜 Supabase · Resend (실제 supabase-js가 만드는 요청을 받는다) ----
function filter(url, rows) {
  let out = rows;
  for (const [k, v] of url.searchParams) {
    if (['select', 'order', 'limit', 'columns'].includes(k)) continue;
    const i = v.indexOf('.'); const op = v.slice(0, i), val = v.slice(i + 1);
    out = out.filter(r => { const x = String(r[k]); return op === 'eq' ? x === val : op === 'lt' ? x < val : op === 'lte' ? x <= val : op === 'gt' ? x > val : true; });
  }
  const order = url.searchParams.get('order');
  if (order) { const [col, dir] = order.split('.'); out = [...out].sort((a, b) => (a[col] < b[col] ? -1 : 1) * (dir === 'desc' ? -1 : 1)); }
  const limit = url.searchParams.get('limit');
  return limit ? out.slice(0, Number(limit)) : out;
}
function fakeBackend({ linksMissing = false } = {}) {
  const tables = { videokit_licenses: [], videokit_download_links: [] }, mails = [], log = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    const method = (init.method || 'GET').toUpperCase();
    log.push(`${method} ${url.pathname}${url.search}`);
    const ok = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
    if (url.hostname === 'api.resend.com') { mails.push(JSON.parse(init.body)); return ok({ id: 'm1' }); }
    if (url.pathname.startsWith('/storage/v1/object/sign/')) return ok({ signedURL: `/object/sign/${url.pathname.split('/object/sign/')[1]}?token=t` });
    if (url.pathname === '/storage/v1/object/videokit/kit/current.json') return new Response(JSON.stringify(CURRENT), { status: 200 });
    const table = url.pathname.replace('/rest/v1/', '');
    if (table in tables) {
      if (table === 'videokit_download_links' && linksMissing) return ok({ code: '42P01', message: 'relation "videokit_download_links" does not exist' }, 404);
      const rows = tables[table];
      if (method === 'GET') return ok(filter(url, rows));
      if (method === 'POST') {
        const r = JSON.parse(init.body);
        const pk = table === 'videokit_licenses' ? 'key' : 'code';
        if (rows.some(x => x[pk] === r[pk] || (table === 'videokit_licenses' && x.order_id === r.order_id))) return ok({ code: '23505', message: 'duplicate key' }, 409);
        rows.push(table === 'videokit_licenses' ? { revoked: false, ...r } : { created_at: new Date().toISOString(), revoked: false, download_count: 0, max_downloads: 10, last_download_at: null, ...r });
        return new Response(null, { status: 201 });
      }
      if (method === 'PATCH') { const patch = JSON.parse(init.body); const hit = filter(url, rows); hit.forEach(r => Object.assign(r, patch)); return url.searchParams.has('select') ? ok(hit) : new Response(null, { status: 204 }); }
      if (method === 'DELETE') { const gone = new Set(filter(url, rows)); tables[table] = rows.filter(r => !gone.has(r)); return new Response(null, { status: 204 }); }
    }
    return ok({ message: `unexpected ${method} ${url.pathname}` }, 500);
  };
  return { tables, mails, log };
}
Object.assign(process.env, { SUPABASE_URL: 'https://fake.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service-role-test', RESEND_API_KEY: 're_test', VIDEOKIT_MAIL_FROM: 'kit@groundrooted.com' });

// 발급: 새 링크 · 같은 주문 재사용(reuse) · 만료 행 정리 · 그리고 운영용 의존성으로 페이지 → 버튼 끝까지
{
  const be = fakeBackend();
  const sb = db();
  be.tables.videokit_download_links.push(row('OLDA2345', { expires_at: new Date(Date.now() - 1000).toISOString() }));
  const a = await createLink(sb, { email: 'christvictory@gmail.com', name: '강성철 (시험)', orderId: 'TEST-LINK-1' });
  assert.equal(be.tables.videokit_download_links.find(r => r.code === a.code).max_downloads, 10);
  assert.ok(a.created && CODE_PATTERN.test(a.code)); assert.equal(a.url, `https://groundrooted.com/d/${a.code}`);
  assert.ok(!be.tables.videokit_download_links.some(r => r.code === 'OLDA2345'), 'expired rows are cleaned up on issue');
  const stored = be.tables.videokit_download_links.find(r => r.code === a.code);
  assert.deepEqual({ email: stored.email, name: stored.name, order_id: stored.order_id }, { email: 'christvictory@gmail.com', name: '강성철 (시험)', order_id: 'TEST-LINK-1' });
  assert.equal(Date.parse(stored.expires_at), a.expiresAt); assert.equal(a.expiresAt, expiryFor(Date.now()));
  assert.deepEqual(await createLink(sb, { email: 'christvictory@gmail.com', orderId: 'TEST-LINK-1', reuse: true }), { ...a, created: false });
  const b = await createLink(sb, { email: 'christvictory@gmail.com', orderId: 'TEST-LINK-1' });
  assert.ok(b.created && b.code !== a.code, 'without reuse a new link is made');
  assert.equal(kstDay((await createLink(sb, { email: 'x@y.co', days: 1 })).expiresAt), kstDay(expiryFor(Date.now(), 1)));
  const many = await createLink(sb, { email: 'x@y.co', maxDownloads: 25 });
  assert.equal(be.tables.videokit_download_links.find(r => r.code === many.code).max_downloads, 25);
  // 관리자 끄기 (--revoke): 바로 막힌다
  assert.equal(await revokeLink(sb, many.code.toLowerCase()), true);
  assert.equal(be.tables.videokit_download_links.find(r => r.code === many.code).revoked, true);
  assert.deepEqual(await loadLink(many.code, supabaseLinkDeps(sb)), { status: 'gone' });
  assert.equal(await revokeLink(sb, 'ZZZZ2345'), false); assert.equal(await revokeLink(sb, 'nope'), false);

  resetLimits();
  const deps = supabaseLinkDeps(sb);
  const view = await loadLink(a.code, deps);
  assert.equal(view.status, 'ok'); assert.equal(view.name, '강*철 (시험)'); assert.equal(view.version, '1.3');
  const r = await handleDownload(a.code, 'windows', deps);
  assert.equal(r.status, 303);
  assert.match(r.headers.get('location'), /^https:\/\/fake\.supabase\.co\/storage\/v1\/object\/sign\/videokit\/kit\/links\/1\.3\/ClaudeVideoKit-Windows-1\.3\.zip\?token=t&download=ClaudeVideoKit-Windows-1\.3\.zip$/);
  const hit = be.tables.videokit_download_links.find(x => x.code === a.code);
  assert.equal(hit.download_count, 1); assert.ok(Date.now() - Date.parse(hit.last_download_at) < 5000);
  // 만료된 링크로 요청이 오면 그 행을 지우고 페이지로 보낸다
  hit.expires_at = new Date(Date.now() - 1).toISOString();
  { const gone = await handleDownload(a.code, 'mac', deps); assert.equal(gone.status, 303); assert.equal(gone.headers.get('location'), `/d/${a.code}`); }
  assert.ok(!be.tables.videokit_download_links.some(x => x.code === a.code));
  assert.deepEqual(await loadLink(a.code, deps), { status: 'gone' });
  console.log('PASS: createLink (new, reuse, cleanup) and page/button with supabase client');
}

// 키트 메일: 짧은 링크 하나 + "7일 뒤(날짜) 삭제됩니다", 구매자 키 유지
{
  const o = { orderId: makeOrderId('kit', 's', randomUUID()), plan: 'kit', itemName: plans.kit.name, amount: 100000, name: '김' };
  const exp = expiryFor(NOW);
  const m = kitEmail(o, 'https://groundrooted.com/d/ABCD2345', exp, 'VK-ABCD-EFGH-JK23');
  for (const part of [m.html, m.text]) {
    assert.ok(part.includes('https://groundrooted.com/d/ABCD2345'));
    assert.ok(part.includes('이 링크는 7일 뒤(2026년 12월 4일) 삭제됩니다'), 'deletion date');
    assert.ok(part.includes('VK-ABCD-EFGH-JK23'));
    assert.ok(!part.includes('supabase.co'), 'no long signed url in the mail');
  }
  assert.ok(m.html.includes('키트 내려받기 (맥용 · 윈도우용)') && m.html.includes('0. Claude Video Kit Manual'));

  const be = fakeBackend();
  const order = { ...o, email: 'buyer@example.com' };
  assert.deepEqual(await deliverKit(order), { status: 'sent', email: 'buyer@example.com' });
  assert.deepEqual(await deliverKit(order), { status: 'sent', email: 'buyer@example.com' }, 'refresh / webhook retry');
  assert.equal(be.tables.videokit_download_links.length, 1, 'same order reuses the live link');
  const first = be.tables.videokit_download_links[0];
  assert.deepEqual({ email: first.email, name: first.name, order_id: first.order_id }, { email: 'buyer@example.com', name: '김', order_id: o.orderId });
  assert.equal(be.mails[0].text, be.mails[1].text, 'same mail body on retry (matches Resend idempotency)');
  assert.deepEqual(await deliverKit(order, { force: true }), { status: 'sent', email: 'buyer@example.com' });
  assert.equal(be.tables.videokit_download_links.length, 2, 'resend makes a new link');
  for (const [i, l] of [[0, first], [2, be.tables.videokit_download_links[1]]]) assert.ok(be.mails[i].text.includes(`https://groundrooted.com/d/${l.code}`));
  assert.equal(be.tables.videokit_licenses.length, 1, 'license key unchanged');
  for (const mail of be.mails) assert.ok(mail.text.includes(`구매자 키 (업데이트용): ${be.tables.videokit_licenses[0].key}`));
  // 링크 표가 없으면 보낼 것이 없다 → failed (메일 안 감)
  const missing = fakeBackend({ linksMissing: true });
  const quiet = console.error; console.error = () => {};
  try { assert.deepEqual(await deliverKit({ ...order, orderId: makeOrderId('kit', 's', randomUUID()) }), { status: 'failed', reason: 'download link' }); }
  finally { console.error = quiet; }
  assert.equal(missing.mails.length, 0);
  console.log('PASS: kit mail uses the short link (reuse on retry, new on resend, failed without table)');
}
