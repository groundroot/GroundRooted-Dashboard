import Shell, { KAKAO_URL } from '../Shell';

export const metadata = { title: '결제 실패 | 클로드 비디오 키트 for 파이널컷프로', robots: { index: false, follow: false } };

export default async function FailPage({ searchParams }: { searchParams: Promise<{ message?: string; code?: string }> }) {
  const { message, code } = await searchParams;
  const canceled = code === 'PAY_PROCESS_CANCELED';
  return <Shell>
    <h1>{canceled ? '결제를 취소했습니다' : '결제가 완료되지 않았습니다'}</h1>
    <p className="lede">{canceled ? '결제가 진행되지 않았습니다. 결제 화면에서 다시 시도하거나 계좌이체로 주문할 수 있습니다.' : `${message ? `${message.slice(0, 200)} ` : ''}결제 화면에서 다시 시도하거나 계좌이체로 주문해 주세요. 문제가 계속되면 카카오톡으로 알려 주세요.`}</p>
    <a className="btn btn-buy" href="/price">결제 화면으로</a>
    <a className="btn btn-kakao" href={KAKAO_URL} target="_blank" rel="noopener">카카오톡 1:1 문의</a>
  </Shell>;
}
