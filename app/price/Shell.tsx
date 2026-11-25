import './price.css';

export default function Shell({ children }: { children: React.ReactNode }) {
  return <div className="vk-pay">
    <header className="vk-pay-bar"><div className="vk-pay-wrap">
      <a href="/videokit" style={{ textDecoration: 'none' }}><i className="rec" aria-hidden="true" />클로드 비디오 키트<small>for 파이널컷프로</small></a>
    </div></header>
    <main><div className="vk-pay-wrap">{children}</div></main>
    <footer className="vk-pay-foot"><div className="vk-pay-wrap">
      <p>그라운드루티드 (GroundRooted) · 대표 강성철 · 사업자등록번호 543-09-03526 · 통신판매업 신고번호 2026-울산북구-0322</p>
      <p>울산광역시 북구 상방로 160 · 전화 010-2153-1713 · sungchulkang@groundrooted.com</p>
      <p><a href="/videokit/terms">이용약관</a> · <a href="/videokit/privacy">개인정보처리방침</a> · <a href="/videokit#refund">환불 안내</a></p>
    </div></footer>
  </div>;
}

export const KAKAO_URL = 'https://open.kakao.com/o/s40bSEXi';
export const won = (n: number) => `${new Intl.NumberFormat('ko-KR').format(n)}원`;
