// 결제한 구매자에게 새 다운로드 링크를 다시 보낸다 (링크 기간이 지났거나 메일을 못 받았다고 할 때).
// 주문번호·이메일·이름은 토스 상점관리자의 결제 내역에서 확인한다 (자체 DB에는 저장하지 않음).
// 실행: (환경변수 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, VIDEOKIT_MAIL_FROM)
//   node scripts/videokit-resend.mjs <주문번호> <이메일> [이름]
import { nameOf, priceOf } from '../products/videokit.ts';
import { deliverKit, deliveryConfigured, isEmail } from '../products/videokit-delivery.ts';

const [orderId, email, name = '구매자'] = process.argv.slice(2);
const m = /^vk-(kit|lesson)-(s|r)-[0-9a-f-]{36}$/.exec(orderId ?? '');
if (!m || !isEmail(email) || !deliveryConfigured()) {
  console.error('사용법: node scripts/videokit-resend.mjs <주문번호 vk-...> <이메일> [이름]  (발송 환경변수 4개 필요)');
  process.exit(2);
}
const [, plan, tier] = m;
const r = await deliverKit({ orderId, plan, itemName: nameOf(plan, tier), amount: priceOf(plan, tier), email, name }, { force: true });
console.log(r);
process.exit(r.status === 'sent' ? 0 : 1);
