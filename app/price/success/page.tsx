import Shell, { KAKAO_URL, won } from '../Shell';
import { bankName, checkOrder, hasKit, hasLesson, kitMailAllowed, nameOf, paymentSecret } from '@/products/videokit';
import { alertTossBlocked, deliverKit, deliveryConfigured, notifySeller, type DeliveryResult } from '@/products/videokit-delivery';
import { deniedIp, ipDenied, tossRequest } from '@/products/toss';
import { parseReceipt, receiptRows } from '@/products/videokit-receipt';

export const dynamic = 'force-dynamic';
export const metadata = { title: '결제 결과 | 클로드 비디오 키트', description: '클로드 비디오 키트 결제 결과 확인 화면입니다.', robots: { index: false, follow: false } };

type Payment = { status?: string; orderId?: string; totalAmount?: number; code?: string; message?: string; metadata?: Record<string, string> | null;
  virtualAccount?: { accountNumber?: string; bankCode?: string; customerName?: string; dueDate?: string } | null };

const toss = (path: string, secretKey: string, body?: object) => tossRequest<Payment>(`/v1/payments${path}`, secretKey, body);

// 승인: 주문번호·금액을 서버 가격표로 검증한 뒤 토스에 승인을 요청한다.
// 새로고침 등으로 이미 승인된 결제는 조회해서 같은 주문·금액인지 확인한다.
// allowNew=false: 할인 마감이 지난 할인가 주문. 새 승인은 하지 않고, 이미 승인된 결제(입금 계좌 다시 보기 등)만 보여 준다.
// denied: 토스가 등록되지 않은 IP라며 막음(API_KEY_ACCESS_DENIED). 'confirm'이면 승인 자체가 안 돼 돈이 빠져나가지 않았다.
async function confirm(paymentKey: string, orderId: string, amount: number, allowNew = true):
  Promise<{ payment: Payment; fresh: boolean } | { denied: 'confirm' | 'lookup'; ip: string } | null> {
  const { secretKey, consistent } = paymentSecret();
  if (!consistent) return null;
  const first = allowNew ? await toss('/confirm', secretKey, { paymentKey, orderId, amount }) : { ok: false, data: { code: 'ALREADY_PROCESSED_PAYMENT' } as Payment };
  if (ipDenied(first.data)) return { denied: 'confirm', ip: deniedIp(first.data.message) };
  const again = !first.ok && first.data.code === 'ALREADY_PROCESSED_PAYMENT' ? await toss(`/${encodeURIComponent(paymentKey)}`, secretKey) : null;
  if (again && ipDenied(again.data)) return { denied: 'lookup', ip: deniedIp(again.data.message) };
  const p = first.ok ? first.data : again?.data ?? null;
  // fresh: 이번 요청에서 승인된 결제. 새로고침(이미 승인됨)이면 false라서 메일을 다시 보내지 않는다.
  // 가상계좌는 승인 직후 WAITING_FOR_DEPOSIT(입금 대기). 입금되면 웹훅(/api/webhooks/toss)이 키트 메일을 보낸다.
  const okStatus = p?.status === 'DONE' || p?.status === 'WAITING_FOR_DEPOSIT';
  return !!p && okStatus && p.orderId === orderId && p.totalAmount === amount ? { payment: p, fresh: first.ok } : null;
}

export default async function SuccessPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { paymentKey, orderId, amount } = await searchParams;
  const order = checkOrder(orderId, amount, Date.now(), { anyTime: true });
  const inTime = checkOrder(orderId, amount).ok;
  const result = order.ok && typeof paymentKey === 'string' && paymentKey.length > 0 ? await confirm(paymentKey, orderId!, order.amount, inTime) : null;
  if (result && 'denied' in result && order.ok) {
    await alertTossBlocked({ orderId: orderId!, where: result.denied, ip: result.ip }).catch(() => false);
    // 승인 단계에서 막혔으면 결제가 승인되지 않은 것이므로 돈이 빠져나가지 않았다 → 계좌이체로 안내한다.
    if (result.denied === 'confirm') return <Shell>
      <h1>카드 결제를 마치지 못했습니다</h1>
      <p className="lede">결제 승인 과정에서 문제가 생겨 결제가 승인되지 않았습니다. 돈은 빠져나가지 않았습니다. 번거로우시겠지만 계좌이체로 주문해 주세요. 판매자에게도 바로 알림이 갔습니다.</p>
      <p className="small">주문번호 {orderId}</p>
      <a className="btn btn-buy" href={`/price?plan=${order.plan}`}>계좌이체로 주문하기</a>
      <a className="btn btn-kakao" href={KAKAO_URL} target="_blank" rel="noopener">카카오톡 1:1 문의</a>
    </Shell>;
  }
  const paid = result && 'payment' in result ? result : null;
  if (!paid || !order.ok) {
    return <Shell>
      <h1>결제를 확인하지 못했습니다</h1>
      <p className="lede">결제가 승인되지 않았거나 확인 중 문제가 생겼습니다. 돈이 빠져나갔다면 아래 주문번호와 함께 카카오톡으로 알려 주세요. 바로 확인해 드리겠습니다.</p>
      {orderId && <p className="small">주문번호 {orderId}</p>}
      <a className="btn btn-kakao" href={KAKAO_URL} target="_blank" rel="noopener">카카오톡 1:1 문의</a>
    </Shell>;
  }
  const meta = paid.payment.metadata ?? {};
  const itemName = nameOf(order.plan, order.tier);
  const va = paid.payment.virtualAccount;
  if (paid.payment.status === 'WAITING_FOR_DEPOSIT' && va) {
    const due = va.dueDate ? new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Seoul' }).format(new Date(`${va.dueDate}+09:00`)) : '';
    return <Shell>
      <h1>아래 계좌로 입금해 주세요</h1>
      <p className="lede">{itemName}</p>
      <div className="order va">
        <b>입금 계좌</b><span>{bankName(va.bankCode)} <strong className="acct-no">{va.accountNumber}</strong></span>
        <b>입금액</b><span><strong>{won(order.amount)}</strong> (정확히 이 금액으로 보내 주세요)</span>
        {due && <><b>입금 기한</b><span>{due}까지</span></>}
        <b>주문번호</b><span>{orderId}</span>
      </div>
      {hasKit(order.plan) && <p className="lede">입금이 확인되면 {meta.email ? <b>{meta.email}</b> : '결제할 때 적은 이메일'}로 키트 다운로드 링크와 설치 안내를 {deliveryConfigured() ? '자동으로 보내드립니다' : '보내드립니다'}. 이 계좌는 이 주문에만 쓰입니다.</p>}
      {hasLesson(order.plan) && <p className="lede">강의 일정은 입금 확인 후 개별로 조율합니다.</p>}
      <a className="btn btn-kakao" href={KAKAO_URL} target="_blank" rel="noopener">카카오톡 1:1 문의</a>
    </Shell>;
  }
  // 결제가 확인되면 결제할 때 적은 이메일로 키트 다운로드 링크를 보낸다. 새로고침해도 24시간 안에는 한 번만 간다.
  // 테스트 키로 승인된 결제(돈이 오가지 않음)에는 키트를 보내지 않는다.
  const testPay = !kitMailAllowed();
  let mail: DeliveryResult | null = null;
  if (paid.fresh && !testPay) {
    try {
      mail = await deliverKit({ orderId: orderId!, plan: order.plan, itemName, amount: order.amount, email: String(meta.email ?? ''), name: String(meta.name ?? '구매자'), paymentKey });
    } catch (e) {
      console.error('[videokit] kit mail exception', orderId, e);
      mail = { status: 'failed', reason: 'exception' };
    }
  }
  // 판매자 알림 (영수증 요청 포함). 실제 결제에만, 승인 직후 한 번.
  if (paid.fresh && !testPay) {
    const receipt = parseReceipt((() => { try { return JSON.parse(String(meta.receipt ?? '')); } catch { return null; } })(), String(meta.name ?? ''), { card: true });
    const kit = !hasKit(order.plan) ? '해당 없음' : mail?.status === 'sent' ? '자동 발송함' : `발송 안 됨(${mail?.status === 'failed' ? mail.reason : mail?.status ?? '-'}) — 직접 보내야 함`;
    await notifySeller({ orderId: orderId!, plan: order.plan, amount: order.amount, email: String(meta.email ?? ''), name: String(meta.name ?? '구매자') },
      receipt ? receiptRows(receipt) : [['영수증', '확인 필요(형식 오류)'], ['영수증 받는 분', '-'], ['영수증 번호', '-']], kit).catch(() => false);
  }
  const sentTo = mail?.status === 'sent' ? mail.email : '';
  return <Shell>
    <h1>결제가 완료되었습니다</h1>
    <p className="lede">{itemName} · {won(order.amount)}</p>
    <div className="order"><b>주문번호</b><span>{orderId}</span></div>
    {testPay && <p className="test" role="note">테스트 결제라 실제로 돈이 빠져나가지 않았고, 키트도 보내지 않습니다. 구매하시려면 <a href={`/price?plan=${order.plan}`}>결제 화면</a>에서 계좌이체로 주문해 주세요.</p>}
    {!hasKit(order.plan) || testPay ? null : sentTo
      ? <p className="lede"><b>{sentTo}</b>로 키트 다운로드 링크(맥용 · 윈도우용)와 설치 안내를 보냈습니다. 메일이 보이지 않으면 스팸함과 프로모션함을 확인해 주세요. 몇 분이 지나도 없으면 카카오톡으로 주문번호를 알려 주세요.</p>
      : !paid.fresh
        ? <p className="lede">이미 결제가 확인된 주문입니다. 키트 메일을 받지 못하셨다면 카카오톡으로 주문번호를 알려 주세요. 바로 다시 보내드리겠습니다.</p>
        : <p className="lede">결제는 정상으로 확인되었습니다. 키트 메일 발송을 확인하고 있으니, 카카오톡으로 주문번호를 남겨 주시면 바로 보내드리겠습니다.</p>}
    {hasLesson(order.plan) && <p className="lede">강의 일정은 개별로 조율합니다. 곧 연락드리겠습니다.</p>}
    <a className="btn btn-kakao" href={KAKAO_URL} target="_blank" rel="noopener">카카오톡 1:1 문의</a>
    <a className="btn btn-ghost" href="/videokit">상품 페이지로</a>
  </Shell>;
}
