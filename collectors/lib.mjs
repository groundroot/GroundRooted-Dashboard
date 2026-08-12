// 공용 Supabase REST 헬퍼 — 의존성 0 (Node 18+ fetch 사용)
// 필요 env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// DRY_RUN=1 이면 실제 쓰기 대신 콘솔에 출력만 한다.

const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const DRY = process.env.DRY_RUN === "1";

function headers(extra = {}) {
  return {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

export function requireEnv() {
  if (DRY) return;
  if (!URL_ || !KEY) {
    console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다. (테스트는 DRY_RUN=1)");
    process.exit(1);
  }
}

/** select — 예: await sbSelect("projects", "select=id,slug&status=eq.active") */
export async function sbSelect(table, query) {
  if (DRY) { console.log(`[DRY select] ${table}?${query}`); return []; }
  const r = await fetch(`${URL_}/rest/v1/${table}?${query}`, { headers: headers() });
  if (!r.ok) throw new Error(`${table} select ${r.status}: ${await r.text()}`);
  return r.json();
}

/** upsert (on_conflict 컬럼 기준 merge) */
export async function sbUpsert(table, rows, onConflict) {
  const list = Array.isArray(rows) ? rows : [rows];
  if (!list.length) return;
  if (DRY) { console.log(`[DRY upsert] ${table} (${onConflict}) x${list.length}`, JSON.stringify(list[0]).slice(0, 200)); return; }
  const r = await fetch(`${URL_}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: "POST",
    headers: headers({ Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify(list),
  });
  if (!r.ok) throw new Error(`${table} upsert ${r.status}: ${await r.text()}`);
}

/** insert — 중복(unique 충돌)은 무시 */
export async function sbInsertIgnore(table, rows, onConflict) {
  const list = Array.isArray(rows) ? rows : [rows];
  if (!list.length) return;
  if (DRY) { console.log(`[DRY insert] ${table} x${list.length}`, JSON.stringify(list[0]).slice(0, 200)); return; }
  const r = await fetch(`${URL_}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: "POST",
    headers: headers({ Prefer: "resolution=ignore-duplicates,return=minimal" }),
    body: JSON.stringify(list),
  });
  if (!r.ok) throw new Error(`${table} insert ${r.status}: ${await r.text()}`);
}

/** update — 예: await sbUpdate("albums", "title=eq.X", {uploaded_at: "..."}) */
export async function sbUpdate(table, query, patch) {
  if (DRY) { console.log(`[DRY update] ${table}?${query}`, JSON.stringify(patch)); return; }
  const r = await fetch(`${URL_}/rest/v1/${table}?${query}`, {
    method: "PATCH",
    headers: headers({ Prefer: "return=minimal" }),
    body: JSON.stringify(patch),
  });
  if (!r.ok) throw new Error(`${table} update ${r.status}: ${await r.text()}`);
}
