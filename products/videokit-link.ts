// 클로드 비디오 키트 짧은 다운로드 링크 https://groundrooted.com/d/<코드> (서버 전용).
// - 링크 하나 = 구매자 한 명. 페이지(/d/<코드>)에 맥용 · 윈도우용 버튼이 있고, 버튼(/d/<코드>/mac|windows)을 누르면
//   그때 비공개 버킷의 파일로 10분짜리 서명 링크를 만들어 보낸다. 파일은 버킷의 kit/current.json이 고른다.
// - 링크는 expires_at(발급일 + 7일, 그날 23:59 KST)에 무효가 된다. 만료된 행은 새 링크를 발급할 때와
//   만료된 링크로 요청이 올 때 지운다. 표: videokit_download_links (sql/videokit-download-links.sql).
// - 버튼을 누른 횟수(download_count) · 마지막 시각을 남긴다. 같은 링크는 1분에 10번, 모두 합쳐 max_downloads번(기본 10)까지 받는다.
// - 코드 추측 막기: 코드는 8자 crypto 랜덤(40비트)이고 어디에도 목록으로 나오지 않는다. 한 IP가 10분에 없는 · 만료 코드를
//   10번 요청하면 그 IP의 /d/* 요청을 10분 동안 막는다(맞는 코드도). 서버 인스턴스 메모리에 두므로 인스턴스마다 따로 센다.
import { randomBytes } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

const env = (k: string, d = '') => process.env[k] || d;

export const LINK_BASE = 'https://groundrooted.com';
export const LINK_DAYS = 7;
export const SIGN_SECONDS = 600;
export const DEFAULT_MAX_DOWNLOADS = 10;
const TABLE = 'videokit_download_links';
const CURRENT = 'kit/current.json';

// 32자: A-Z에서 I · O를 빼고(24), 숫자 2-9(8). 소문자가 없으니 l도 없다. 한 글자 5비트, 8자 40비트.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CODE_PATTERN = /^[A-HJ-NP-Z2-9]{8}$/;
export function newCode() {
  return Array.from(randomBytes(8), x => ALPHABET[x & 31]).join('');
}
// 사람이 옮겨 적은 주소도 받는다: 앞뒤 공백 · 소문자.
export const normalizeCode = (v: unknown) => (typeof v === 'string' ? v.trim().toUpperCase() : '');
export const linkUrl = (code: string) => `${LINK_BASE}/d/${code}`;

// 만료 시각: now + days 의 그날 23:59:59 KST. 메일 · 페이지에는 날짜만 적으므로 그날 하루는 온전히 열린다.
const KST = 9 * 3600_000;
export function expiryFor(now: number, days = LINK_DAYS) {
  const d = new Date(now + days * 86400_000 + KST);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59) - KST;
}
// "2026년 12월 4일"
export const kstDay = (ms: number) =>
  new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' }).format(ms);

// 받는 분 이름은 일부만 보인다: 강성철 → 강*철, 김철 → 김*. 이름 뒤에 붙은 말('(시험)' 등)은 그대로.
export function maskName(name: string | null | undefined) {
  const [first = '', ...rest] = (name ?? '').trim().split(/\s+/);
  const c = Array.from(first);
  const masked = c.length <= 1 ? first : c.length === 2 ? `${c[0]}*` : `${c[0]}${'*'.repeat(c.length - 2)}${c[c.length - 1]}`;
  return [masked, ...rest].join(' ').trim();
}

export const PLATFORMS = ['mac', 'windows'] as const;
export type Platform = (typeof PLATFORMS)[number];
export const fileName = (p: Platform, version: string) => `ClaudeVideoKit-${p === 'mac' ? 'Mac' : 'Windows'}-${version}.zip`;

// kit/current.json = {"version":"1.3","mac":{"path":"kit/links/1.3/ClaudeVideoKit-Mac-1.3.zip"},"windows":{"path":...}}
export type KitCurrent = { version: string } & Record<Platform, { path: string; sha256?: string; size?: number }>;
const VERSION = /^[0-9A-Za-z.]{1,40}$/;
export function isCurrent(c: unknown): c is KitCurrent {
  const v = c as KitCurrent | null;
  return !!v && typeof v.version === 'string' && VERSION.test(v.version) && PLATFORMS.every(p => {
    const e = v[p];
    return !!e && typeof e.path === 'string' && e.path.startsWith('kit/') && e.path.endsWith('.zip') && !e.path.includes('..');
  });
}

export type LinkRow = { code: string; email: string; name: string | null; order_id: string | null; expires_at: string; revoked: boolean; download_count: number; max_downloads: number };
export type LinkDeps = {
  find: (code: string) => Promise<LinkRow | null>;   // 없으면 null, DB 오류면 throw
  remove: (code: string) => Promise<void>;
  hit: (code: string, count: number) => Promise<void>;
  readCurrent: () => Promise<unknown>;               // 없으면 throw
  sign: (path: string, seconds: number, download: string) => Promise<string | null>;
  now?: number;
};

// 링크 하나당 1분에 10번(버튼). 서버 인스턴스 메모리에 두므로 인스턴스마다 따로 센다 (구매자 키 확인과 같은 방식).
const WINDOW_MS = 60_000, LIMIT = 10;
const hits = new Map<string, number[]>();
export function tooMany(code: string, now = Date.now()) {
  const recent = (hits.get(code) ?? []).filter(t => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(code, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v[v.length - 1] >= WINDOW_MS) hits.delete(k);
  return recent.length > LIMIT;
}

// 코드 추측 막기: IP 하나가 10분에 없는 · 만료 코드를 10번 요청하면 막는다. ip가 없으면(로컬) 세지 않는다.
const MISS_WINDOW_MS = 10 * 60_000, MISS_LIMIT = 10;
const misses = new Map<string, number[]>();
const recentMisses = (ip: string, now: number) => (misses.get(ip) ?? []).filter(t => now - t < MISS_WINDOW_MS);
export const ipBlocked = (ip: string | undefined, now = Date.now()) => !!ip && recentMisses(ip, now).length >= MISS_LIMIT;
function recordMiss(ip: string | undefined, now: number) {
  if (!ip) return;
  misses.set(ip, [...recentMisses(ip, now), now]);
  if (misses.size > 5000) for (const [k, v] of misses) if (now - v[v.length - 1] >= MISS_WINDOW_MS) misses.delete(k);
}
// Vercel은 x-real-ip · x-forwarded-for를 실제 접속 IP로 덮어쓴다.
export const clientIp = (h: Headers) => (h.get('x-real-ip') || h.get('x-forwarded-for')?.split(',')[0] || '').trim() || undefined;

export const resetLimits = () => { hits.clear(); misses.clear(); };

// 살아 있는 링크인지. 만료된 행은 이때 지운다. DB 오류는 '만료'가 아니라 unavailable(돈 낸 구매자에게 만료라고 잘못 말하지 않게).
// 없는 · 만료 · 막힌 코드는 그 IP의 실패로 센다.
async function live(code: string, deps: LinkDeps, ip: string | undefined): Promise<{ row: LinkRow } | { status: 'gone' | 'unavailable' }> {
  const now = deps.now ?? Date.now();
  const r = await lookup(code, deps, now);
  if ('status' in r && r.status === 'gone') recordMiss(ip, now);
  return r;
}
async function lookup(code: string, deps: LinkDeps, now: number): Promise<{ row: LinkRow } | { status: 'gone' | 'unavailable' }> {
  if (!CODE_PATTERN.test(code)) return { status: 'gone' };
  let row: LinkRow | null;
  try { row = await deps.find(code); }
  catch (e) { console.error('[videokit] link lookup failed', (e as Error).message); return { status: 'unavailable' }; }
  if (!row || row.revoked) return { status: 'gone' };
  if (Date.parse(row.expires_at) <= now) {
    await deps.remove(code).catch(e => console.error('[videokit] expired link delete failed', (e as Error).message));
    return { status: 'gone' };
  }
  return { row };
}

async function current(deps: LinkDeps): Promise<KitCurrent | null> {
  const c = await deps.readCurrent().catch(e => { console.error('[videokit] kit/current.json read failed', (e as Error).message); return null; });
  if (c && !isCurrent(c)) console.error('[videokit] kit/current.json is malformed');
  return isCurrent(c) ? c : null;
}

// ---- 페이지 /d/<코드> ----
export type LinkView =
  | { status: 'ok'; code: string; name: string; version: string; expiresAt: number }
  | { status: 'gone' }          // 없음 · 만료 · 막힘 → "링크가 만료되었습니다" (404)
  | { status: 'limited' }       // 이 IP가 없는 코드를 너무 많이 요청함
  | { status: 'unavailable' };  // DB · 파일 설정 오류 → "잠시 후 다시"

export async function loadLink(raw: unknown, deps: LinkDeps, ip?: string): Promise<LinkView> {
  const code = normalizeCode(raw);
  if (ipBlocked(ip, deps.now)) return { status: 'limited' };
  const r = await live(code, deps, ip);
  if (!('row' in r)) return r;
  const c = await current(deps);
  if (!c) return { status: 'unavailable' };
  return { status: 'ok', code, name: maskName(r.row.name), version: c.version, expiresAt: Date.parse(r.row.expires_at) };
}

// ---- 버튼 /d/<코드>/<mac|windows> ----
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
function notice(status: number, message: string, code: string, headers: Record<string, string> = {}) {
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>클로드 비디오 키트</title></head>
<body style="margin:0;min-height:100vh;background:#131316;color:#ecebe6;font-family:Pretendard,-apple-system,'Apple SD Gothic Neo',sans-serif;line-height:1.7;word-break:keep-all">
<main style="max-width:560px;margin:0 auto;padding:64px 20px"><p style="font-size:18px;margin:0 0 20px">${esc(message)}</p>
<a href="/d/${esc(code)}" style="color:#ff8a3d">다운로드 페이지로 돌아가기</a></main></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', ...headers } });
}
const toPage = (code: string) => new Response(null, { status: 303, headers: { Location: `/d/${encodeURIComponent(code)}`, 'Cache-Control': 'no-store' } });

export async function handleDownload(rawCode: unknown, rawPlatform: unknown, deps: LinkDeps, ip?: string): Promise<Response> {
  const code = normalizeCode(rawCode);
  const platform = rawPlatform as Platform;
  if (ipBlocked(ip, deps.now)) return notice(429, '요청이 너무 많습니다. 10분 뒤에 다시 시도해 주세요.', code, { 'Retry-After': '600' });
  if (!PLATFORMS.includes(platform)) return toPage(code);
  if (CODE_PATTERN.test(code) && tooMany(code, deps.now)) return notice(429, '요청이 너무 많습니다. 1분 뒤에 다시 눌러 주세요.', code, { 'Retry-After': '60' });

  const r = await live(code, deps, ip);
  if (!('row' in r)) return r.status === 'gone' ? toPage(code) : notice(503, '지금 파일을 준비하지 못했습니다. 잠시 후 다시 눌러 주세요.', code);
  if (r.row.download_count >= (r.row.max_downloads ?? DEFAULT_MAX_DOWNLOADS))
    return notice(429, '다운로드 횟수를 넘었습니다. 다시 받으시려면 키트를 받은 메일에 답장하거나 카카오톡으로 알려 주세요.', code);

  const c = await current(deps);
  const signed = c ? await deps.sign(c[platform].path, SIGN_SECONDS, fileName(platform, c.version)).catch(() => null) : null;
  if (!signed) {
    if (c) console.error('[videokit] kit signed url failed', c[platform].path);
    return notice(503, '지금 파일을 준비하지 못했습니다. 잠시 후 다시 눌러 주세요.', code);
  }
  await deps.hit(code, r.row.download_count + 1).catch(e => console.error('[videokit] link hit failed', (e as Error).message));
  return new Response(null, { status: 302, headers: { Location: signed, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
}

// ---- 운영용 의존성: Supabase 표 + 비공개 버킷 ----
export function supabaseLinkDeps(sb: SupabaseClient): LinkDeps {
  const storage = sb.storage.from(env('VIDEOKIT_BUCKET', 'videokit'));
  return {
    async find(code) {
      const { data, error } = await sb.from(TABLE).select('code,email,name,order_id,expires_at,revoked,download_count,max_downloads').eq('code', code).maybeSingle();
      if (error) throw new Error(error.message);
      return (data as LinkRow | null) ?? null;
    },
    async remove(code) {
      const { error } = await sb.from(TABLE).delete().eq('code', code);
      if (error) throw new Error(error.message);
    },
    async hit(code, count) {
      const { error } = await sb.from(TABLE).update({ download_count: count, last_download_at: new Date().toISOString() }).eq('code', code);
      if (error) throw new Error(error.message);
    },
    async readCurrent() {
      const { data, error } = await storage.download(CURRENT);
      if (error || !data) throw new Error(error?.message || 'missing');
      return JSON.parse(await data.text());
    },
    async sign(path, seconds, download) {
      const { data, error } = await storage.createSignedUrl(path, seconds, { download });
      return error ? null : data?.signedUrl ?? null;
    },
  };
}

// ---- 발급 ----
// reuse: 같은 주문의 살아 있는 링크가 있으면 그것을 돌려준다(결제 완료 화면 새로고침 · 웹훅 재시도). 재발송 · 수동 발급은 새 링크.
export type IssuedLink = { code: string; url: string; expiresAt: number; created: boolean };
export async function createLink(sb: SupabaseClient, o: { email: string; name?: string; orderId?: string; days?: number; maxDownloads?: number; reuse?: boolean; now?: number }): Promise<IssuedLink> {
  const now = o.now ?? Date.now();
  const nowIso = new Date(now).toISOString();
  // 만료된 링크 정리 (실패해도 발급은 계속)
  const { error: cleanup } = await sb.from(TABLE).delete().lte('expires_at', nowIso);
  if (cleanup) console.error('[videokit] expired links cleanup failed', cleanup.message);
  if (o.reuse && o.orderId) {
    const { data, error } = await sb.from(TABLE).select('code,expires_at').eq('order_id', o.orderId).eq('revoked', false).gt('expires_at', nowIso)
      .order('expires_at', { ascending: false }).limit(1).maybeSingle();
    if (error) throw new Error(`link lookup: ${error.message}`);
    if (data) return { code: data.code, url: linkUrl(data.code), expiresAt: Date.parse(data.expires_at), created: false };
  }
  const expiresAt = expiryFor(now, o.days ?? LINK_DAYS);
  for (let i = 0; i < 3; i++) {
    const code = newCode();
    const { error } = await sb.from(TABLE).insert({ code, email: o.email, name: o.name?.slice(0, 100) || null, order_id: o.orderId || null, expires_at: new Date(expiresAt).toISOString(), max_downloads: o.maxDownloads ?? DEFAULT_MAX_DOWNLOADS });
    if (!error) return { code, url: linkUrl(code), expiresAt, created: true };
    if (error.code !== '23505') throw new Error(`link insert: ${error.message}`);
  }
  throw new Error('link insert: code collision');
}

// 관리자가 링크를 바로 끈다 (환불 · 잘못 보냄 · 공유됨). 그 코드가 있었으면 true.
export async function revokeLink(sb: SupabaseClient, raw: string): Promise<boolean> {
  const code = normalizeCode(raw);
  if (!CODE_PATTERN.test(code)) return false;
  const { data, error } = await sb.from(TABLE).update({ revoked: true }).eq('code', code).select('code');
  if (error) throw new Error(`link revoke: ${error.message}`);
  return (data ?? []).length > 0;
}
