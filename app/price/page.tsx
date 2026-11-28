import { randomUUID } from 'node:crypto';
import Shell, { KAKAO_URL, NEWS_URL } from './Shell';
import Checkout, { type PlanOption } from './Checkout';
import { BANK, cardPending, hasKit, hasLesson, isPlanId, makeOrderId, nameOf, planLabels, plans, priceOf, tierAt, tossApiKeys, tossKeys, type PlanId } from '@/products/videokit';
import { LINK_DAYS, deliveryConfigured } from '@/products/videokit-delivery';
import { deviceAddonOn } from '@/products/videokit-devices';

export const dynamic = 'force-dynamic';
export const metadata = { title: '결제 | 클로드 비디오 키트', description: '클로드 비디오 키트 결제 화면. 상품을 고르고 계좌이체로 주문합니다(카드 · 간편결제는 심사 중).', robots: { index: false, follow: false } };

// 결제 화면: 상품 선택 → 받는 분 정보 → 결제 수단(계좌이체 / 카드 · 간편결제).
// 금액은 서버 가격표(products/videokit.ts)로만 정한다. 할인 기간과 정가는 tierAt()이 자동으로 바꾼다.
export default async function PricePage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  // 결제창 키(API 개별 연동)가 있으면 결제창, 없으면 결제위젯.
  const keys = tossApiKeys() ?? tossKeys();
  const mode = tossApiKeys() ? 'window' : 'widget';
  const tier = tierAt();
  // 추가 기기(device)는 VIDEOKIT_DEVICE_ADDON_ON 일 때만 보인다. 주문번호는 구매자 키를 확인한 뒤 서버가 준다(그 전에는 비워 둠).
  const addon = deviceAddonOn();
  const ids = (Object.keys(plans) as PlanId[]).filter((id) => id !== 'device' || addon);
  const options: PlanOption[] = ids.map((id) => ({
    id, ...planLabels[id], amount: priceOf(id, id === 'device' ? 'r' : tier), regular: plans[id].regular,
    orderId: id === 'device' ? '' : makeOrderId(id, tier, randomUUID()), orderName: nameOf(id, id === 'device' ? 'r' : tier), kit: hasKit(id), lesson: hasLesson(id),
  }));
  return <Shell>
    <h1>결제하기</h1>
    <p className="lede">상품을 고르고 받는 분 정보와 결제 수단을 선택해 주세요.</p>
    <Checkout
      // plan 없음 → 키트, 옛 링크 ticket → 강의권(pass), 그 밖에 모르는 값 → 선택 없이 연다.
      plans={options} initial={plan === undefined ? 'kit' : plan === 'ticket' ? 'pass' : isPlanId(plan) && ids.includes(plan) ? plan : null} tier={tier}
      mode={mode} clientKey={keys.clientKey}
      // 키 종류(live/test)가 섞이면 카드 결제를 열지 않는다. 계좌이체는 그대로 받는다.
      card={!keys.consistent ? 'off' : cardPending() ? 'pending' : 'open'} testKeys={!keys.live}
      autoMail={deliveryConfigured()} bank={BANK} linkDays={LINK_DAYS} kakao={KAKAO_URL} news={NEWS_URL} />
    <p className="small">결제하면 <a href="/videokit/terms">이용약관</a>과 <a href="/videokit#refund">환불 안내</a>에 동의하는 것으로 봅니다. 개인정보는 <a href="/videokit/privacy">개인정보처리방침</a>에 따라 처리합니다. 궁금한 점은 <a href={KAKAO_URL} target="_blank" rel="noopener">카카오톡 1:1 문의</a> 오픈채팅방으로, 새 버전 소식은 <a href={NEWS_URL} target="_blank" rel="noopener">업데이트 소식 · 정보 공유</a> 오픈채팅방에서 받아 보세요.</p>
  </Shell>;
}
