import { randomUUID } from 'node:crypto';
import Shell, { KAKAO_URL, won } from './Shell';
import Checkout from './Checkout';
import ProductBox from './ProductBox';
import { isPlanId, makeOrderId, nameOf, plans, priceOf, tierAt, tossApiKeys, tossKeys } from '@/products/videokit';
import { deliveryConfigured } from '@/products/videokit-delivery';

export const dynamic = 'force-dynamic';
export const metadata = { title: '결제 | 클로드 비디오 키트 for 파이널컷프로', robots: { index: false, follow: false } };

export default async function PricePage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  // 결제창 키(카드 · 가상계좌)가 있으면 결제창, 없으면 결제위젯.
  const keys = tossApiKeys() ?? tossKeys();
  const mode = tossApiKeys() ? 'window' : 'widget';
  if (!isPlanId(plan)) {
    return <Shell>
      <h1>결제 링크를 확인해 주세요</h1>
      <p className="lede">결제는 카카오톡 상담 후 보내드리는 링크로 진행합니다. 받은 링크를 그대로 열어 주세요.</p>
      <a className="btn btn-kakao" href={KAKAO_URL} target="_blank" rel="noopener">카카오톡 1:1 문의</a>
      <a className="btn btn-ghost" href="/videokit">상품 페이지로</a>
    </Shell>;
  }
  if (!keys.consistent) {
    return <Shell><h1>결제를 잠시 쓸 수 없습니다</h1><p className="lede">결제 설정을 점검하고 있습니다. 카카오톡으로 알려 주시면 바로 도와드리겠습니다.</p>
      <a className="btn btn-kakao" href={KAKAO_URL} target="_blank" rel="noopener">카카오톡 1:1 문의</a></Shell>;
  }
  const item = plans[plan];
  const tier = tierAt();
  const amount = priceOf(plan, tier);
  const name = nameOf(plan, tier);
  return <Shell>
    <h1>결제하기</h1>
    <p className="lede">상담하신 상품을 확인하고 결제해 주세요.</p>
    {!keys.live && <p className="test" role="note">테스트 결제 화면입니다. 실제로 돈이 빠져나가지 않습니다.</p>}
    <ProductBox plan={plan} tier={tier} />
    <div className="order"><b>{name}</b><span>{deliveryConfigured()
      ? '결제가 확인되면 아래에 적은 이메일로 키트 다운로드 링크와 설치 안내를 바로 보내드립니다.'
      : '결제가 확인되면 키트 파일과 설치 안내를 이메일로 보내드립니다.'}{plan === 'lesson' && ' 강의 일정은 따로 조율합니다.'}</span>
      <div className="amt">{tier === 's' && <s className="was">{won(item.regular)}</s>}{won(amount)}</div>
      {tier === 's' && <span className="sale">마켓 오픈 할인 · 11월 28일(토) 밤 24:00까지</span>}</div>
    <Checkout mode={mode} autoMail={deliveryConfigured()} clientKey={keys.clientKey} orderId={makeOrderId(plan, tier, randomUUID())} orderName={name} amount={amount} />
    <p className="small">결제하면 <a href="/videokit/terms">이용약관</a>과 <a href="/videokit#refund">환불 안내</a>에 동의하는 것으로 봅니다. 개인정보는 <a href="/videokit/privacy">개인정보처리방침</a>에 따라 처리합니다.</p>
  </Shell>;
}
