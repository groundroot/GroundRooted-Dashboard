// 업데이트 기기 등록 · 2대 제한 (계약 v2: FCP 키트 저장소 docs/update_server_contract_v2.md). 네트워크 없이 돈다.
// 계약 §8 시험 계획 중 서버가 맡는 것(1 기기 값 형식 · 3 등록 · 4 확인 · 6 리셋 · 7 한도 축소 · 9 403과 401 구분 · 10 1.4.0 전환 · 11 헤더 규칙)을
// 서버 쪽에서 확인한다. 2 · 5 · 8 · 12 · 13 · 14와 1의 하드웨어ID 읽기는 키트(update.py · 설치 스크립트) 쪽 시험이다.
// SQL 함수(sql/videokit-devices.sql) 자체는 아래 가짜 DB가 같은 규칙으로 흉내 낸다. 실제 Postgres 검증은 PR 본문에 적는다.
import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { BRIDGE_HINT, compareVersions, db, deviceLimitForNewKey, handleLatest, issueLicense, resetLimits, supabaseLatestDeps, MANAGE_URL } from '../products/videokit-license.ts';
import { addDevices, deviceKeyStatus, deviceOrderMatches, findLicenses, grantDeviceAddon, handleRegister, describeLicense, makeDeviceOrderId, resetDevices, settleDeviceOrder, supabaseRegisterDeps } from '../products/videokit-devices.ts';
import { checkOrder, hasKit, hasLesson, isOrderId, makeCouponOrderId, priceOf } from '../products/videokit.ts';
import { deliverKit } from '../products/videokit-delivery.ts';

const quiet = async (fn) => { const e = console.error; console.error = () => {}; try { return await fn(); } finally { console.error = e; } };

// ---- 1. 기기 값 시험 벡터 (§1) · 버전 비교 ----
{
  const v = createHmac('sha256', 'VK-TEST-AAAA-BBBB').update('12345678-90AB-CDEF-1234-567890ABCDEF').digest('hex');
  assert.equal(v, 'bd956b56e6884b1592a6e8d71eed458e45608c5a8f8a5b12ad001a50b1c2ffa1');
  // 윈도우 MachineGuid는 소문자 · 중괄호 → 떼고 대문자로 바꾼 값이 같아야 한다
  const norm = (h) => h.trim().replace(/^\{|\}$/g, '').toUpperCase();
  assert.equal(createHmac('sha256', 'VK-TEST-AAAA-BBBB').update(norm(' {12345678-90ab-cdef-1234-567890abcdef} ')).digest('hex'), v);
  // 키트 vkey와 같은 순서
  const lt = [['1.4.0', '1.4.1'], ['1.4', '1.4.1'], ['2026.11.26.2225', '1.3'], ['2026.11.26.2225', '1.4.1'], [null, '1.4.1'], ['', '1.4.1'], ['1.3.9', '1.4.1'], ['1.4.1', '1.4.10'], ['1.4.1', '1.4.1.1'], ['1.4.1', '1.5']];
  for (const [a, b] of lt) { assert.ok(compareVersions(a, b) < 0, `${a} < ${b}`); assert.ok(compareVersions(b, a) > 0, `${b} > ${a}`); }
  assert.equal(compareVersions('1.4.1', '1.4.1'), 0); assert.equal(compareVersions('v1.4.1', '1.4.1'), 0);
  console.log('PASS: device value test vector, version order (vkey)');
}

// ---- 가짜 DB: supabase-js가 보내는 PostgREST 요청을 받아 sql/videokit-devices.sql 과 같은 규칙으로 처리한다 ----
const GOOD = 'VK-ABCD-EFGH-JK23', OLD = 'VK-PREV-KEYS-AAAA', REVOKED = 'VK-ZZZZ-ZZZZ-ZZZZ';
function fakeDb() {
  const t = {
    licenses: [
      { key: GOOD, email: 'a@b.co', order_id: 'vk-kit-r-1', created_at: '2026-12-10T00:00:00Z', revoked: false, device_limit: 2, reset_count: 0, last_reset_at: null },
      { key: OLD, email: 'old@b.co', order_id: 'old-1', created_at: '2026-11-01T00:00:00Z', revoked: false, device_limit: null, reset_count: 0, last_reset_at: null },
      { key: REVOKED, email: 'r@b.co', order_id: 'r-1', created_at: '2026-12-01T00:00:00Z', revoked: true, device_limit: 2, reset_count: 0, last_reset_at: null },
    ],
    devices: [], addons: [], mails: [], log: [],
  };
  let id = 0, clock = Date.parse('2026-12-11T00:00:00Z');
  const tick = () => new Date(clock += 1000).toISOString();
  const allowance = (key) => { const l = t.licenses.find(x => x.key === key); return !l || l.device_limit === null ? null : l.device_limit + t.addons.filter(a => a.license_key === key).reduce((n, a) => n + a.devices, 0); };
  const ordered = (key) => t.devices.filter(d => d.license_key === key).sort((a, b) => a.registered_at.localeCompare(b.registered_at) || a.id - b.id);
  const rpc = {
    videokit_register_device({ p_key, p_device, p_platform, p_label, p_kit_version, p_enforce }) {
      const l = t.licenses.find(x => x.key === p_key);
      if (!l || l.revoked) return { status: 'invalid_key' };
      if (!/^[0-9a-f]{64}$/.test(p_device) || !['mac', 'windows'].includes(p_platform)) throw Object.assign(new Error('check constraint'), { pg: true });
      const limit = allowance(p_key), mine = ordered(p_key), hit = mine.find(d => d.device_hash === p_device);
      if (hit) { hit.label = p_label ?? hit.label; hit.kit_version = p_kit_version ?? hit.kit_version; hit.last_seen_at = tick(); return { status: 'already_registered', used: mine.length, limit }; }
      if (p_enforce && limit !== null && mine.length >= limit) return { status: 'device_limit', used: mine.length, limit };
      const now = tick();
      t.devices.push({ id: ++id, license_key: p_key, device_hash: p_device, platform: p_platform, label: p_label, kit_version: p_kit_version, registered_at: now, last_seen_at: now });
      return { status: 'registered', used: mine.length + 1, limit };
    },
    videokit_check_device({ p_key, p_device }) {
      const mine = ordered(p_key), i = mine.findIndex(d => d.device_hash === p_device);
      return { rank: i < 0 ? null : i + 1, used: mine.length, limit: allowance(p_key) };
    },
    videokit_reset_devices({ p_key }) {
      const l = t.licenses.find(x => x.key === p_key);
      if (!l) return null;
      const gone = ordered(p_key);
      t.devices = t.devices.filter(d => d.license_key !== p_key);
      l.reset_count++; l.last_reset_at = tick();
      return { deleted: gone.length, devices: gone.map(d => ({ platform: d.platform, label: d.label, registered_at: d.registered_at })), reset_count: l.reset_count, reset_at: l.last_reset_at };
    },
  };
  const tables = { videokit_licenses: 'licenses', videokit_devices: 'devices', videokit_device_addons: 'addons' };
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    const method = (init.method || 'GET').toUpperCase();
    t.log.push(`${method} ${url.pathname}`);
    const ok = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
    if (url.hostname === 'api.resend.com') { t.mails.push({ ...JSON.parse(init.body), idem: new Headers(init.headers).get('idempotency-key') }); return ok({ id: 'm1' }); }
    if (url.pathname.startsWith('/rest/v1/rpc/')) {
      const fn = rpc[url.pathname.slice('/rest/v1/rpc/'.length)];
      try { return ok(fn(JSON.parse(init.body))); } catch (e) { return ok({ code: '23514', message: e.message }, 400); }
    }
    const name = tables[url.pathname.slice('/rest/v1/'.length)];
    if (!name) return ok({ message: `unexpected ${method} ${url.pathname}` }, 500);
    const filters = [...url.searchParams].filter(([k]) => !['select', 'order', 'limit', 'offset'].includes(k));
    const match = (r) => filters.every(([k, v]) => v.startsWith('eq.') ? String(r[k]) === v.slice(3) : v.startsWith('ilike.') ? String(r[k]).toLowerCase() === v.slice(6).replace(/\\(.)/g, '$1').toLowerCase() : true);
    const rows = t[name];
    if (method === 'GET') {
      let out = rows.filter(match);
      for (const o of (url.searchParams.get('order') ?? '').split(',').filter(Boolean).reverse()) { const [col] = o.split('.'); out = [...out].sort((a, b) => String(a[col]).localeCompare(String(b[col]), 'en', { numeric: true })); }
      const cols = (url.searchParams.get('select') ?? '*').split(',');
      return ok(cols[0] === '*' ? out : out.map(r => Object.fromEntries(cols.map(c => [c, r[c]]))));
    }
    if (method === 'POST') {
      const row = JSON.parse(init.body);
      const pk = name === 'licenses' ? 'key' : 'id';
      if (rows.some(r => r[pk] === row[pk] || (name === 'licenses' && r.order_id === row.order_id))) return ok({ code: '23505', message: 'duplicate key' }, 409);
      rows.push(name === 'licenses' ? { revoked: false, device_limit: null, reset_count: 0, created_at: tick(), ...row } : { created_at: tick(), ...row });
      return new Response(null, { status: 201 });
    }
    if (method === 'PATCH') { const patch = JSON.parse(init.body); rows.filter(match).forEach(r => Object.assign(r, patch)); return new Response(null, { status: 204 }); }
    return ok({ message: 'unexpected' }, 500);
  };
  return t;
}
Object.assign(process.env, { SUPABASE_URL: 'https://fake.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service-role-test', RESEND_API_KEY: 're_test', VIDEOKIT_MAIL_FROM: 'kit@groundrooted.com' });
delete process.env.VIDEOKIT_DEVICE_ENFORCE; delete process.env.VIDEOKIT_DEVICE_LIMIT_FROM; delete process.env.VIDEOKIT_DEVICE_ADDON_ON;

const dev = (c) => c.repeat(64);
const SHA = 'a'.repeat(64);
const RELEASES = {
  latest: { mac: { version: '1.4.2', path: 'releases/1.4.2/ClaudeVideoKit-1.4.2.zip', sha256: SHA, size: 222 }, windows: { version: '1.4.2', path: 'releases/1.4.2/ClaudeVideoKit-Windows-1.4.2.zip', sha256: SHA, size: 333 }, notes: '- 1.4.2 변경' },
  bridge: { mac: { version: '1.4.1', path: 'releases/1.4.1/ClaudeVideoKit-1.4.1.zip', sha256: 'b'.repeat(64), size: 141 }, windows: { version: '1.4.1', path: 'releases/1.4.1/ClaudeVideoKit-Windows-1.4.1.zip', sha256: 'c'.repeat(64), size: 142 }, notes: '- 1.4.1 기기 등록' },
};
// 운영 의존성(supabase-js → 가짜 DB) + 버킷 파일만 바꿔 끼운다.
let now = 10_000_000;
function server(t, { enforce = true, latest = RELEASES.latest, bridge = RELEASES.bridge } = {}) {
  const sb = db();
  const L = { ...supabaseLatestDeps(sb), readLatest: async () => latest, readBridge: async () => bridge, sign: async (p) => `https://x.supabase.co/sign/${p}?token=t`, enforce };
  const R = { ...supabaseRegisterDeps(sb), enforce };
  const latestReq = async (key, { device, q = 'platform=mac&current=1.4.1' } = {}) => {
    L.now = (now += 61_000);
    const h = { ...(key ? { Authorization: `Bearer ${key}` } : {}), ...(device !== undefined ? { 'X-VK-Device': device } : {}) };
    const r = await handleLatest(new Request(`https://groundrooted.com/api/videokit/latest?${q}`, { headers: h }), L);
    return { status: r.status, body: await r.json() };
  };
  const register = async (key, body) => {
    R.now = (now += 61_000);
    const r = await handleRegister(new Request('https://groundrooted.com/api/videokit/devices/register', { method: 'POST', headers: { ...(key ? { Authorization: `Bearer ${key}` } : {}), 'Content-Type': 'application/json', 'User-Agent': 'ClaudeVideoKit-Register/1.4.1' }, body: typeof body === 'string' ? body : JSON.stringify(body) }), R);
    return { status: r.status, body: await r.json(), headers: r.headers };
  };
  return { sb, L, R, latestReq, register };
}
const regBody = (d, platform = 'mac', extra = {}) => ({ device: d, platform, label: 'MacBookPro18,3', kit_version: '1.4.1', ...extra });

// ---- 3. 등록 ----
{
  resetLimits();
  const t = fakeDb(); const s = server(t);
  let r = await s.register(GOOD, regBody(dev('a')));
  assert.equal(r.status, 200); assert.deepEqual(r.body, { status: 'registered', used: 1, limit: 2 }); assert.equal(r.headers.get('cache-control'), 'no-store');
  r = await s.register(GOOD, regBody(dev('a'), 'mac', { label: 'Studio', kit_version: '1.4.2' }));
  assert.deepEqual(r.body, { status: 'already_registered', used: 1, limit: 2 });
  assert.equal(t.devices[0].label, 'Studio'); assert.equal(t.devices[0].kit_version, '1.4.2');
  // 대문자 hex도 받고 소문자로 저장(같은 기기)
  r = await s.register(GOOD, regBody(dev('A'))); assert.equal(r.body.status, 'already_registered'); assert.equal(t.devices.length, 1);
  r = await s.register(GOOD, regBody(dev('b'), 'windows', { label: 'Windows PC' }));
  assert.deepEqual(r.body, { status: 'registered', used: 2, limit: 2 });
  // 세 번째 기기 → 403 device_limit, manage_url, 등록하지 않음
  r = await s.register(GOOD, regBody(dev('c')));
  assert.equal(r.status, 403); assert.deepEqual(r.body, { error: 'device_limit', limit: 2, used: 2, manage_url: MANAGE_URL }); assert.equal(t.devices.length, 2);
  // 401: 키 없음 · 형식 틀림 · 없는 키 · 해지된 키
  for (const k of [undefined, 'VK-ABCD-EFGH-JK2', 'VK-AAAA-AAAA-AAAA', REVOKED]) { r = await s.register(k, regBody(dev('c'))); assert.equal(r.status, 401, String(k)); assert.deepEqual(r.body, { error: 'invalid_key' }); }
  // 400: device 형식 · platform · 본문
  for (const b of [regBody('xyz'), regBody(dev('g') + 'a'), regBody(dev('c'), 'linux'), regBody(dev('c'), 'MAC'), { platform: 'mac' }, 'not json', regBody(dev('c'), 'mac', { label: 5 })]) {
    r = await s.register(GOOD, b); assert.equal(r.status, 400, JSON.stringify(b)); assert.deepEqual(r.body, { error: 'bad_request' });
  }
  // label: 40자 · 제어 문자 정리
  r = await s.register(OLD, regBody(dev('e'), 'mac', { label: `  내\n맥북\u0007 ${'x'.repeat(60)}` }));
  assert.equal(r.status, 200); const lab = t.devices.find(d => d.device_hash === dev('e')).label; assert.ok(lab.length === 40 && !/[\n\u0007]/.test(lab) && lab.startsWith('내 맥북 '), lab);
  // DB 오류 → 503 (401이 아님)
  const broken = { ...s.R, register: async () => { throw new Error('function does not exist'); } };
  const r503 = await quiet(() => handleRegister(new Request('https://x/api', { method: 'POST', headers: { Authorization: `Bearer ${GOOD}` }, body: JSON.stringify(regBody(dev('c'))) }), { ...broken, now: (now += 61_000) }));
  assert.equal(r503.status, 503); assert.deepEqual(await r503.json(), { error: 'unavailable' });
  // 429: latest와 같은 키당 1분 10번 (등록 · 확인을 합쳐 셈)
  resetLimits();
  const at = (n) => handleRegister(new Request('https://x/api', { method: 'POST', headers: { Authorization: `Bearer ${GOOD}` }, body: JSON.stringify(regBody(dev('a'))) }), { ...s.R, now: n });
  for (let i = 0; i < 10; i++) assert.equal((await at(50_000_000 + i)).status, 200);
  const lim = await at(50_000_020); assert.equal(lim.status, 429); assert.equal(lim.headers.get('retry-after'), '60');
  console.log('PASS: register (new, again, third → device_limit, 401, 400, label, 503, 429)');
}

// ---- 스위치 · 무제한 키 ----
{
  resetLimits();
  const t = fakeDb(); const off = server(t, { enforce: false });
  for (const c of 'abc') await off.register(GOOD, regBody(dev(c)));
  // 스위치 꺼짐: 한도를 넘어도 기록만 (used 3, limit 2)
  assert.deepEqual((await off.register(GOOD, regBody(dev('d')))).body, { status: 'registered', used: 4, limit: 2 });
  assert.equal((await off.latestReq(GOOD, { device: dev('d') })).status, 200, 'rank 4 > limit 2 is not blocked when switch is off');
  // 스위치 꺼짐에서도 미등록은 403 device_unregistered (키트가 등록 후 다시 묻는다)
  assert.equal((await off.latestReq(GOOD, { device: dev('f') })).body.error, 'device_unregistered');
  // 환경변수 스위치: 기본 꺼짐, 1 · true · on 이면 켜짐
  const { enforce: _e, ...envDeps } = off.R;
  for (const [v, want] of [[undefined, 4 + 1], ['0', 6], ['1', null], ['true', null], ['ON', null]]) {
    if (v === undefined) delete process.env.VIDEOKIT_DEVICE_ENFORCE; else process.env.VIDEOKIT_DEVICE_ENFORCE = v;
    const r = await handleRegister(new Request('https://x/api', { method: 'POST', headers: { Authorization: `Bearer ${GOOD}` }, body: JSON.stringify(regBody(randomUUID().replace(/-/g, '').padEnd(64, '0'))) }), { ...envDeps, now: (now += 61_000) });
    const b = await r.json();
    if (want === null) { assert.equal(r.status, 403, v); assert.equal(b.error, 'device_limit'); } else { assert.equal(r.status, 200, String(v)); assert.equal(b.used, want); }
  }
  delete process.env.VIDEOKIT_DEVICE_ENFORCE;
  // 대수 제한 없는 키(device_limit NULL, 종전 약관): 스위치가 켜져 있어도 등록 · 확인 모두 막지 않음, limit null
  const on = server(t, { enforce: true });
  for (let i = 0; i < 5; i++) assert.deepEqual((await on.register(OLD, regBody(String(i).repeat(64)))).body, { status: 'registered', used: i + 1, limit: null });
  assert.equal((await on.latestReq(OLD, { device: '4'.repeat(64) })).status, 200);
  console.log('PASS: enforce switch (default off = record only), unlimited keys (device_limit NULL)');
}

// ---- 4 · 11. latest 확인 (헤더 있음) ----
{
  resetLimits();
  const t = fakeDb(); const s = server(t);
  // 등록된 기기 → v1과 같은 200, 기기 last_seen_at · kit_version 갱신
  await s.register(GOOD, regBody(dev('a')));
  const before = t.devices[0].last_seen_at;
  let r = await s.latestReq(GOOD, { device: dev('a'), q: 'platform=mac&current=1.4.1' });
  assert.equal(r.status, 200); assert.deepEqual(r.body, { version: '1.4.2', platform: 'mac', sha256: SHA, size: 222, url: 'https://x.supabase.co/sign/releases/1.4.2/ClaudeVideoKit-1.4.2.zip?token=t', notes: '- 1.4.2 변경' });
  assert.notEqual(t.devices[0].last_seen_at, before); assert.equal(t.devices[0].kit_version, '1.4.1');
  assert.equal(t.licenses[0].last_version, '1.4.1');
  // 미등록 → 403 device_unregistered (계약 본문 그대로). 키는 맞으므로 401이 아니다(§8-9: 키트가 키를 저장할 근거)
  r = await s.latestReq(GOOD, { device: dev('b') });
  assert.equal(r.status, 403);
  assert.deepEqual(r.body, { error: 'device_unregistered', used: 1, limit: 2, register_hint: '이 기기는 업데이트 등록이 안 되어 있습니다. /videokit update를 실행하면 등록합니다.', manage_url: MANAGE_URL });
  // 4: 미등록 → 등록 한 번 → 다시 확인 → 진행 (서버 기록: register 1회, latest 2회)
  const logStart = t.log.length;
  assert.equal((await s.latestReq(GOOD, { device: dev('b') })).status, 403);
  assert.equal((await s.register(GOOD, regBody(dev('b'), 'windows'))).body.status, 'registered');
  assert.equal((await s.latestReq(GOOD, { device: dev('b'), q: 'platform=windows&current=1.4.1' })).status, 200);
  const calls = t.log.slice(logStart);
  assert.equal(calls.filter(c => c.endsWith('/rpc/videokit_register_device')).length, 1); assert.equal(calls.filter(c => c.endsWith('/rpc/videokit_check_device')).length, 2);
  // 미등록 + 한도 초과: 등록이 403 device_limit
  assert.equal((await s.latestReq(GOOD, { device: dev('c') })).body.error, 'device_unregistered');
  assert.equal((await s.register(GOOD, regBody(dev('c')))).body.error, 'device_limit');
  // 11: 헤더 형식 오류 → 400 (키트 종료 8)
  for (const d of ['xyz', dev('a').slice(1), dev('g'), '']) { r = await s.latestReq(GOOD, { device: d }); assert.equal(r.status, 400, d); assert.deepEqual(r.body, { error: 'bad_device' }); }
  // 11: 헤더 없이 current=1.4.1 이상 → 403 device_unregistered (헤더를 지운 요청)
  for (const cur of ['1.4.1', '1.4.10', '1.5', '2.0']) { r = await s.latestReq(GOOD, { q: `platform=mac&current=${cur}` }); assert.equal(r.status, 403, cur); assert.equal(r.body.error, 'device_unregistered'); assert.equal(r.body.used, 2); }
  // 키 검사 · 요청 수 제한은 기기 검사보다 먼저
  assert.equal((await s.latestReq('VK-AAAA-AAAA-AAAA', { device: dev('a') })).status, 401);
  assert.equal((await s.latestReq(REVOKED, { device: dev('a') })).status, 401);
  // 기기 확인 DB 오류 → 503
  const L2 = { ...s.L, checkDevice: async () => { throw new Error('relation does not exist'); }, now: (now += 61_000) };
  const r503 = await quiet(() => handleLatest(new Request('https://x/api/videokit/latest?platform=mac&current=1.4.1', { headers: { Authorization: `Bearer ${GOOD}`, 'X-VK-Device': dev('a') } }), L2));
  assert.equal(r503.status, 503);
  console.log('PASS: latest with device header (registered, unregistered → register → retry, bad header, header removed, 503)');
}

// ---- 10. 1.4.0 이하 전환 (헤더 없음) ----
{
  resetLimits();
  const t = fakeDb();
  for (const enforce of [true, false]) {
    const s = server(t, { enforce });
    const checks = t.log.filter(c => c.includes('videokit_check_device')).length;
    // latest가 1.4.2여도 1.4.0은 bridge의 1.4.1을 받는다. notes 끝에 등록 안내. 403은 없다.
    for (const [q, plat, size] of [['platform=mac&current=1.4.0', 'mac', 141], ['platform=windows&current=1.4.0', 'windows', 142], ['platform=mac&current=2026.11.26.2225', 'mac', 141], ['platform=mac', 'mac', 141], ['platform=mac&current=1.3', 'mac', 141]]) {
      const r = await s.latestReq(GOOD, { q });
      assert.equal(r.status, 200, q); assert.equal(r.body.version, '1.4.1'); assert.equal(r.body.platform, plat); assert.equal(r.body.size, size);
      assert.match(r.body.url, /releases\/1\.4\.1\//); assert.equal(r.body.notes, `- 1.4.1 기기 등록\n\n${BRIDGE_HINT}`);
      // 1.4.0 updater의 본문 검사를 통과하는 값 (§6.3)
      assert.ok(/^[0-9A-Za-z.]+$/.test(r.body.version) && /^[0-9a-f]{64}$/.test(r.body.sha256) && Number.isInteger(r.body.size) && typeof r.body.url === 'string');
    }
    // 대수 제한 없는 키 · 기기가 하나도 없는 키도 같다. 기기 검사 rpc를 부르지 않는다.
    assert.equal((await s.latestReq(OLD, { q: 'platform=mac&current=1.4.0' })).body.version, '1.4.1');
    assert.equal(t.log.filter(c => c.includes('videokit_check_device')).length, checks, 'header-less bridge path does not count devices');
  }
  // 헤더 없는 요청도 last_seen_at · last_version 기록 (1.4.0 남은 구매자 수)
  assert.equal(t.licenses.find(l => l.key === GOOD).last_version, '1.3');
  // bridge.json에 이미 안내가 있으면 두 번 붙이지 않는다
  let s = server(t, { bridge: { ...RELEASES.bridge, notes: `변경\n${BRIDGE_HINT}` } });
  assert.equal((await s.latestReq(GOOD, { q: 'platform=mac&current=1.4.0' })).body.notes, `변경\n${BRIDGE_HINT}`);
  s = server(t, { bridge: { mac: RELEASES.bridge.mac } });
  assert.equal((await s.latestReq(GOOD, { q: 'platform=mac&current=1.4.0' })).body.notes, BRIDGE_HINT);
  // bridge에 그 플랫폼이 없거나 bridge.json이 없으면 503 no_release (1.4.0: "아직 배포된 업데이트가 없습니다", 종료 0)
  for (const bridge of [{ mac: RELEASES.bridge.mac }, null]) {
    s = server(t, { bridge });
    const r = await s.latestReq(GOOD, { q: 'platform=windows&current=1.4.0' });
    assert.equal(r.status, 503); assert.deepEqual(r.body, { error: 'no_release' });
  }
  // bridge 항목 형식이 틀리면 503 unavailable (서명 링크를 만들지 않음)
  s = server(t, { bridge: { mac: { ...RELEASES.bridge.mac, sha256: 'x' } } });
  assert.deepEqual(await quiet(async () => (await s.latestReq(GOOD, { q: 'platform=mac&current=1.4.0' })).body), { error: 'unavailable' });
  console.log('PASS: header-less 1.4.0 → bridge 1.4.1 only (even with latest 1.4.2, switch on or off), no_release, notes hint');
}

// ---- 6 · 7. 리셋 · 한도 축소 · 운영봇 스크립트 함수 ----
{
  resetLimits();
  const t = fakeDb(); const s = server(t);
  await s.register(GOOD, regBody(dev('a'))); await s.register(GOOD, regBody(dev('b'), 'windows'));
  const [lic] = await findLicenses(s.sb, GOOD.toLowerCase());
  // dry-run: 아무것도 지우지 않음
  const dry = await resetDevices(s.sb, lic, { dryRun: true });
  assert.equal(dry.deleted, 0); assert.equal(dry.would_delete, 2); assert.equal(dry.key, 'VK-…-JK23'); assert.equal(t.devices.length, 2); assert.equal(t.licenses[0].reset_count, 0);
  // 리셋: 두 기기 모두 지움 → 다음 확인에서 둘 다 unregistered → 각자 등록 → 2/2
  const done = await resetDevices(s.sb, lic);
  assert.equal(done.deleted, 2); assert.equal(done.reset_count, 1); assert.equal(done.key, 'VK-…-JK23'); assert.deepEqual(done.devices.map(d => d.platform), ['mac', 'windows']);
  assert.ok(!JSON.stringify(done).includes(GOOD) && !JSON.stringify(done).includes(dev('a')), 'key and device value are masked');
  for (const d of [dev('a'), dev('b')]) assert.equal((await s.latestReq(GOOD, { device: d })).body.error, 'device_unregistered');
  assert.equal((await s.register(GOOD, regBody(dev('b'), 'windows'))).body.used, 1);
  assert.deepEqual((await s.register(GOOD, regBody(dev('a')))).body, { status: 'registered', used: 2, limit: 2 });
  assert.equal(t.licenses[0].device_limit, 2, 'reset keeps device_limit');
  // 7: 추가 기기 1대 → 3번째 등록 가능 → 추가분을 지우면(환불) 등록 순서상 3번째가 latest에서 403 device_limit
  const add = await addDevices(s.sb, lic, 1, { orderId: 'vk-device-r-transfer-1' });
  assert.equal(add.added, true); assert.equal(add.allowance_before, 2); assert.equal(add.allowance_after, 3); assert.equal(add.source, 'transfer');
  assert.equal((await addDevices(s.sb, lic, 1, { orderId: 'vk-device-r-transfer-1' })).added, false, 'same order id is applied once');
  const dryAdd = await addDevices(s.sb, lic, 2, { dryRun: true }); assert.equal(dryAdd.allowance_after, 5); assert.equal(t.addons.length, 1);
  assert.equal((await s.register(GOOD, regBody(dev('c')))).body.limit, 3);
  t.addons.length = 0;
  let r = await s.latestReq(GOOD, { device: dev('c') });
  assert.equal(r.status, 403); assert.deepEqual(r.body, { error: 'device_limit', limit: 2, used: 3, manage_url: MANAGE_URL });
  assert.equal((await s.latestReq(GOOD, { device: dev('a') })).status, 200, 'first two devices still update');
  // list: 키 · 이메일 · 주문번호로 찾고, 키는 끝 4자 · 기기 값은 앞 8자, 한도 밖 표시
  for (const q of [GOOD, 'A@B.co', 'vk-kit-r-1']) assert.equal((await findLicenses(s.sb, q)).length, 1, q);
  assert.equal((await findLicenses(s.sb, 'nobody@x.co')).length, 0);
  const info = await describeLicense(s.sb, (await findLicenses(s.sb, GOOD))[0]);
  assert.equal(info.key, 'VK-…-JK23'); assert.equal(info.allowance, 2); assert.equal(info.used, 3); assert.equal(info.reset_count, 1);
  assert.deepEqual(info.devices.map(d => [d.device, d.over_limit ?? false]), [[dev('b').slice(0, 8), false], [dev('a').slice(0, 8), false], [dev('c').slice(0, 8), true]]);
  assert.ok(!JSON.stringify(info).includes(GOOD) && !JSON.stringify(info).includes(dev('c')));
  // 스크립트 자체: 사용법 오류는 DB에 가지 않고 종료 2
  for (const args of [[], ['list'], ['nope', GOOD], ['add', GOOD], ['add', GOOD, '0'], ['add', GOOD, '1.5']]) {
    const p = spawnSync(process.execPath, ['scripts/videokit-devices.mjs', ...args], { env: { PATH: process.env.PATH }, encoding: 'utf8' });
    assert.equal(p.status, 2, args.join(' ')); assert.match(p.stderr, /사용법/);
  }
  console.log('PASS: reset (dry-run, all devices unregistered, re-register 2/2), addon +1 / refund → over limit 403, list, script usage');
}

// ---- 새 키의 기본 한도 (VIDEOKIT_DEVICE_LIMIT_FROM) ----
{
  const t = fakeDb(); const sb = db();
  const FROM = Date.parse('2026-12-15T00:00:00+09:00');
  delete process.env.VIDEOKIT_DEVICE_LIMIT_FROM;
  assert.equal(deviceLimitForNewKey(FROM + 1), null, 'no env → unlimited');
  for (const bad of ['', 'soon', '2026-13-45']) { process.env.VIDEOKIT_DEVICE_LIMIT_FROM = bad; assert.equal(deviceLimitForNewKey(FROM + 1), null, bad); }
  process.env.VIDEOKIT_DEVICE_LIMIT_FROM = '2026-12-15T00:00:00+09:00';
  assert.equal(deviceLimitForNewKey(FROM - 1), null); assert.equal(deviceLimitForNewKey(FROM), 2);
  const a = await issueLicense(sb, 'x@y.co', 'order-before', FROM - 1);
  const b = await issueLicense(sb, 'x@y.co', 'order-after', FROM + 1);
  const row = (k) => t.licenses.find(l => l.key === k);
  assert.equal(row(a.key).device_limit, null); assert.equal(row(b.key).device_limit, 2);
  // 발급 전 insert에는 device_limit을 넣지 않는다(마이그레이션 전에도 지금과 같은 요청)
  delete process.env.VIDEOKIT_DEVICE_LIMIT_FROM;
  console.log('PASS: default device_limit 2 only for keys issued after VIDEOKIT_DEVICE_LIMIT_FROM');
}

// ---- 추가 기기 판매: 주문번호 · 금액 · 구매자 키 · +1 ----
{
  const t = fakeDb(); const sb = db();
  assert.equal(hasKit('device'), false); assert.equal(hasLesson('device'), false); assert.equal(priceOf('device', 'r'), 50_000); assert.equal(priceOf('device', 's'), 50_000);
  assert.deepEqual(await deliverKit({ orderId: 'x', plan: 'device', itemName: 'x', amount: 50000, email: 'a@b.co', name: 'a' }), { status: 'none' }, 'no kit mail / new key for addon orders');
  const id = makeDeviceOrderId(GOOD);
  assert.match(id, /^vk-device-r-[0-9a-f-]{36}-[0-9a-f]{12}$/); assert.ok(id.length <= 64); assert.ok(isOrderId(id));
  assert.deepEqual(checkOrder(id, 50000), { ok: true, plan: 'device', tier: 'r', amount: 50000, coupon: null });
  for (const amt of [49999, 100000, 0, '50000x']) assert.equal(checkOrder(id, amt).ok, false, String(amt));
  // 표식 없는 device 주문 · 할인가 device 주문은 받지 않는다. 쿠폰 주문번호는 만들 수 없다.
  assert.equal(checkOrder(`vk-device-r-${randomUUID()}`, 50000).ok, false); assert.equal(checkOrder(`vk-device-s-${randomUUID()}`, 50000).ok, false);
  process.env.VIDEOKIT_COUPON_CODES = 'CHURCH'; assert.equal(makeCouponOrderId('device', 'CHURCH', randomUUID()), null); delete process.env.VIDEOKIT_COUPON_CODES;
  // 표식은 그 키에만 맞는다 (metadata의 키를 바꿔치기하면 반영 안 됨)
  assert.equal(deviceOrderMatches(id, GOOD), true); assert.equal(deviceOrderMatches(id, ` ${GOOD.toLowerCase()} `), true);
  assert.equal(deviceOrderMatches(id, OLD), false); assert.equal(deviceOrderMatches(id.slice(0, -1) + (id.endsWith('0') ? '1' : '0'), GOOD), false);
  assert.equal(makeDeviceOrderId('nope'), null);
  // 구매자 키 확인: 맞는 키 · 없는 키 · 해지 · 대수 제한 없는 키(팔지 않음)
  assert.deepEqual(await deviceKeyStatus(sb, ` ${GOOD.toLowerCase()} `), { ok: true, key: GOOD, used: 0, limit: 2 });
  for (const [k, e] of [['VK-AAAA-AAAA-AAAA', 'invalid'], ['nope', 'invalid'], [REVOKED, 'invalid'], [OLD, 'unlimited']]) assert.deepEqual(await deviceKeyStatus(sb, k), { ok: false, error: e }, k);
  // +1 반영: 같은 주문번호는 한 번만(새로고침 · 웹훅 재시도). 구매자 확인 메일 1통 + 판매자 알림 1통.
  const meta = { email: 'buyer@example.com', name: '김구매', key: GOOD, receipt: '{}' };
  const first = await settleDeviceOrder({ orderId: id, amount: 50000, meta, receipt: [] }, sb);
  const again = await settleDeviceOrder({ orderId: id, amount: 50000, meta, receipt: [] }, sb);
  assert.equal(first.status, 'added'); assert.deepEqual(first.allowance, { used: 0, limit: 3 });
  assert.equal(again.status, 'exists'); assert.equal(t.addons.length, 1); assert.deepEqual(t.addons[0], { ...t.addons[0], id, license_key: GOOD, devices: 1, source: 'card', amount: 50000 });
  const buyerMail = t.mails.filter(m => m.to[0] === 'buyer@example.com'), seller = t.mails.filter(m => m.subject.startsWith('[결제 완료]'));
  assert.equal(buyerMail.length, 1); assert.equal(seller.length, 1);
  assert.ok(buyerMail[0].text.includes('3대') && !buyerMail[0].text.includes(GOOD) && buyerMail[0].idem === `vk-device-mail-${id}`);
  assert.ok(seller[0].text.includes('업데이트 기기 1대 추가') && seller[0].text.includes('기기 +1 반영됨') && seller[0].text.includes('VK-…-JK23'));
  // 다른 키로 바꿔치기 · 해지된 키 → 반영 안 함, 판매자에게 직접 처리 알림
  const swapped = await quiet(() => settleDeviceOrder({ orderId: makeDeviceOrderId(GOOD), amount: 50000, meta: { ...meta, key: OLD }, receipt: [] }, sb));
  assert.equal(swapped.status, 'mismatch'); assert.equal(t.addons.length, 1);
  assert.ok(t.mails.at(-1).text.includes('반영 안 됨') && t.mails.at(-1).text.includes('videokit-devices.mjs add'));
  assert.equal((await grantDeviceAddon(sb, { orderId: makeDeviceOrderId(REVOKED), key: REVOKED, amount: 50000 })).status, 'invalid');
  console.log('PASS: device addon order (signed order id, 50,000 only, no coupon, buyer key check, idempotent +1, swap rejected)');
}
