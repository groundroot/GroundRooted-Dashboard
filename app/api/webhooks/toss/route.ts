// 토스페이먼츠 웹훅: 가상계좌 입금(DEPOSIT_CALLBACK)이 오면 키트 메일을 보낸다.
// 토스 개발자센터 > 웹훅에 https://groundrooted.com/api/webhooks/toss 를 등록하고 DEPOSIT_CALLBACK 이벤트를 고른다.
// 본문은 믿지 않는다: 주문번호로 결제를 다시 조회해 secret · 상태 · 금액을 확인한 뒤에만 보낸다 (depositReady).
// 토스는 10초 안에 200을 받지 못하면 최대 7번 다시 보낸다. 같은 주문 메일은 Resend 멱등 키로 한 번만 나간다.
import { depositReady, nameOf, paymentSecret, type TossPayment } from '@/products/videokit';
import { deliverKit } from '@/products/videokit-delivery';

export const dynamic = 'force-dynamic';

async function lookup(orderId: string): Promise<TossPayment | null> {
  const { secretKey, consistent } = paymentSecret();
  if (!consistent) return null;
  const res = await fetch(`https://api.tosspayments.com/v1/payments/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}` },
    cache: 'no-store',
  });
  return res.ok ? res.json() : null;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as { orderId?: unknown; secret?: unknown; status?: unknown } | null;
  // DEPOSIT_CALLBACK이 아닌 이벤트(또는 잘못된 요청)는 받기만 하고 무시한다.
  if (!body || typeof body.orderId !== 'string' || typeof body.secret !== 'string') return new Response('ignored', { status: 200 });
  if (body.status !== 'DONE') return new Response('not deposited', { status: 200 });

  const payment = await lookup(body.orderId);
  const ready = depositReady(body, payment);
  if (!ready.ok) {
    console.error('[videokit] deposit webhook rejected', body.orderId, ready.reason);
    return new Response('rejected', { status: 200 });
  }
  const { order } = ready;
  const meta = payment?.metadata ?? {};
  const mail = await deliverKit({
    orderId: body.orderId, plan: order.plan, itemName: nameOf(order.plan, order.tier), amount: order.amount,
    email: String(meta.email ?? ''), name: String(meta.name ?? '구매자'),
  }).catch((e) => { console.error('[videokit] deposit mail exception', body.orderId, e); return { status: 'failed' as const, reason: 'exception' }; });
  // 메일 발송이 실패하면 500으로 돌려 토스가 다시 보내게 한다 (다시 와도 성공한 메일은 멱등 키로 한 번만 나간다).
  if (mail.status === 'failed') return new Response('mail failed', { status: 500 });
  // 메일 발송 설정(Supabase · Resend)이 없으면 보내지 못한다. 입금된 주문을 놓치지 않도록 로그에 남긴다 — 판매자가 직접 보내야 함.
  if (mail.status === 'off') console.error('[videokit] DEPOSIT received but kit mail is not configured — send manually', body.orderId);
  return new Response('ok', { status: 200 });
}
