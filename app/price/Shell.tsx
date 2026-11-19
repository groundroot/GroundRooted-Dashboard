import './price.css';

export default function Shell({ children }: { children: React.ReactNode }) {
  return <div className="vk-pay">
    <header className="vk-pay-bar"><div className="vk-pay-wrap">
      <a href="/videokit" style={{ textDecoration: 'none' }}><i className="rec" aria-hidden="true" />클로드 비디오 키트<small>for 파이널컷프로</small></a>
    </div></header>
    <main><div className="vk-pay-wrap">{children}</div></main>
  </div>;
}

export const KAKAO_URL = 'https://open.kakao.com/o/s40bSEXi';
export const won = (n: number) => `${new Intl.NumberFormat('ko-KR').format(n)}원`;
