// 클로드 비디오 키트 업데이트 기기 등록 · 리셋 · 추가 기기 (서버 전용).
// 약속: FCP 키트 저장소 docs/update_server_contract_v2.md. 테이블 · 함수: sql/videokit-devices.sql.
// - POST /api/videokit/devices/register: 키트 1.4.1이 설치 첫 단계와 /videokit update 때 이 기기를 등록한다.
// - 추가 기기(1대 5만원): /price 의 device 상품. 결제 화면에는 VIDEOKIT_DEVICE_ADDON_ON 일 때만 보인다.
// - 운영봇: scripts/videokit-devices.mjs (list · reset · add).
// 키와 기기 값은 로그에 남기지 않는다. 출력에는 키 끝 4자, 기기 값 앞 8자만 보인다.
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { DEVICE_PATTERN, PLATFORMS, VERSION, db, deviceEnforced, invalid, isKey, json, normalizeKey, overLimit, tooMany, type Platform } from './videokit-license.ts';
import { notifySeller, sendDeviceAddonMail } from './videokit-delivery.ts';

const env = (k: string, d = '') => process.env[k] || d;
const TABLE = 'videokit_licenses';

export type RegisterResult = { status: 'registered' | 'already_registered' | 'device_limit' | 'invalid_key'; used?: number; limit?: number | null };
export type RegisterDeps = {
  findLicense: (key: string) => Promise<{ revoked: boolean } | null>;
  register: (r: { key: string; device: string; platform: Platform; label: string | null; kitVersion: string | null; enforce: boolean }) => Promise<RegisterResult>;
  enforce?: boolean; // 없으면 환경변수 VIDEOKIT_DEVICE_ENFORCE
  now?: number;
};

// label: 최대 40자, 줄바꿈 · 제어 문자는 공백으로. 키트 기본값은 모델 식별자(호스트명은 넣지 않음).
const cleanLabel = (v: unknown) => {
  if (typeof v !== 'string') return null;
  const s = v.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40);
  return s || null;
};

// POST /api/videokit/devices/register (계약 v2 §2.1). 검사 순서: 키 형식 → 요청 수(latest와 같은 키당 분당 10번) → 키 조회 → 본문 → 등록.
export async function handleRegister(req: Request, deps: RegisterDeps): Promise<Response> {
  const key = normalizeKey(/^Bearer\s+(.+)$/i.exec(req.headers.get('authorization') ?? '')?.[1]);
  if (!isKey(key)) return invalid();
  if (tooMany(key, deps.now)) return json({ error: 'rate_limited' }, 429, { 'Retry-After': '60' });
  let license: { revoked: boolean } | null;
  try { license = await deps.findLicense(key); }
  catch (e) { console.error('[videokit] license lookup failed', (e as Error).message); return json({ error: 'unavailable' }, 503); }
  if (!license || license.revoked) return invalid();

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const device = typeof body?.device === 'string' ? body.device.trim() : '';
  const platform = body?.platform as Platform;
  if (!body || !DEVICE_PATTERN.test(device) || !PLATFORMS.includes(platform) || (body.label != null && typeof body.label !== 'string')) return json({ error: 'bad_request' }, 400);
  const kitVersion = typeof body.kit_version === 'string' && VERSION.test(body.kit_version) ? body.kit_version : null;

  let r: RegisterResult;
  try { r = await deps.register({ key, device: device.toLowerCase(), platform, label: cleanLabel(body.label), kitVersion, enforce: deps.enforce ?? deviceEnforced() }); }
  catch (e) { console.error('[videokit] device register failed', (e as Error).message); return json({ error: 'unavailable' }, 503); }
  if (r.status === 'invalid_key') return invalid();
  const counts = { used: r.used ?? 0, limit: r.limit ?? null };
  if (r.status === 'device_limit') return overLimit(counts);
  return json({ status: r.status, ...counts });
}

export function supabaseRegisterDeps(sb: SupabaseClient): RegisterDeps {
  return {
    async findLicense(key) {
      const { data, error } = await sb.from(TABLE).select('revoked').eq('key', key).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? { revoked: !!data.revoked } : null;
    },
    async register(r) {
      const { data, error } = await sb.rpc('videokit_register_device', {
        p_key: r.key, p_device: r.device, p_platform: r.platform, p_label: r.label, p_kit_version: r.kitVersion, p_enforce: r.enforce,
      });
      if (error) throw new Error(error.message);
      return data as RegisterResult;
    },
  };
}

// ---- 추가 기기 판매 ----
// 결제 화면에 보일지. 기본 꺼짐(약관 변경 공지 전).
export const deviceAddonOn = () => ['1', 'true', 'on'].includes(env('VIDEOKIT_DEVICE_ADDON_ON').trim().toLowerCase());

// 추가 기기 주문번호: vk-device-r-<uuid>-<표식 12자> (61자). 표식 = HMAC(서버 비밀, 키 + uuid).
// 키는 토스 metadata(key)로 돌아오고, 승인 때 표식을 다시 계산해 그 키로 만든 주문인지 확인한다(다른 키로 바꿔치기 방지).
// 서버 비밀은 따로 두지 않고 service_role 키에서 끌어낸다(서버에만 있는 값).
const orderSecret = () => { const s = env('SUPABASE_SERVICE_ROLE_KEY'); return s ? `videokit-device-order:${s}` : ''; };
const deviceTag = (secret: string, key: string, uuid: string) => createHmac('sha256', secret).update(`${key}:${uuid}`).digest('hex').slice(0, 12);
const DEVICE_ORDER = /^vk-device-r-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-([0-9a-f]{12})$/;
export function makeDeviceOrderId(key: string, uuid = randomUUID()): string | null {
  const secret = orderSecret();
  return secret && isKey(key) ? `vk-device-r-${uuid}-${deviceTag(secret, key, uuid)}` : null;
}
export function deviceOrderMatches(orderId: unknown, key: unknown): boolean {
  const m = typeof orderId === 'string' ? DEVICE_ORDER.exec(orderId) : null;
  const k = normalizeKey(key), secret = orderSecret();
  if (!m || !isKey(k) || !secret) return false;
  const want = Buffer.from(deviceTag(secret, k, m[1])), got = Buffer.from(m[2]);
  return want.length === got.length && timingSafeEqual(want, got);
}

type LicenseRow = { key: string; email: string; order_id: string | null; created_at: string; revoked: boolean; device_limit: number | null; reset_count: number; last_reset_at: string | null };
export type Allowance = { used: number; limit: number | null };

async function deviceCounts(sb: SupabaseClient, key: string): Promise<Allowance> {
  const { data, error } = await sb.rpc('videokit_check_device', { p_key: key, p_device: null });
  if (error) throw new Error(error.message);
  const d = data as { used: number; limit: number | null };
  return { used: Number(d.used) || 0, limit: d.limit ?? null };
}

// 결제 화면의 구매자 키 확인 (POST /api/videokit/device/check). 구매자만 살 수 있게 키가 있고 해지되지 않았는지 본다.
// 대수 제한이 없는 키(device_limit NULL, 종전 약관)는 추가 기기가 필요 없으므로 팔지 않는다.
export async function deviceKeyStatus(sb: SupabaseClient, rawKey: unknown):
  Promise<{ ok: true; key: string; used: number; limit: number } | { ok: false; error: 'invalid' | 'unlimited' }> {
  const key = normalizeKey(rawKey);
  if (!isKey(key)) return { ok: false, error: 'invalid' };
  const { data, error } = await sb.from(TABLE).select('revoked').eq('key', key).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.revoked) return { ok: false, error: 'invalid' };
  const c = await deviceCounts(sb, key);
  if (c.limit === null) return { ok: false, error: 'unlimited' };
  return { ok: true, key, used: c.used, limit: c.limit };
}

// 카드 · 가상계좌 결제가 확인된 추가 기기 주문을 반영한다(허용 대수 +1). 주문번호가 PK라서 다시 불러도 한 번만 들어간다.
// added: 이번에 넣음 / exists: 이미 들어 있음 / mismatch: 주문번호 표식이 이 키와 맞지 않음 / invalid: 키가 없거나 해지됨
export async function grantDeviceAddon(sb: SupabaseClient, o: { orderId: string; key: unknown; amount: number }):
  Promise<{ status: 'added' | 'exists'; key: string; allowance: Allowance } | { status: 'mismatch' | 'invalid' }> {
  const key = normalizeKey(o.key);
  if (!deviceOrderMatches(o.orderId, key)) return { status: 'mismatch' };
  const { data: lic, error: e1 } = await sb.from(TABLE).select('revoked').eq('key', key).maybeSingle();
  if (e1) throw new Error(e1.message);
  if (!lic || lic.revoked) return { status: 'invalid' };
  const { error } = await sb.from('videokit_device_addons').insert({ id: o.orderId, license_key: key, devices: 1, source: 'card', amount: o.amount });
  if (error && error.code !== '23505') throw new Error(error.message);
  return { status: error ? 'exists' : 'added', key, allowance: await deviceCounts(sb, key) };
}

// 결제 완료 화면 · 가상계좌 웹훅이 부른다: 허용 대수 +1(멱등) → 이번에 넣었으면 구매자 확인 메일 · 판매자 알림.
// receipt: 판매자 알림에 넣을 영수증 줄. DB 오류는 throw(웹훅은 500으로 재시도).
export async function settleDeviceOrder(o: { orderId: string; amount: number; meta: Record<string, string>; receipt: [string, string][] }, sb: SupabaseClient = db()) {
  const r = await grantDeviceAddon(sb, { orderId: o.orderId, key: o.meta.key, amount: o.amount });
  const email = String(o.meta.email ?? ''), name = String(o.meta.name ?? '구매자');
  const k = normalizeKey(o.meta.key);
  const result = r.status === 'added' || r.status === 'exists'
    ? `기기 +1 반영됨 · 허용 ${r.allowance.limit === null ? '제한 없음' : `${r.allowance.limit}대`} (등록 ${r.allowance.used}대)`
    : `반영 안 됨(${r.status === 'mismatch' ? '주문번호와 키가 맞지 않음' : '키가 없거나 해지됨'}) — scripts/videokit-devices.mjs add 로 직접 처리`;
  if (r.status === 'added') await sendDeviceAddonMail(email, { orderId: o.orderId, name, key: r.key, limit: r.allowance.limit, used: r.allowance.used }).catch(() => false);
  if (r.status !== 'exists') {
    if (r.status !== 'added') console.error('[videokit] device addon not applied', o.orderId, r.status);
    await notifySeller({ orderId: o.orderId, plan: 'device', amount: o.amount, coupon: null, email, name },
      [['구매자 키', isKey(k) ? maskKey(k) : '(없음)'], ['기기 반영', result], ...o.receipt], '해당 없음(추가 기기)').catch(() => false);
  }
  return r;
}

// ---- 운영봇 (scripts/videokit-devices.mjs) ----
export const maskKey = (k: string) => `VK-…-${k.slice(-4)}`;

// 키 · 이메일 · 주문번호로 키를 찾는다. 이메일은 키가 여러 개일 수 있다.
export async function findLicenses(sb: SupabaseClient, query: string): Promise<LicenseRow[]> {
  const q = query.trim();
  const cols = 'key,email,order_id,created_at,revoked,device_limit,reset_count,last_reset_at';
  const k = normalizeKey(q);
  const base = sb.from(TABLE).select(cols);
  const { data, error } = await (isKey(k) ? base.eq('key', k) : q.includes('@') ? base.ilike('email', q.replace(/[%_\\]/g, '\\$&')) : base.eq('order_id', q)).order('created_at');
  if (error) throw new Error(error.message);
  return (data ?? []) as LicenseRow[];
}

export async function describeLicense(sb: SupabaseClient, lic: LicenseRow) {
  const [{ data: devices, error: e1 }, { data: addons, error: e2 }, counts] = await Promise.all([
    sb.from('videokit_devices').select('device_hash,platform,label,kit_version,registered_at,last_seen_at').eq('license_key', lic.key).order('registered_at').order('id'),
    sb.from('videokit_device_addons').select('id,devices,source,created_at').eq('license_key', lic.key).order('created_at'),
    deviceCounts(sb, lic.key),
  ]);
  if (e1 || e2) throw new Error((e1 ?? e2)!.message);
  return {
    key: maskKey(lic.key), email: lic.email, order_id: lic.order_id, created_at: lic.created_at, revoked: lic.revoked,
    device_limit: lic.device_limit, extra: (addons ?? []).reduce((n, a) => n + Number(a.devices), 0), allowance: counts.limit, used: counts.used,
    enforce: deviceEnforced(), reset_count: lic.reset_count, last_reset_at: lic.last_reset_at,
    devices: (devices ?? []).map((d, i) => ({ n: i + 1, device: String(d.device_hash).slice(0, 8), platform: d.platform, label: d.label, kit_version: d.kit_version, registered_at: d.registered_at, last_seen_at: d.last_seen_at,
      ...(counts.limit !== null && i >= counts.limit ? { over_limit: true } : {}) })),
    addons: (addons ?? []).map(a => ({ id: a.id, devices: a.devices, source: a.source, created_at: a.created_at })),
  };
}

// 리셋: 그 키의 기기를 모두 지우고 reset_count + 1 (device_limit · 추가분은 그대로). dryRun이면 지우지 않고 지울 목록만.
export async function resetDevices(sb: SupabaseClient, lic: LicenseRow, { dryRun = false } = {}) {
  if (dryRun) {
    const { data, error } = await sb.from('videokit_devices').select('platform,label,registered_at').eq('license_key', lic.key).order('registered_at').order('id');
    if (error) throw new Error(error.message);
    return { key: maskKey(lic.key), deleted: 0, would_delete: (data ?? []).length, devices: data ?? [], reset_count: lic.reset_count, reset_at: null, dry_run: true };
  }
  const { data, error } = await sb.rpc('videokit_reset_devices', { p_key: lic.key });
  if (error) throw new Error(error.message);
  if (!data) throw new Error('license disappeared');
  return { key: maskKey(lic.key), ...(data as object) };
}

// 추가분 넣기(계좌이체 입금 확인 뒤 · 수동). orderId가 있으면 그 주문번호로(다시 실행해도 한 번만), 없으면 manual-<uuid>.
export async function addDevices(sb: SupabaseClient, lic: LicenseRow, devices: number, { orderId = '', note = '', dryRun = false } = {}) {
  const id = orderId || `manual-${randomUUID()}`;
  const source = orderId ? 'transfer' : 'manual';
  const before = await deviceCounts(sb, lic.key);
  if (dryRun) return { key: maskKey(lic.key), id, devices, source, added: false, dry_run: true, allowance_before: before.limit, allowance_after: before.limit === null ? null : before.limit + devices, used: before.used };
  const { error } = await sb.from('videokit_device_addons').insert({ id, license_key: lic.key, devices, source, ...(note ? { note: note.slice(0, 200) } : {}) });
  if (error && error.code !== '23505') throw new Error(error.message);
  const after = await deviceCounts(sb, lic.key);
  return { key: maskKey(lic.key), id, devices, source, added: !error, allowance_before: error ? after.limit : before.limit, allowance_after: after.limit, used: after.used };
}
