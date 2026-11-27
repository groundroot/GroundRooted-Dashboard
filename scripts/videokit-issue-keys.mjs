// 구매자 키를 발급해 출력한다 (기존 구매자 일괄 발급 · 한 명 수동 발급). 카드 결제 구매자는 키트 메일에서 자동으로 받는다.
// 같은 주문번호는 다시 실행해도 새 키를 만들지 않고 이미 있는 키를 출력한다(status=existing). 메일은 보내지 않는다.
// 이름은 DB에 저장하지 않고 출력(안내 메일 작성용)에만 쓴다.
// 실행 (환경변수 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY):
//   node scripts/videokit-issue-keys.mjs <이메일> <이름> <주문번호>
//   node scripts/videokit-issue-keys.mjs --csv 구매자.csv      (첫 줄 머리글: email,name,order_id — 순서는 상관없음)
//   --dry-run 을 붙이면 DB에 쓰지 않고 입력만 확인한다.
// 출력(CSV, 표준 출력): email,name,order_id,key,status
import { readFile } from 'node:fs/promises';
import { isEmail } from '../products/videokit-delivery.ts';
import { db, issueLicense } from '../products/videokit-license.ts';

const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const rest = args.filter(a => a !== '--dry-run');
const usage = () => {
  console.error('사용법: node scripts/videokit-issue-keys.mjs <이메일> <이름> <주문번호> [--dry-run]\n      node scripts/videokit-issue-keys.mjs --csv <파일.csv> [--dry-run]   (머리글 email,name,order_id)\n      (환경변수 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요)');
  process.exit(2);
};

// 따옴표로 감싼 칸(쉼표 · 줄바꿈 · "" 포함)을 읽는 작은 CSV 파서.
function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; continue; }
    if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(v => v.trim()));
}

let buyers;
if (rest[0] === '--csv') {
  if (!rest[1]) usage();
  const rows = parseCsv((await readFile(rest[1], 'utf8')).replace(/^﻿/, ''));
  const head = (rows.shift() ?? []).map(h => h.trim().toLowerCase());
  const col = k => head.indexOf(k);
  if (col('email') < 0 || col('name') < 0 || col('order_id') < 0) { console.error('CSV 첫 줄에 email,name,order_id 머리글이 있어야 합니다.'); process.exit(2); }
  buyers = rows.map(r => ({ email: (r[col('email')] ?? '').trim(), name: (r[col('name')] ?? '').trim(), orderId: (r[col('order_id')] ?? '').trim() }));
} else if (rest.length === 3) {
  const [email, name, orderId] = rest.map(s => s.trim());
  buyers = [{ email, name, orderId }];
} else usage();

// 입력을 먼저 모두 확인한다. 하나라도 틀리면 아무것도 발급하지 않는다.
const bad = [];
const seen = new Set();
buyers.forEach((b, i) => {
  if (!isEmail(b.email)) bad.push(`${i + 1}번째: 이메일 형식이 틀림 (${b.email})`);
  if (!b.orderId || b.orderId.length > 100) bad.push(`${i + 1}번째: 주문번호 없음 또는 너무 김`);
  else if (seen.has(b.orderId)) bad.push(`${i + 1}번째: 주문번호 중복 (${b.orderId})`);
  seen.add(b.orderId);
});
if (bad.length) { console.error(bad.join('\n')); process.exit(1); }

const cell = v => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
console.log('email,name,order_id,key,status');
if (dry) {
  for (const b of buyers) console.log([b.email, b.name, b.orderId, '', 'dry-run'].map(cell).join(','));
  console.error(`확인만 함: ${buyers.length}명 (DB에 쓰지 않음)`);
  process.exit(0);
}
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) usage();
const sb = db();
let failed = 0;
for (const b of buyers) {
  try {
    const { key, created } = await issueLicense(sb, b.email, b.orderId);
    console.log([b.email, b.name, b.orderId, key, created ? 'new' : 'existing'].map(cell).join(','));
  } catch (e) {
    failed++;
    console.error(`발급 실패: ${b.orderId} — ${e.message}`);
  }
}
process.exit(failed ? 1 : 0);
