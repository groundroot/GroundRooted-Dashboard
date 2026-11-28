import './price.css';

export default function Shell({ children }: { children: React.ReactNode }) {
  return <div className="vk-pay">
    <header className="vk-pay-bar"><div className="vk-pay-wrap">
      <a href="/videokit" style={{ textDecoration: 'none' }}><i className="rec" aria-hidden="true" />클로드 비디오 키트</a>
    </div></header>
    <main><div className="vk-pay-wrap">{children}</div></main>
    <footer className="vk-pay-foot"><div className="vk-pay-wrap">
      <p>그라운드루티드 (GroundRooted) · 대표 강성철 · 사업자등록번호 543-09-03526 · 통신판매업 신고번호 2026-울산북구-0322</p>
      <p>울산광역시 북구 상방로 160 · 전화 010-2153-1713 · sungchulkang@groundrooted.com</p>
      <p><a href="/videokit/terms">이용약관</a> · <a href="/videokit/privacy">개인정보처리방침</a> · <a href="/videokit#refund">환불 안내</a></p>
      <p>오픈채팅 · <a href={KAKAO_URL} target="_blank" rel="noopener">1:1 문의</a> · <a href={NEWS_URL} target="_blank" rel="noopener">업데이트 소식 · 정보 공유</a></p>
    </div></footer>
  </div>;
}

// 카카오톡 오픈채팅방 두 개: 1:1 문의 방, 업데이트 소식 · 정보 공유 방(여럿이 함께 보는 방)
export const KAKAO_URL = 'https://open.kakao.com/o/s40bSEXi';
export const NEWS_URL = 'https://open.kakao.com/o/pDMhZvYi';
export const won = (n: number) => `${new Intl.NumberFormat('ko-KR').format(n)}원`;
