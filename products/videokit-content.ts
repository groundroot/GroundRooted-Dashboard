// 클로드 비디오 키트 1.4.2 콘텐츠 서버 (서버 전용). 약속: FCP 키트 저장소 docs/update_server_contract_v3.md.
// - GET /api/videokit/content (§2.1): 등록된 기기에만 판매자 콘텐츠(1차 research 묶음)를 준다. 21일 임대 · 7일 갱신.
//   구매자별 표식을 넣은 개인 사본을 처음 요청 때 한 번 만들어 버킷 content/personal/<subject>/<pack>-<version>.vkp에 두고
//   (표 videokit_content_personal), 그 파일로 10분 서명 링크를 준다. 사본을 만들지 못하면 503 — 마스터를 대신 주지 않는다.
// - POST /api/videokit/admin/trace (§2.4): 유출본에서 읽은 표식으로 구매자를 찾는다. VIDEOKIT_ADMIN_TOKEN 전용.
// 표식 계산은 products/videokit-mark.ts, 표 · 함수는 sql/videokit-content.sql.
// 키 · 기기 값 · 관찰 내용은 로그에 남기지 않는다(검출 로그에는 결과 주문번호만).
import { createHash, timingSafeEqual } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  DEVICE_PATTERN, PLATFORMS, SIGN_SECONDS, compareVersions, db, deviceEnforced, invalid, isKey, json, normalizeKey, overLimit, tooMany, unregistered,
  type DeviceStatus, type Platform,
} from './videokit-license.ts';
import { contentKey, leaseSig, orderLabel, personalCopy, subject, trace, traceLink, type Literal, type Observation, type TraceKey, type Variants } from './videokit-mark.ts';

const env = (k: string, d = '') => process.env[k] || d;

export const PACK_ID = /^[a-z0-9-]{1,32}$/;
export const PACK_VERSION = /^\d{4}\.\d{2}\.\d{2}-\d{1,4}$/;
const KIT_VERSION = /^[0-9A-Za-z.]{1,40}$/;
const DAY = 86400_000;
const posInt = (v: string, d: number) => (/^\d{1,3}$/.test(v.trim()) && Number(v) > 0 ? Number(v) : d);
export const leaseDays = () => posInt(env('VIDEOKIT_LEASE_DAYS'), 21);
export const renewDays = () => posInt(env('VIDEOKIT_RENEW_DAYS'), 7);
// YYYY-MM-DDTHH:MM:SSZ (밀리초 없음)
const utc = (ms: number) => new Date(Math.floor(ms / 1000) * 1000).toISOString().replace('.000Z', 'Z');

export const INDEX_PATH = 'content/index.json';
export const masterPath = (pack: string, version: string, file: 'master.zip' | 'variants.json') => `content/master/${pack}/${version}/${file}`;
export const personalContentPath = (subj: string, pack: string, version: string) => `content/personal/${subj}/${pack}-${version}.vkp`;

// content/index.json: {"packs":{"research":{"version":"2026.12.05-1","min_kit":"1.4.2","platforms":["mac","windows"],"files":29}},"notice":""}
export type IndexPack = { version: string; min_kit: string; platforms: Platform[]; files: number };
export type PersonalRow = { license_key: string; pack: string; version: string; path: string; sha256: string; size: number; created_at: string };

export type ContentDeps = {
  findLicense: (key: string) => Promise<{ revoked: boolean; order_id: string | null } | null>;   // DB 오류면 throw
  checkDevice: (key: string, device: string) => Promise<DeviceStatus>;
  readIndex: () => Promise<unknown | null>;                       // 파일이 없으면 null, 그 밖의 오류는 throw
  findPersonal: (key: string) => Promise<PersonalRow[]>;          // 그 키의 개인 사본 행 전부
  readMaster: (pack: string, version: string) => Promise<{ zip: Buffer; variants: Variants }>;
  putPersonal: (path: string, body: Buffer) => Promise<void>;
  savePersonal: (row: Omit<PersonalRow, 'created_at'>) => Promise<PersonalRow>;   // 이미 있으면(경합) 있는 행
  removePersonal: (rows: PersonalRow[]) => Promise<void>;         // 옛 버전 사본 정리(행 + 파일)
  sign: (path: string, seconds: number) => Promise<string | null>;
  touchDevice: (key: string, device: string, kit: string) => Promise<void>;
  recordLease: (r: { key: string; device: string; pack: string; version: string; issuedAt: string; expiresAt: string; download: boolean }) => Promise<void>;
  secrets: { mark: string; content: string };
  enforce?: boolean;
  now?: number;
};

// ---- 요청 수 (§6) ----
// /latest와 같은 키당 분당 10번 카운터(tooMany)를 함께 쓴다. 아래 둘은 서버 인스턴스 메모리라 인스턴스마다 따로 센다.
const makes = new Map<string, number[]>(), downloads = new Map<string, number[]>();
function bump(m: Map<string, number[]>, key: string, now: number) {
  const recent = (m.get(key) ?? []).filter(t => now - t < DAY);
  recent.push(now);
  m.set(key, recent);
  if (m.size > 5000) for (const [k, v] of m) if (now - v[v.length - 1] >= DAY) m.delete(k);
  return recent.length;
}
export const MAKE_LIMIT = 20, DOWNLOAD_ALERT = 30;
export const resetContentLimits = () => { makes.clear(); downloads.clear(); traceHits.clear(); };

function parseIndex(raw: unknown): { packs: Record<string, IndexPack>; notice: string } | 'bad' {
  const r = raw as { packs?: Record<string, IndexPack>; notice?: unknown } | null;
  if (!r || typeof r !== 'object' || !r.packs || typeof r.packs !== 'object') return 'bad';
  for (const [id, p] of Object.entries(r.packs)) {
    if (!PACK_ID.test(id) || !p || typeof p.version !== 'string' || !PACK_VERSION.test(p.version) || typeof p.min_kit !== 'string' || !KIT_VERSION.test(p.min_kit)
      || !Array.isArray(p.platforms) || !p.platforms.every(x => PLATFORMS.includes(x)) || !Number.isSafeInteger(p.files) || p.files < 0) return 'bad';
  }
  // notice: 키트가 한 줄 그대로 보인다. 120자 이하 평문(<, >, 제어 문자 없음)이 아니면 비운다.
  let notice = typeof r.notice === 'string' ? r.notice : '';
  if (notice.length > 120 || /[<>\u0000-\u001f\u007f]/.test(notice)) { console.error('[videokit] content/index.json notice is not plain text, dropped'); notice = ''; }
  return { packs: r.packs, notice };
}

// have=research:2026.12.05-1,presets:… → Map. 형식이 틀리면 null.
function parseHave(v: string | null): Map<string, string> | null {
  const out = new Map<string, string>();
  if (!v) return out;
  for (const part of v.split(',')) {
    const m = /^([a-z0-9-]{1,32}):(\d{4}\.\d{2}\.\d{2}-\d{1,4})$/.exec(part);
    if (!m) return null;
    out.set(m[1], m[2]);
  }
  return out;
}

const unavailable = () => json({ error: 'unavailable' }, 503);

// 그 구매자의 개인 사본(행)을 찾거나 만든다. 같은 구매자는 기기가 달라도 같은 사본. 실패하면 throw(→ 503, 마스터는 주지 않음).
async function ensurePersonal(deps: ContentDeps, key: string, order: string, id: string, version: string, rows: PersonalRow[], now: number): Promise<PersonalRow | 'limited'> {
  const have = rows.find(r => r.pack === id && r.version === version);
  if (have) {
    // 새 버전 사본이 만들어진 지 30일이 지나면 같은 묶음의 옛 버전 사본을 지운다(검출은 공식으로 다시 계산하므로 필요 없음).
    const old = rows.filter(r => r.pack === id && r.version !== version);
    if (old.length && now - Date.parse(have.created_at) > 30 * DAY)
      await deps.removePersonal(old).catch(e => console.error('[videokit] old content copy cleanup failed', (e as Error).message));
    return have;
  }
  if (bump(makes, key, now) > MAKE_LIMIT) return 'limited';
  const { zip, variants } = await deps.readMaster(id, version);
  const body = personalCopy(zip, variants, { secret: deps.secrets.mark, key, pack: id, version, order });
  const path = personalContentPath(subject(deps.secrets.mark, key), id, version);
  await deps.putPersonal(path, body);
  return deps.savePersonal({ license_key: key, pack: id, version, path, sha256: createHash('sha256').update(body).digest('hex'), size: body.length });
}

// 검사 순서(§2.1): 키 형식 → 요청 수 → 키 조회 → 파라미터 → 기기 미등록 → 한도 밖 → 묶음 → 사본 · 서명 → 200
export async function handleContent(req: Request, deps: ContentDeps): Promise<Response> {
  const now = deps.now ?? Date.now();
  const key = normalizeKey(/^Bearer\s+(.+)$/i.exec(req.headers.get('authorization') ?? '')?.[1]);
  if (!isKey(key)) return invalid();
  if (tooMany(key, deps.now)) return json({ error: 'rate_limited' }, 429, { 'Retry-After': '60' });
  let license: { revoked: boolean; order_id: string | null } | null;
  try { license = await deps.findLicense(key); }
  catch (e) { console.error('[videokit] license lookup failed', (e as Error).message); return unavailable(); }
  if (!license || license.revoked) return invalid();

  const url = new URL(req.url);
  const platform = url.searchParams.get('platform') as Platform | null;
  if (!platform || !PLATFORMS.includes(platform)) return json({ error: 'bad_platform' }, 400);
  // 1.4.1 이하는 이 API를 부르지 않는다: 헤더가 없으면 v2 전환 규칙 없이 그냥 400.
  const header = req.headers.get('x-vk-device')?.trim() ?? '';
  const kit = url.searchParams.get('kit') ?? '';
  const have = parseHave(url.searchParams.get('have'));
  if (!DEVICE_PATTERN.test(header) || !KIT_VERSION.test(kit) || !have) return json({ error: 'bad_request' }, 400);
  const device = header.toLowerCase();

  // 기기: /latest와 같은 검사(v2 §2.2). 콘텐츠 API는 기기를 등록하지 않는다.
  let st: DeviceStatus;
  try { st = await deps.checkDevice(key, device); }
  catch (e) { console.error('[videokit] device check failed', (e as Error).message); return unavailable(); }
  if (st.rank === null) return unregistered(st);
  if ((deps.enforce ?? deviceEnforced()) && st.limit !== null && st.rank > st.limit) return overLimit(st);

  let raw: unknown;
  try { raw = await deps.readIndex(); }
  catch (e) { console.error('[videokit] content/index.json read failed', (e as Error).message); return unavailable(); }
  if (raw === null) return json({ error: 'no_content' }, 503);
  const index = parseIndex(raw);
  if (index === 'bad') { console.error('[videokit] content/index.json is malformed'); return unavailable(); }
  const packs = Object.entries(index.packs).filter(([, p]) => p.platforms.includes(platform) && compareVersions(p.min_kit, kit) <= 0)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  if (!packs.length) return json({ error: 'no_content' }, 503);

  const order = orderLabel(license.order_id, key);
  const out: { id: string; version: string; size: number; sha256: string; files: number; min_kit: string; url: string | null }[] = [];
  try {
    const rows = await deps.findPersonal(key);
    for (const [id, p] of packs) {
      const row = await ensurePersonal(deps, key, order, id, p.version, rows, now);
      if (row === 'limited') return json({ error: 'rate_limited' }, 429, { 'Retry-After': '3600' });
      if (!row.path.startsWith('content/personal/') || !/^[0-9a-f]{64}$/.test(row.sha256)) throw new Error('personal row is malformed');
      let signed: string | null = null;
      if (have.get(id) !== p.version) {
        signed = await deps.sign(row.path, SIGN_SECONDS);
        if (!signed) throw new Error('sign failed');
      }
      out.push({ id, version: p.version, size: row.size, sha256: row.sha256, files: p.files, min_kit: p.min_kit, url: signed });
    }
  } catch (e) { console.error('[videokit] content copy failed', (e as Error).message); return unavailable(); }

  const issuedAt = utc(now), renewAfter = utc(now + renewDays() * DAY), expiresAt = utc(now + leaseDays() * DAY);
  const sig = leaseSig(key, device, expiresAt, Object.fromEntries(out.map(p => [p.id, p.version])));
  const body = {
    lease: { issued_at: issuedAt, renew_after: renewAfter, expires_at: expiresAt, sig },
    content_key: contentKey(deps.secrets.content, key, device),
    packs: out,
    notice: index.notice,
  };
  // 받은 기록(판단에는 쓰지 않음, §4). 실패해도 응답은 그대로.
  await deps.touchDevice(key, device, kit).catch(e => console.error('[videokit] device touch failed', (e as Error).message));
  for (const p of out) await deps.recordLease({ key, device, pack: p.id, version: p.version, issuedAt, expiresAt, download: p.url !== null })
    .catch(e => console.error('[videokit] content lease record failed', (e as Error).message));
  // 다운로드가 키당 하루 30번을 넘으면 운영자 알림만(막지 않음). 키 공유 신호.
  if (out.some(p => p.url) && bump(downloads, key, now) === DOWNLOAD_ALERT + 1)
    console.error(`[videokit] ALERT content downloads over ${DOWNLOAD_ALERT}/day for key …-${key.slice(-4)} (possible key sharing)`);
  return json(body);
}

// ---- 운영용 의존성 ----
const bucket = (sb: SupabaseClient) => sb.storage.from(env('VIDEOKIT_BUCKET', 'videokit'));
const notFound = (e: { message?: string; status?: number; statusCode?: string | number } | null) =>
  !!e && (e.status === 400 || e.status === 404 || String(e.statusCode) === '404' || /not.?found/i.test(e.message ?? ''));

export function contentSecrets() {
  const mark = env('VIDEOKIT_MARK_SECRET'), content = env('VIDEOKIT_CONTENT_SECRET');
  return mark && content && mark !== content ? { mark, content } : null;
}

export function supabaseContentDeps(secrets: { mark: string; content: string }, sb: SupabaseClient = db()): ContentDeps {
  const storage = bucket(sb);
  const download = async (path: string) => {
    const { data, error } = await storage.download(path);
    if (error || !data) throw new Error(`${path}: ${error?.message || 'missing'}`);
    return Buffer.from(await data.arrayBuffer());
  };
  return {
    secrets,
    async findLicense(key) {
      const { data, error } = await sb.from('videokit_licenses').select('revoked,order_id').eq('key', key).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? { revoked: !!data.revoked, order_id: data.order_id ?? null } : null;
    },
    async checkDevice(key, device) {
      const { data, error } = await sb.rpc('videokit_check_device', { p_key: key, p_device: device });
      if (error) throw new Error(error.message);
      const d = data as { rank: number | null; used: number; limit: number | null };
      return { rank: d.rank ?? null, used: Number(d.used) || 0, limit: d.limit ?? null };
    },
    async readIndex() {
      const { data, error } = await storage.download(INDEX_PATH);
      if (error && notFound(error as never)) return null;
      if (error || !data) throw new Error(error?.message || 'missing');
      return JSON.parse(await data.text());
    },
    async findPersonal(key) {
      const { data, error } = await sb.from('videokit_content_personal').select('license_key,pack,version,path,sha256,size,created_at').eq('license_key', key);
      if (error) throw new Error(error.message);
      return (data ?? []) as PersonalRow[];
    },
    async readMaster(pack, version) {
      const [zip, variants] = await Promise.all([download(masterPath(pack, version, 'master.zip')), download(masterPath(pack, version, 'variants.json'))]);
      return { zip, variants: JSON.parse(variants.toString('utf8')) as Variants };
    },
    async putPersonal(path, body) {
      const { error } = await storage.upload(path, body, { upsert: true, contentType: 'application/zip', cacheControl: '0' });
      if (error) throw new Error(error.message);
    },
    async savePersonal(row) {
      const { data, error } = await sb.from('videokit_content_personal').insert(row).select('license_key,pack,version,path,sha256,size,created_at').single();
      if (!error) return data as PersonalRow;
      if (error.code !== '23505') throw new Error(error.message);
      // 다른 요청이 먼저 넣었다: 그 행을 쓴다(사본 바이트는 결정적이라 같은 파일).
      const { data: got, error: e2 } = await sb.from('videokit_content_personal').select('license_key,pack,version,path,sha256,size,created_at')
        .eq('license_key', row.license_key).eq('pack', row.pack).eq('version', row.version).single();
      if (e2) throw new Error(e2.message);
      return got as PersonalRow;
    },
    async removePersonal(rows) {
      const { error } = await storage.remove(rows.map(r => r.path));
      if (error) throw new Error(error.message);
      for (const r of rows) {
        const { error: e2 } = await sb.from('videokit_content_personal').delete().eq('license_key', r.license_key).eq('pack', r.pack).eq('version', r.version);
        if (e2) throw new Error(e2.message);
      }
    },
    async sign(path, seconds) {
      const { data, error } = await storage.createSignedUrl(path, seconds, { download: path.split('/').pop() });
      return error ? null : data?.signedUrl ?? null;
    },
    async touchDevice(key, device, kit) {
      const { error } = await sb.from('videokit_devices').update({ last_seen_at: new Date().toISOString(), kit_version: kit }).eq('license_key', key).eq('device_hash', device);
      if (error) throw new Error(error.message);
    },
    async recordLease(r) {
      const { error } = await sb.rpc('videokit_content_lease', {
        p_key: r.key, p_device: r.device, p_pack: r.pack, p_version: r.version, p_issued_at: r.issuedAt, p_expires_at: r.expiresAt, p_download: r.download,
      });
      if (error) throw new Error(error.message);
    },
  };
}

// ---- POST /api/videokit/admin/trace (§2.4) ----
export type TraceDeps = {
  token: string;                                   // VIDEOKIT_ADMIN_TOKEN (없으면 모두 거부)
  secret: string;                                  // VIDEOKIT_MARK_SECRET
  listKeys: () => Promise<TraceKey[]>;             // 모든 라이선스(revoked 포함)
  listLinks: () => Promise<{ code: string; order_id: string | null; email: string | null }[]>;   // videokit_download_links 전부
  now?: number;
};

// 이메일 일부만: alice@gmail.com → a***@g***.com
export function emailHint(email: string | null | undefined) {
  const m = /^([^@]+)@(.+)$/.exec(email ?? '');
  if (!m) return '';
  const dot = m[2].lastIndexOf('.');
  return `${Array.from(m[1])[0]}***@${Array.from(m[2])[0]}***${dot > 0 ? m[2].slice(dot) : ''}`;
}

const traceHits = new Map<string, number[]>();
function traceTooMany(token: string, now: number) {
  const id = createHash('sha256').update(token).digest('hex');
  const recent = (traceHits.get(id) ?? []).filter(t => now - t < 60_000);
  recent.push(now);
  traceHits.set(id, recent);
  return recent.length > 5;
}

function sameToken(a: string, b: string) {
  const x = createHash('sha256').update(a).digest(), y = createHash('sha256').update(b).digest();
  return timingSafeEqual(x, y);
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown, max: number) => typeof v === 'string' && v.length > 0 && v.length <= max;

export async function handleTrace(req: Request, deps: TraceDeps): Promise<Response> {
  const now = deps.now ?? Date.now();
  const got = /^Bearer\s+(.+)$/i.exec(req.headers.get('authorization') ?? '')?.[1]?.trim() ?? '';
  if (!deps.token || !got || !sameToken(got, deps.token)) return json({ error: 'unauthorized' }, 401);
  if (traceTooMany(deps.token, now)) return json({ error: 'rate_limited' }, 429, { 'Retry-After': '60' });
  const body = await req.json().catch(() => null) as unknown;
  if (!isObj(body) || !Array.isArray(body.observations) || body.observations.length > 50_000) return json({ error: 'bad_request' }, 400);

  try {
    if (body.source === 'link') {
      // /d/ zip 표식: value = 읽은 태그(12자)
      const tags = body.observations.map(o => (isObj(o) && str(o.path, 300) && /^[0-9a-f]{12}$/.test(String(o.value)) ? { path: o.path as string, tag: o.value as string } : null));
      if (tags.some(t => t === null)) return json({ error: 'bad_request' }, 400);
      const hits = traceLink(deps.secret, await deps.listLinks(), tags as { path: string; tag: string }[]);
      const link_hits = hits.map(x => ({ order_id: x.l.order_id ?? '', email_hint: emailHint(x.l.email), matched: x.matched, total: x.total }));
      console.log('[videokit] trace link', JSON.stringify(link_hits.map(h => h.order_id)));
      return json({ link_hits });
    }
    const pack = body.pack, version = body.version;
    if (typeof pack !== 'string' || !PACK_ID.test(pack) || typeof version !== 'string' || !PACK_VERSION.test(version)) return json({ error: 'bad_request' }, 400);
    const obs = body.observations.map(o => (isObj(o) && str(o.path, 300) && str(o.slot, 40) && Number.isSafeInteger(o.n) && (o.n as number) >= 2 && (o.n as number) <= 1000
      && Number.isSafeInteger(o.value) && (o.value as number) >= 0 && (o.value as number) < (o.n as number) ? { path: o.path, slot: o.slot, value: o.value, n: o.n } as Observation : null));
    const lits = Array.isArray(body.literal) ? body.literal : body.literal == null ? [] : null;
    const literal = lits?.map(l => (isObj(l) && str(l.order_id, 200) ? { order_id: l.order_id as string }
      : isObj(l) && str(l.path, 300) && /^[0-9a-f]{12}$/.test(String(l.tag)) ? { path: l.path as string, tag: l.tag as string } : null)) ?? null;
    if (obs.some(o => o === null) || !literal || literal.some(l => l === null) || literal.length > 1000) return json({ error: 'bad_request' }, 400);
    const keys = await deps.listKeys();
    const r = trace(deps.secret, keys, pack, version, obs as Observation[], literal as Literal[]);
    const candidates = r.candidates.map(c => ({ order_id: c.order_id, email_hint: emailHint(c.k.email), matched: c.matched, total: c.total, p_false: c.p_false }));
    console.log('[videokit] trace', r.verdict, JSON.stringify(candidates.map(c => c.order_id)), JSON.stringify(r.literalHits.map(h => h.order_id)));
    return json({ verdict: r.verdict, candidates, literal_hits: r.literalHits });
  } catch (e) { console.error('[videokit] trace failed', (e as Error).message); return unavailable(); }
}

// PostgREST는 한 번에 1000행까지만 준다: 끝까지 나눠 읽는다(안 그러면 N과 p_false가 틀림).
async function all<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await page(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if ((data ?? []).length < 1000) return out;
  }
}

export function supabaseTraceDeps(o: { token: string; secret: string }, sb: SupabaseClient = db()): TraceDeps {
  return {
    ...o,
    listKeys: () => all<TraceKey>((a, b) => sb.from('videokit_licenses').select('key,order_id,email').order('created_at').order('key').range(a, b)),
    listLinks: () => all<{ code: string; order_id: string | null; email: string | null }>((a, b) => sb.from('videokit_download_links').select('code,order_id,email').order('code').range(a, b)),
  };
}
