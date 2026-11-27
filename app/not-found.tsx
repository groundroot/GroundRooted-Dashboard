import StorefrontShell from '@/components/storefront/StorefrontShell';
import './not-found.css';

// 없는 주소 · 로그인 없이 열 수 없는 주소(proxy.ts가 여기로 보냄)의 404 화면.
export const metadata = { title: '페이지를 찾을 수 없습니다 | GroundRooted', robots: { index: false, follow: false } };

export default function NotFound() {
  return <StorefrontShell>
    <section className="gr-not-found gs-container">
      <h1>페이지를 찾을 수 없습니다</h1>
      <p>주소가 바뀌었거나 없는 페이지입니다. 주소를 다시 확인하거나 아래에서 이동해 주세요.</p>
      <p className="gr-not-found-links"><a className="fx-pill" href="/">groundrooted.com 처음으로</a><a className="fx-pill fx-pill-videokit" href="/videokit">클로드 비디오 키트 보기</a></p>
    </section>
  </StorefrontShell>;
}
