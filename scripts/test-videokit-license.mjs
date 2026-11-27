// 구매자 키 · GET /api/videokit/latest · 키트 메일의 키. 네트워크 없이 돈다 (Supabase · Resend 호출은 가짜 fetch로 받는다).
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { newKey, isKey, normalizeKey, KEY_PATTERN, handleLatest, resetLimits, issueLicense, supabaseLatestDeps, db, SIGN_SECONDS } from '../products/videokit-license.ts';
import { kitEmail, deliverKit } from '../products/videokit-delivery.ts';
import { makeOrderId, plans, SALE_ENDS } from '../products/videokit.ts';

// ---- 키 형식 ----
{
  const keys = new Set();
  for (let i = 0; i < 2000; i++) { const k = newKey(); assert.match(k, KEY_PATTERN); assert.ok(!/[01OI]/.test(k.slice(3)), k); keys.add(k); }
  assert.equal(keys.size, 2000);
  assert.equal(normalizeKey('  vk-abcd-efgh-jk23 '), 'VK-ABCD-EFGH-JK23');
  for (const k of ['VK-ABCD-EFGH-JK2', 'VK-ABCD-EFGH-JK20', 'VK-ABCD-EFGH-JKI2', 'VK-ABCD-EFGH-JKO2', 'VK-ABCD-EFGH-JK12', 'XK-ABCD-EFGH-JK23', 'VKABCDEFGHJK23', '']) assert.equal(isKey(k), false, k);
  console.log('PASS: license key format');
}

// ---- 엔드포인트 (가짜 의존성) ----
const GOOD = 'VK-ABCD-EFGH-JK23', REVOKED = 'VK-ZZZZ-ZZZZ-ZZZZ', SHA = 'a'.repeat(64);
const LATEST = {
  mac: { version: '1.3.1', path: 'releases/1.3.1/ClaudeVideoKit-1.3.1.zip', sha256: SHA, size: 123 },
  windows: { version: '1.3.1', path: 'releases/1.3.1/ClaudeVideoKit-Windows-1.3.1.zip', sha256: 'b'.repeat(64), size: 456 },
  notes: '- 새 기능',
};
function fake(over = {}) {
  const calls = { find: [], touch: [], sign: [] };
  const deps = {
    findLicense: async k => { calls.find.push(k); return k === GOOD ? { revoked: false } : k === REVOKED ? { revoked: true } : null; },
    touch: async (k, v) => { calls.touch.push([k, v]); },
    readLatest: async () => LATEST,
    sign: async (p, s) => { calls.sign.push([p, s]); return `https://x.supabase.co/sign/${p}?token=t`; },
    ...over,
  };
  return { deps, calls };
}
const req = (key, q = 'platform=mac&current=1.2.0') => new Request(`https://groundrooted.com/api/videokit/latest?${q}`, { headers: key === undefined ? {} : { Authorization: key } });
let t = 1_000_000;
const call = async (key, q, over) => { const f = fake(over); f.deps.now = (t += 61_000); const r = await handleLatest(req(key, q), f.deps); return { r, body: await r.json(), ...f }; };

{
  resetLimits();
  // 정상 키
  let { r, body, calls } = await call(`Bearer ${GOOD}`);
  assert.equal(r.status, 200); assert.equal(r.headers.get('cache-control'), 'no-store');
  assert.deepEqual(body, { version: '1.3.1', platform: 'mac', sha256: SHA, size: 123, url: 'https://x.supabase.co/sign/releases/1.3.1/ClaudeVideoKit-1.3.1.zip?token=t', notes: '- 새 기능' });
  assert.deepEqual(calls.sign, [['releases/1.3.1/ClaudeVideoKit-1.3.1.zip', 600]]); assert.equal(SIGN_SECONDS, 600);
  assert.deepEqual(calls.touch, [[GOOD, '1.2.0']]);
  // 윈도우 · 소문자 키 · current 없음
  ({ r, body, calls } = await call(`bearer ${GOOD.toLowerCase()}`, 'platform=windows'));
  assert.equal(r.status, 200); assert.equal(body.platform, 'windows'); assert.equal(body.size, 456); assert.deepEqual(calls.touch, [[GOOD, null]]);
  // current가 이상하면 버전은 기록하지 않는다 (last_seen_at만)
  ({ calls } = await call(`Bearer ${GOOD}`, 'platform=mac&current=' + encodeURIComponent('1.0; drop table')));
  assert.deepEqual(calls.touch, [[GOOD, null]]);
  // 틀린 키 · 키 없음 · 형식 틀림 · revoked → 401 invalid_key
  for (const key of [undefined, '', 'Bearer', `Basic ${GOOD}`, 'Bearer VK-ABCD-EFGH-JK2', 'Bearer VK-AAAA-AAAA-AAAA', `Bearer ${REVOKED}`]) {
    ({ r, body, calls } = await call(key));
    assert.equal(r.status, 401, String(key)); assert.deepEqual(body, { error: 'invalid_key' }); assert.equal(calls.sign.length, 0); assert.equal(calls.touch.length, 0);
  }
  // 형식이 틀린 키는 DB까지 가지 않는다
  ({ calls } = await call('Bearer nope')); assert.equal(calls.find.length, 0);
  // DB 오류는 401이 아니라 503 (키트가 '키가 틀렸다'고 잘못 안내하지 않게)
  ({ r, body } = await call(`Bearer ${GOOD}`, undefined, { findLicense: async () => { throw new Error('relation does not exist'); } }));
  assert.equal(r.status, 503); assert.deepEqual(body, { error: 'unavailable' });
  // platform이 없거나 틀림 → 400
  for (const q of ['', 'platform=linux', 'platform=MAC']) { ({ r, body } = await call(`Bearer ${GOOD}`, q)); assert.equal(r.status, 400, q); assert.deepEqual(body, { error: 'bad_platform' }); }
  // 릴리스가 아직 없거나 latest.json이 이상함 → 503 no_release
  for (const readLatest of [async () => null, async () => { throw new Error('not found'); }, async () => ({ mac: { ...LATEST.mac, sha256: 'x' } }), async () => ({ mac: { ...LATEST.mac, path: '../kit/claude-video-kit.zip' } }), async () => ({ windows: LATEST.windows })]) {
    ({ r, body } = await call(`Bearer ${GOOD}`, 'platform=mac', { readLatest }));
    assert.equal(r.status, 503); assert.deepEqual(body, { error: 'no_release' });
  }
  // 서명 링크 실패 → 503
  ({ r } = await call(`Bearer ${GOOD}`, 'platform=mac', { sign: async () => null })); assert.equal(r.status, 503);
  // 기록 실패는 응답을 막지 않는다
  ({ r } = await call(`Bearer ${GOOD}`, 'platform=mac', { touch: async () => { throw new Error('x'); } })); assert.equal(r.status, 200);
  console.log('PASS: latest endpoint (good, wrong, revoked, db error, platform, release)');
}

// ---- 요청 수 제한: 키 하나당 1분에 10번 ----
{
  resetLimits();
  const { deps, calls } = fake();
  const at = async (now, key = GOOD) => { deps.now = now; return handleLatest(req(`Bearer ${key}`), deps); };
  for (let i = 0; i < 10; i++) assert.equal((await at(5_000_000 + i * 1000)).status, 200, `req ${i + 1}`);
  const r = await at(5_010_000);
  assert.equal(r.status, 429); assert.equal(r.headers.get('retry-after'), '60'); assert.deepEqual(await r.json(), { error: 'rate_limited' });
  assert.equal(calls.find.length, 10, 'limited request does not hit the DB');
  assert.equal((await at(5_010_000, 'VK-BBBB-CCCC-DDDD')).status, 401, 'other keys are counted separately');
  assert.equal((await at(5_061_000)).status, 200, 'window slides after a minute');
  console.log('PASS: latest endpoint rate limit');
}

// ---- 가짜 Supabase · Resend (실제 supabase-js가 만드는 요청을 받는다) ----
function fakeBackend({ tableMissing = false } = {}) {
  const rows = [], mails = [], log = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    const method = (init.method || 'GET').toUpperCase();
    log.push(`${method} ${url.pathname}`);
    const ok = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
    if (url.hostname === 'api.resend.com') { mails.push(JSON.parse(init.body)); return ok({ id: 'm1' }); }
    if (url.pathname.startsWith('/storage/v1/object/sign/')) return ok({ signedURL: `/object/sign/${url.pathname.split('/object/sign/')[1]}?token=t` });
    if (url.pathname === '/storage/v1/object/videokit/releases/latest.json') return new Response(JSON.stringify(LATEST), { status: 200 });
    if (url.pathname === '/rest/v1/videokit_licenses') {
      if (tableMissing) return ok({ code: '42P01', message: 'relation "videokit_licenses" does not exist' }, 404);
      const eq = k => url.searchParams.get(k)?.replace(/^eq\./, '');
      const match = r => (!eq('key') || r.key === eq('key')) && (!eq('order_id') || r.order_id === eq('order_id'));
      if (method === 'GET') return ok(rows.filter(match));
      if (method === 'POST') {
        const row = JSON.parse(init.body);
        if (rows.some(r => r.key === row.key || r.order_id === row.order_id)) return ok({ code: '23505', message: 'duplicate key' }, 409);
        rows.push({ revoked: false, last_seen_at: null, last_version: null, ...row }); return new Response(null, { status: 201 });
      }
      if (method === 'PATCH') { const patch = JSON.parse(init.body); rows.filter(match).forEach(r => Object.assign(r, patch)); return new Response(null, { status: 204 }); }
    }
    return ok({ message: `unexpected ${method} ${url.pathname}` }, 500);
  };
  return { rows, mails, log };
}
Object.assign(process.env, { SUPABASE_URL: 'https://fake.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service-role-test', RESEND_API_KEY: 're_test', VIDEOKIT_MAIL_FROM: 'kit@groundrooted.com' });

// 같은 주문은 같은 키, 다른 주문은 다른 키
{
  const be = fakeBackend();
  const sb = db();
  const a = await issueLicense(sb, 'a@b.co', 'order-1');
  const again = await issueLicense(sb, 'a@b.co', 'order-1');
  const b = await issueLicense(sb, 'c@d.co', 'order-2');
  assert.ok(isKey(a.key) && a.created); assert.deepEqual(again, { key: a.key, created: false }); assert.notEqual(b.key, a.key);
  assert.equal(be.rows.length, 2); assert.deepEqual(Object.keys(be.rows[0]).sort(), ['email', 'key', 'last_seen_at', 'last_version', 'order_id', 'revoked']);
  // 다른 요청이 같은 주문을 먼저 넣은 경우(23505) 그 키를 쓴다
  let first = true;
  const raced = { from: () => ({
    select: () => ({ eq: () => ({ maybeSingle: async () => (first ? (first = false, { data: null, error: null }) : { data: { key: 'VK-RACE-RACE-RACE' }, error: null }) }) }),
    insert: async () => ({ error: { code: '23505', message: 'duplicate' } }),
  }) };
  assert.deepEqual(await issueLicense(raced, 'a@b.co', 'order-3'), { key: 'VK-RACE-RACE-RACE', created: false });

  // 운영용 의존성으로 엔드포인트 끝까지: 키 확인 → latest.json → 10분 서명 → last_seen_at · last_version 기록
  resetLimits();
  const r = await handleLatest(req(`Bearer ${a.key}`, 'platform=windows&current=1.2.0'), supabaseLatestDeps(sb));
  const body = await r.json();
  assert.equal(r.status, 200, JSON.stringify(body)); assert.equal(body.version, '1.3.1'); assert.equal(body.sha256, 'b'.repeat(64));
  assert.match(body.url, /^https:\/\/fake\.supabase\.co\/storage\/v1\/object\/sign\/videokit\/releases\/1\.3\.1\/ClaudeVideoKit-Windows-1\.3\.1\.zip\?token=t/);
  assert.ok(be.log.includes('POST /storage/v1/object/sign/videokit/releases/1.3.1/ClaudeVideoKit-Windows-1.3.1.zip'));
  const row = be.rows.find(x => x.key === a.key); assert.equal(row.last_version, '1.2.0'); assert.ok(Date.now() - Date.parse(row.last_seen_at) < 5000);
  assert.equal((await handleLatest(req('Bearer VK-AAAA-AAAA-AAAA'), supabaseLatestDeps(sb))).status, 401);
  row.revoked = true;
  assert.equal((await handleLatest(req(`Bearer ${a.key}`), supabaseLatestDeps(sb))).status, 401);
  console.log('PASS: license issue (same order = same key) and endpoint with supabase client');
}

// ---- 키트 메일에 키 ----
{
  const o = { orderId: makeOrderId('kit', 's', randomUUID()), plan: 'kit', itemName: plans.kit.name, amount: 100000, name: '김' };
  const withKey = kitEmail(o, { mac: 'https://l', windows: 'https://w' }, SALE_ENDS, 'VK-ABCD-EFGH-JK23');
  assert.ok(withKey.html.includes('VK-ABCD-EFGH-JK23') && withKey.text.includes('구매자 키 (업데이트용): VK-ABCD-EFGH-JK23') && withKey.html.includes('/videokit update'));
  const noKey = kitEmail(o, { mac: 'https://l', windows: 'https://w' }, SALE_ENDS);
  assert.ok(!noKey.html.includes('구매자 키') && !noKey.text.includes('구매자 키'));
  assert.ok(kitEmail(o, { mac: 'l', windows: 'w' }, SALE_ENDS, '<x>').html.includes('&lt;x&gt;'), 'key escaped');

  // 결제 후 자동 발송: 키를 만들어 메일에 넣고, 같은 주문으로 다시 보내도(새로고침 · 웹훅 재시도 · 재발송) 같은 키
  const be = fakeBackend();
  const order = { ...o, email: 'buyer@example.com' };
  assert.deepEqual(await deliverKit(order), { status: 'sent', email: 'buyer@example.com' });
  assert.deepEqual(await deliverKit(order, { force: true }), { status: 'sent', email: 'buyer@example.com' });
  assert.equal(be.rows.length, 1); assert.equal(be.rows[0].order_id, o.orderId); assert.equal(be.rows[0].email, 'buyer@example.com');
  assert.equal(be.mails.length, 2);
  for (const m of be.mails) assert.ok(m.text.includes(`구매자 키 (업데이트용): ${be.rows[0].key}`) && m.html.includes(be.rows[0].key));
  // 테이블이 아직 없어도(마이그레이션 전 배포) 키트 메일은 키 없이 나간다
  const missing = fakeBackend({ tableMissing: true });
  const err = console.error; console.error = () => {};
  try { assert.deepEqual(await deliverKit({ ...order, orderId: makeOrderId('kit', 's', randomUUID()) }), { status: 'sent', email: 'buyer@example.com' }); }
  finally { console.error = err; }
  assert.equal(missing.mails.length, 1); assert.ok(!missing.mails[0].text.includes('구매자 키'));
  console.log('PASS: kit mail carries the license key (same key on resend, mail still sent without table)');
}
