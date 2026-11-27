// 클로드 비디오 키트 구매자 키와 온라인 업데이트 (서버 전용).
// - 키: VK-XXXX-XXXX-XXXX (대문자 · 숫자, 헷갈리는 0/O · 1/I 제외). Supabase 테이블 videokit_licenses (sql/videokit-licenses.sql).
//   같은 주문번호에는 키가 하나다. 결제 완료 화면 새로고침 · 웹훅 재시도 · 재발송이 모두 같은 키를 받는다.
// - GET /api/videokit/latest: 키가 맞으면 비공개 버킷의 releases/latest.json을 읽어 10분 서명 링크를 준다.
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

// 주문번호 하나에 키 하나. 이미 있으면 그 키를 돌려준다 (새로 만들지 않음).
export async function issueLicense(sb: SupabaseClient, email: string, orderId: string): Promise<{ key: string; created: boolean }> {
  const find = async () => {
    const { data, error } = await sb.from(TABLE).select('key').eq('order_id', orderId).maybeSingle();
    if (error) throw new Error(`license lookup: ${error.message}`);
    return data?.key as string | undefined;
  };
  const found = await find();
  if (found) return { key: found, created: false };
  for (let i = 0; i < 3; i++) {
    const key = newKey();
    const { error } = await sb.from(TABLE).insert({ key, email, order_id: orderId });
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
export type ReleaseEntry = { version: string; path: string; sha256: string; size: number };
export type LatestJson = Partial<Record<Platform, ReleaseEntry>> & { notes?: string };

export type LatestDeps = {
  // 키 조회. 없으면 null, DB 오류면 throw.
  findLicense: (key: string) => Promise<{ revoked: boolean } | null>;
  touch: (key: string, version: string | null) => Promise<void>;
  readLatest: () => Promise<LatestJson | null>;
  sign: (path: string, seconds: number) => Promise<string | null>;
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

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
const invalid = () => json({ error: 'invalid_key' }, 401);

const VERSION = /^[0-9A-Za-z.+-]{1,40}$/;
const isEntry = (e: unknown): e is ReleaseEntry => {
  const r = e as ReleaseEntry | undefined;
  return !!r && typeof r.version === 'string' && typeof r.path === 'string' && r.path.startsWith('releases/') && !r.path.includes('..')
    && typeof r.sha256 === 'string' && /^[0-9a-f]{64}$/i.test(r.sha256) && Number.isSafeInteger(r.size) && r.size > 0;
};

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

  let latest: LatestJson | null = null;
  try { latest = await deps.readLatest(); } catch (e) { console.error('[videokit] latest.json read failed', (e as Error).message); }
  const entry = latest?.[platform];
  if (!isEntry(entry)) return json({ error: 'no_release' }, 503);
  const signed = await deps.sign(entry.path, SIGN_SECONDS).catch(() => null);
  if (!signed) { console.error('[videokit] release signed url failed', entry.path); return json({ error: 'unavailable' }, 503); }

  await deps.touch(key, version).catch(e => console.error('[videokit] license touch failed', (e as Error).message));
  return json({ version: entry.version, platform, sha256: entry.sha256, size: entry.size, url: signed, notes: typeof latest?.notes === 'string' ? latest.notes : '' });
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
    async sign(path, seconds) {
      const { data, error } = await storage.createSignedUrl(path, seconds, { download: path.split('/').pop() });
      return error ? null : data?.signedUrl ?? null;
    },
  };
}
