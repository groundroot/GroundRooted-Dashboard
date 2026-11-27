// 키트 짧은 다운로드 링크를 하나 발급해 출력한다 (수동 발송 · 계좌이체 구매자 · 링크가 만료된 구매자). 메일은 보내지 않는다.
// 실행마다 새 링크를 만든다(같은 주문의 예전 링크도 만료일까지 그대로 열림).
// 실행 (환경변수 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY):
//   node scripts/videokit-make-link.mjs --email <이메일> --name <이름> --order <주문번호> [--days 7] [--max 10] [--dry-run]
//   node scripts/videokit-make-link.mjs --revoke <코드>      (그 링크를 바로 끈다: 환불 · 잘못 보냄 · 공유됨)
// 출력(표준 출력): 첫 줄 짧은 링크, 둘째 줄 "이 링크는 YYYY년 M월 D일에 삭제됩니다." (--dry-run은 DB에 쓰지 않고 코드 자리에 XXXXXXXX)
// --max: 이 링크로 받을 수 있는 횟수(맥 · 윈도우 버튼 합계, 기본 10, 1–100).
import { parseArgs } from 'node:util';
import { isEmail } from '../products/videokit-delivery.ts';
import { db } from '../products/videokit-license.ts';
import { createLink, DEFAULT_MAX_DOWNLOADS, expiryFor, kstDay, linkUrl, LINK_DAYS, revokeLink } from '../products/videokit-link.ts';

const usage = (msg) => {
  if (msg) console.error(msg);
  console.error('사용법: node scripts/videokit-make-link.mjs --email <이메일> --name <이름> --order <주문번호> [--days 7] [--max 10] [--dry-run]\n      node scripts/videokit-make-link.mjs --revoke <코드>\n      (환경변수 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요, --dry-run은 필요 없음)');
  process.exit(2);
};

let values;
try {
  ({ values } = parseArgs({ options: {
    email: { type: 'string' }, name: { type: 'string' }, order: { type: 'string' }, days: { type: 'string' }, max: { type: 'string' }, revoke: { type: 'string' }, 'dry-run': { type: 'boolean' },
  } }));
} catch (e) { usage(e.message); }

if (values.revoke !== undefined) {
  if (values['dry-run']) { console.log(`확인만 함: ${values.revoke} 끄기 (DB에 쓰지 않음)`); process.exit(0); }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) usage();
  try {
    const found = await revokeLink(db(), values.revoke);
    console.log(found ? `껐습니다: ${linkUrl(values.revoke.trim().toUpperCase())}` : `그런 링크가 없습니다: ${values.revoke}`);
    process.exit(found ? 0 : 1);
  } catch (e) { console.error(`끄기 실패: ${e.message}`); process.exit(1); }
}
const email = values.email?.trim(), name = values.name?.trim() ?? '', orderId = values.order?.trim();
const days = values.days === undefined ? LINK_DAYS : Number(values.days);
const maxDownloads = values.max === undefined ? DEFAULT_MAX_DOWNLOADS : Number(values.max);
if (!isEmail(email)) usage(`이메일 형식이 틀림: ${email ?? '(없음)'}`);
if (!name || name.length > 100) usage('이름이 없거나 너무 김');
if (!orderId || orderId.length > 100) usage('주문번호가 없거나 너무 김');
if (!Number.isInteger(days) || days < 1 || days > 30) usage('--days는 1–30 사이 정수');
if (!Number.isInteger(maxDownloads) || maxDownloads < 1 || maxDownloads > 100) usage('--max는 1–100 사이 정수');

if (values['dry-run']) {
  console.log(linkUrl('XXXXXXXX'));
  console.log(`이 링크는 ${kstDay(expiryFor(Date.now(), days))}에 삭제됩니다.`);
  console.error(`확인만 함: ${email} · ${name} · ${orderId} · 최대 ${maxDownloads}번 (DB에 쓰지 않음)`);
  process.exit(0);
}
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) usage();
try {
  const link = await createLink(db(), { email, name, orderId, days, maxDownloads });
  console.log(link.url);
  console.log(`이 링크는 ${kstDay(link.expiresAt)}에 삭제됩니다.`);
} catch (e) {
  console.error(`발급 실패: ${e.message}`);
  process.exit(1);
}
