import { randomUUID } from 'node:crypto';
import Shell, { KAKAO_URL, won } from './Shell';
import Checkout from './Checkout';
import { isPlanId, makeOrderId, plans, tossKeys } from '@/products/videokit';

export const dynamic = 'force-dynamic';
export const metadata = { title: '결제 | 클로드 비디오 키트 for 파이널컷프로', robots: { index: false, follow: false } };

export default async function PricePage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  const keys = tossKeys();
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
  return <Shell>
    <h1>결제하기</h1>
    <p className="lede">상담하신 상품을 확인하고 결제해 주세요.</p>
    {!keys.live && <p className="test" role="note">테스트 결제 화면입니다. 실제로 돈이 빠져나가지 않습니다.</p>}
    <div className="order"><b>{item.name}</b><span>결제 확인 후 키트 파일과 설치 안내를 카카오톡 또는 이메일로 보내드립니다.</span><div className="amt">{won(item.amount)}</div></div>
    <Checkout clientKey={keys.clientKey} orderId={makeOrderId(plan, randomUUID())} orderName={item.name} amount={item.amount} />
    <p className="small">결제하면 <a href="/videokit/terms">이용약관</a>과 <a href="/videokit#refund">환불 안내</a>에 동의하는 것으로 봅니다. 개인정보는 <a href="/videokit/privacy">개인정보처리방침</a>에 따라 처리합니다.</p>
  </Shell>;
}
