import Shell, { KAKAO_URL, won } from '../Shell';
import { checkOrder, plans, tossKeys } from '@/products/videokit';

export const dynamic = 'force-dynamic';
export const metadata = { title: '결제 결과 | 클로드 비디오 키트 for 파이널컷프로', robots: { index: false, follow: false } };

type Payment = { status?: string; orderId?: string; totalAmount?: number; code?: string; message?: string };

async function toss(path: string, secretKey: string, body?: object): Promise<{ ok: boolean; data: Payment }> {
  const res = await fetch(`https://api.tosspayments.com/v1/payments${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}

// 승인: 주문번호·금액을 서버 가격표로 검증한 뒤 토스에 승인을 요청한다.
// 새로고침 등으로 이미 승인된 결제는 조회해서 같은 주문·금액인지 확인한다.
async function confirm(paymentKey: string, orderId: string, amount: number) {
  const { secretKey, consistent } = tossKeys();
  if (!consistent) return false;
  const first = await toss('/confirm', secretKey, { paymentKey, orderId, amount });
  const p = first.ok ? first.data : first.data.code === 'ALREADY_PROCESSED_PAYMENT' ? (await toss(`/${encodeURIComponent(paymentKey)}`, secretKey)).data : null;
  return !!p && p.status === 'DONE' && p.orderId === orderId && p.totalAmount === amount;
}

export default async function SuccessPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { paymentKey, orderId, amount } = await searchParams;
  const order = checkOrder(orderId, amount);
  const done = order.ok && typeof paymentKey === 'string' && paymentKey.length > 0 && await confirm(paymentKey, orderId!, order.amount);
  if (!done || !order.ok) {
    return <Shell>
      <h1>결제를 확인하지 못했습니다</h1>
      <p className="lede">결제가 승인되지 않았거나 확인 중 문제가 생겼습니다. 돈이 빠져나갔다면 아래 주문번호와 함께 카카오톡으로 알려 주세요. 바로 확인해 드리겠습니다.</p>
      {orderId && <p className="small">주문번호 {orderId}</p>}
      <a className="btn btn-kakao" href={KAKAO_URL} target="_blank" rel="noopener">카카오톡 1:1 문의</a>
    </Shell>;
  }
  return <Shell>
    <h1>결제가 완료되었습니다</h1>
    <p className="lede">{plans[order.plan].name} · {won(order.amount)}</p>
    <div className="order"><b>주문번호</b><span>{orderId}</span></div>
    <p className="lede">결제를 확인한 뒤 키트 파일과 설치 안내를 카카오톡 또는 이메일로 보내드립니다. 상담하신 카카오톡 대화방에 주문번호를 남겨 주시면 더 빨리 진행됩니다.</p>
    <a className="btn btn-kakao" href={KAKAO_URL} target="_blank" rel="noopener">카카오톡으로 주문번호 보내기</a>
    <a className="btn btn-ghost" href="/videokit">상품 페이지로</a>
  </Shell>;
}
