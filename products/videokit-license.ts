// 클로드 비디오 키트 구매자 키와 온라인 업데이트 (서버 전용).
// - 키: VK-XXXX-XXXX-XXXX (대문자 · 숫자, 헷갈리는 0/O · 1/I 제외). Supabase 테이블 videokit_licenses (sql/videokit-licenses.sql).
//   같은 주문번호에는 키가 하나다. 결제 완료 화면 새로고침 · 웹훅 재시도 · 재발송이 모두 같은 키를 받는다.
// - GET /api/videokit/latest: 키가 맞으면 비공개 버킷의 releases/latest.json을 읽어 10분 서명 링크를 준다.
//   v2(FCP 키트 저장소 docs/update_server_contract_v2.md): X-VK-Device 헤더로 기기 등록을 확인한다. 등록 · 리셋 · 추가 기기는 products/videokit-devices.ts.
// 키나 Authorization 헤더는 로그에 남기지 않는다.
import { randomBytes } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const env = (k: string, d = '') => process.env[k] || d;

// 32자: A-Z에서 I · O를 빼고(24), 숫자 2-9(8). 한 글자 5비트, 키 하나 60비트.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const KEY_PATTERN = /^VK-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

export function newKey() {
  const b = randomBytes(12);
  const c = Array.from(b, x => ALPHABET[x & 31]).join('');
  return `VK-${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8, 12)}`;
}

// 사람이 옮겨 적은 키도 받는다: 앞뒤 공백 · 소문자.
export const normalizeKey = (v: unknown) => (typeof v === 'string' ? v.trim().toUpperCase() : '');
export const isKey = (v: string) => KEY_PATTERN.test(v);

export function db(): SupabaseClient {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
}

const TABLE = 'videokit_licenses';

// ---- 기기 등록 (계약 v2) 공용 값 ----
// 새 키의 기본 허용 대수. VIDEOKIT_DEVICE_LIMIT_FROM(ISO 시각) 이후에 발급하는 키에만 넣는다.
// 그 전 키 · 환경변수가 없거나 형식이 틀리면 넣지 않는다(device_limit NULL = 무제한, 종전 약관).
export const DEFAULT_DEVICE_LIMIT = 2;
export function deviceLimitForNewKey(now = Date.now()): number | null {
  const v = env('VIDEOKIT_DEVICE_LIMIT_FROM').trim();
  const from = v ? Date.parse(v) : NaN;
  return Number.isNaN(from) || now < from ? null : DEFAULT_DEVICE_LIMIT;
}
// 대수 검사(한도 초과 403 device_limit) 스위치. 꺼져 있으면(기본) 등록 · 기록만 하고 한도는 막지 않는다.
// 미등록 403 device_unregistered와 1.4.0 이하 전환 규칙은 스위치와 상관없이 계약대로 동작한다(대수 검사가 아니므로).
export const deviceEnforced = () => ['1', 'true', 'on'].includes(env('VIDEOKIT_DEVICE_ENFORCE').trim().toLowerCase());
// 키트가 안내문에 보여 주는 주소(https여야 함). 구매자 기기 페이지가 아직 없으므로 판매 페이지의 문의 안내로 보낸다.
export const MANAGE_URL = 'https://groundrooted.com/videokit#contact';
// 응답의 limit은 키트가 숫자만 받으므로, 대수 제한이 없는 키(device_limit NULL, 종전 약관)는 999로 보낸다. DB에는 NULL 그대로.
export const UNLIMITED_LIMIT = 999;
export const limitOut = (limit: number | null) => (limit === null ? UNLIMITED_LIMIT : limit);
// 기기 값: HMAC-SHA256(구매자 키, 하드웨어ID)의 64자 hex. 서버는 형식만 확인하고 소문자로 저장한다.
export const DEVICE_PATTERN = /^[0-9a-f]{64}$/i;
// 키트(update.py)의 vkey와 같은 순서: 날짜 버전(YYYY.MM.DD.HHMM)은 번호 버전(1.3, 1.4.0 …)보다 낮다.
// 숫자 묶음을 뽑아 3칸까지 0으로 채우고, 파이썬 리스트처럼 앞에서부터(길이가 짧으면 작게) 비교한다.
export function vkey(v: unknown): [number, number[]] {
  const parts = (String(v ?? '').match(/\d+/g) ?? ['0']).map(Number);
  while (parts.length < 3) parts.push(0);
  return [parts[0] >= 2000 ? 0 : 1, parts];
}
export function compareVersions(a: unknown, b: unknown): number {
  const [ea, pa] = vkey(a), [eb, pb] = vkey(b);
  if (ea !== eb) return ea - eb;
  for (let i = 0; i < Math.min(pa.length, pb.length); i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return pa.length - pb.length;
}
// 헤더 없이(1.4.0 이하) 받을 수 있는 마지막 버전
export const BRIDGE_VERSION = '1.4.1';

// 주문번호 하나에 키 하나. 이미 있으면 그 키를 돌려준다 (새로 만들지 않음).
// VIDEOKIT_DEVICE_LIMIT_FROM 이후 발급이면 device_limit 2를 넣는다(그 전에는 insert가 지금과 똑같다 — 마이그레이션 전에도 동작).
export async function issueLicense(sb: SupabaseClient, email: string, orderId: string, now = Date.now()): Promise<{ key: string; created: boolean }> {
  const find = async () => {
    const { data, error } = await sb.from(TABLE).select('key').eq('order_id', orderId).maybeSingle();
    if (error) throw new Error(`license lookup: ${error.message}`);
    return data?.key as string | undefined;
  };
  const found = await find();
  if (found) return { key: found, created: false };
  for (let i = 0; i < 3; i++) {
    const key = newKey();
    const limit = deviceLimitForNewKey(now);
    const { error } = await sb.from(TABLE).insert({ key, email, order_id: orderId, ...(limit !== null ? { device_limit: limit } : {}) });
    if (!error) return { key, created: true };
    if (error.code !== '23505') throw new Error(`license insert: ${error.message}`);
    // 같은 주문을 다른 요청이 먼저 넣었거나(order_id) 키가 우연히 겹쳤다(key). 주문 키가 있으면 그것을 쓴다.
    const raced = await find();
    if (raced) return { key: raced, created: false };
  }
  throw new Error('license insert: key collision');
}

// ---- GET /api/videokit/latest ----

export const PLATFORMS = ['mac', 'windows'] as const;
export type Platform = (typeof PLATFORMS)[number];
export type ReleaseEntry = { version: string; path: string; sha256: string; size: number; notes?: string };
export type LatestJson = Partial<Record<Platform, ReleaseEntry>> & { notes?: string };

// 기기 상태: rank = 그 키의 기기를 registered_at 순으로 셌을 때 이 기기의 순번(미등록이면 null). limit null = 무제한.
export type DeviceStatus = { rank: number | null; used: number; limit: number | null };

export type LatestDeps = {
  // 키 조회. 없으면 null, DB 오류면 throw.
  findLicense: (key: string) => Promise<{ revoked: boolean } | null>;
  touch: (key: string, version: string | null) => Promise<void>;
  readLatest: () => Promise<LatestJson | null>;
  // 1.4.0 이하(헤더 없음)에 주는 고정 배포본 releases/bridge.json (latest.json과 같은 형식)
  readBridge: () => Promise<LatestJson | null>;
  // device가 null이면 개수만(rank null). DB 오류면 throw.
  checkDevice: (key: string, device: string | null) => Promise<DeviceStatus>;
  touchDevice: (key: string, device: string, version: string | null) => Promise<void>;
  sign: (path: string, seconds: number) => Promise<string | null>;
  enforce?: boolean; // 없으면 환경변수 VIDEOKIT_DEVICE_ENFORCE
  now?: number;
};

export const SIGN_SECONDS = 600;

// 키 하나당 1분에 10번까지. 서버 인스턴스 메모리에 두므로 인스턴스마다 따로 센다 (apply의 IP 제한과 같은 방식).
const WINDOW_MS = 60_000, LIMIT = 10;
const hits = new Map<string, number[]>();
export function tooMany(key: string, now = Date.now()) {
  const recent = (hits.get(key) ?? []).filter(t => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v[v.length - 1] >= WINDOW_MS) hits.delete(k);
  return recent.length > LIMIT;
}
export const resetLimits = () => hits.clear();

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
export const invalid = () => json({ error: 'invalid_key' }, 401);

export const VERSION = /^[0-9A-Za-z.+-]{1,40}$/;
// 키트는 version이 [0-9A-Za-z.]가 아니면 응답 이상으로 멈춘다. latest.json 값이 어긋나면 내보내지 않는다.
const RELEASE_VERSION = /^[0-9A-Za-z.]{1,40}$/;
const isEntry = (e: unknown): e is ReleaseEntry => {
  const r = e as ReleaseEntry | undefined;
  return !!r && typeof r.version === 'string' && RELEASE_VERSION.test(r.version) && typeof r.path === 'string' && r.path.startsWith('releases/') && !r.path.includes('..')
    && typeof r.sha256 === 'string' && /^[0-9a-f]{64}$/i.test(r.sha256) && Number.isSafeInteger(r.size) && r.size > 0;
};

// 기기 403 본문 (계약 v2 §2.2)
export const unregistered = (d: Pick<DeviceStatus, 'used' | 'limit'>) => json({
  error: 'device_unregistered', used: d.used, limit: limitOut(d.limit),
  register_hint: '이 기기는 업데이트 등록이 안 되어 있습니다. /videokit update를 실행하면 등록합니다.', manage_url: MANAGE_URL,
}, 403);
export const overLimit = (d: Pick<DeviceStatus, 'used' | 'limit'>) => json({ error: 'device_limit', limit: limitOut(d.limit), used: d.used, manage_url: MANAGE_URL }, 403);

// 검사 순서(계약 v2 §2.2): 키 → 요청 수 → 파라미터 → 헤더 없음(§6 전환) → 미등록 → 한도 밖 → 배포본.
export async function handleLatest(req: Request, deps: LatestDeps): Promise<Response> {
  const auth = req.headers.get('authorization') ?? '';
  const key = normalizeKey(/^Bearer\s+(.+)$/i.exec(auth)?.[1]);
  if (!isKey(key)) return invalid();
  if (tooMany(key, deps.now)) return json({ error: 'rate_limited' }, 429, { 'Retry-After': '60' });

  let license: { revoked: boolean } | null;
  try { license = await deps.findLicense(key); }
  catch (e) { console.error('[videokit] license lookup failed', (e as Error).message); return json({ error: 'unavailable' }, 503); }
  if (!license || license.revoked) return invalid();

  const url = new URL(req.url);
  const platform = url.searchParams.get('platform') as Platform | null;
  if (!platform || !PLATFORMS.includes(platform)) return json({ error: 'bad_platform' }, 400);
  const current = url.searchParams.get('current');
  const version = current && VERSION.test(current) ? current : null;
  const header = req.headers.get('x-vk-device');
  if (header !== null && !DEVICE_PATTERN.test(header.trim())) return json({ error: 'bad_device' }, 400);
  const device = header === null ? null : header.trim().toLowerCase();

  // 헤더 없음 = 1.4.0 이하 updater(§6.2). 1.4.1보다 낮으면 latest가 더 높아도 bridge.json의 1.4.1만 준다(403 금지, 스위치와 상관없음).
  // 1.4.1 이상인데 헤더가 없으면 헤더를 지운 요청이므로 미등록으로 본다.
  const bridge = device === null && compareVersions(current, BRIDGE_VERSION) < 0;
  if (device === null && !bridge) {
    try { return unregistered(await deps.checkDevice(key, null)); }
    catch (e) { console.error('[videokit] device check failed', (e as Error).message); return json({ error: 'unavailable' }, 503); }
  }
  if (device !== null) {
    let st: DeviceStatus;
    try { st = await deps.checkDevice(key, device); }
    catch (e) { console.error('[videokit] device check failed', (e as Error).message); return json({ error: 'unavailable' }, 503); }
    if (st.rank === null) return unregistered(st);
    // 등록은 되어 있지만 순번이 허용 대수 밖(추가 기기 환불 · 운영자가 한도를 낮춘 경우). 스위치가 켜져 있을 때만 막는다.
    if ((deps.enforce ?? deviceEnforced()) && st.limit !== null && st.rank > st.limit) return overLimit(st);
  }

  let latest: LatestJson | null = null;
  const file = bridge ? 'bridge.json' : 'latest.json';
  try { latest = await (bridge ? deps.readBridge() : deps.readLatest()); } catch (e) { console.error(`[videokit] ${file} read failed`, (e as Error).message); }
  const entry = latest?.[platform];
  if (!entry) return json({ error: 'no_release' }, 503);
  // 항목은 있는데 형식이 틀림 = 릴리스 업로드 실수. '업데이트 없음'이 아니라 일시 장애로 알린다.
  if (!isEntry(entry)) { console.error(`[videokit] ${file} entry is malformed`, platform); return json({ error: 'unavailable' }, 503); }
  const signed = await deps.sign(entry.path, SIGN_SECONDS).catch(() => null);
  if (!signed) { console.error('[videokit] release signed url failed', entry.path); return json({ error: 'unavailable' }, 503); }

  await deps.touch(key, version).catch(e => console.error('[videokit] license touch failed', (e as Error).message));
  if (device !== null) await deps.touchDevice(key, device, version).catch(e => console.error('[videokit] device touch failed', (e as Error).message));
  // 변경 내용: 플랫폼별 notes(mac.notes · windows.notes)가 있으면 그것, 없으면 최상위 notes.
  // bridge.json의 등록 안내문(계약 §6.2)은 배포할 때 notes에 넣는다. 서버는 덧붙이지 않고 그대로 보낸다.
  const notes = typeof entry.notes === 'string' ? entry.notes : typeof latest?.notes === 'string' ? latest.notes : '';
  return json({ version: entry.version, platform, sha256: entry.sha256.toLowerCase(), size: entry.size, url: signed, notes });
}

// 운영용 의존성: Supabase 테이블 + 비공개 버킷.
export function supabaseLatestDeps(sb: SupabaseClient = db()): LatestDeps {
  const storage = sb.storage.from(env('VIDEOKIT_BUCKET', 'videokit'));
  return {
    async findLicense(key) {
      const { data, error } = await sb.from(TABLE).select('revoked').eq('key', key).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? { revoked: !!data.revoked } : null;
    },
    async touch(key, version) {
      const { error } = await sb.from(TABLE).update({ last_seen_at: new Date().toISOString(), ...(version ? { last_version: version } : {}) }).eq('key', key);
      if (error) throw new Error(error.message);
    },
    async readLatest() {
      const { data, error } = await storage.download('releases/latest.json');
      if (error || !data) throw new Error(error?.message || 'missing');
      return JSON.parse(await data.text()) as LatestJson;
    },
    async readBridge() {
      const { data, error } = await storage.download('releases/bridge.json');
      if (error || !data) throw new Error(error?.message || 'missing');
      return JSON.parse(await data.text()) as LatestJson;
    },
    async checkDevice(key, device) {
      const { data, error } = await sb.rpc('videokit_check_device', { p_key: key, p_device: device });
      if (error) throw new Error(error.message);
      const d = data as { rank: number | null; used: number; limit: number | null };
      return { rank: d.rank ?? null, used: Number(d.used) || 0, limit: d.limit ?? null };
    },
    async touchDevice(key, device, version) {
      const { error } = await sb.from('videokit_devices').update({ last_seen_at: new Date().toISOString(), ...(version ? { kit_version: version } : {}) })
        .eq('license_key', key).eq('device_hash', device);
      if (error) throw new Error(error.message);
    },
    async sign(path, seconds) {
      const { data, error } = await storage.createSignedUrl(path, seconds, { download: path.split('/').pop() });
      return error ? null : data?.signedUrl ?? null;
    },
  };
}
