import { ArrowUpRight, Sprout } from 'lucide-react';
import { appCatalog } from '@/products/catalog';
export default function PublicFooter() {
  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="site-footer-grid">
          <div>
            <a href="/" className="site-brand" translate="no">
              <Sprout size={25} aria-hidden="true" />
              GroundRooted<span className="site-brand-dot">.</span>
            </a>
            <p>
              좋은 자료가, 다음 생각이 되도록.
              <br />
              일상에서 시작한 도구를 만듭니다.
            </p>
          </div>
          <nav aria-label="푸터 제품">
            <h2>제품</h2>
            <a href="/videokit">클로드 비디오 키트</a>
            {appCatalog.map((app) => (
              <a key={app.id} href={app.href} translate="no">
                {app.name}
                {app.id === 'typecut-pro' && <ArrowUpRight size={14} aria-hidden="true" />}
              </a>
            ))}
          </nav>
          <nav aria-label="푸터 안내">
            <h2>GroundRooted</h2>
            <a href="/#about">만드는 이야기</a>
            <a href="/#guide">제품 선택 가이드</a>
            <a href="/#faq">자주 묻는 질문</a>
            <a href="mailto:sungchulkang@groundrooted.com">문의 · sungchulkang@groundrooted.com</a>
          </nav>
        </div>
        <div className="site-footer-biz">
          <p>
            <strong>그라운드루티드 (GroundRooted)</strong>
            <span>대표 강성철</span>
            <span>사업자등록번호 543-09-03526</span>
            <span>통신판매업 신고번호 2026-울산북구-0322</span>
          </p>
          <p>
            <span>울산광역시 북구 상방로 160</span>
            <span>전화 010-2153-1713</span>
            <span>sungchulkang@groundrooted.com</span>
          </p>
          <p className="site-footer-policy">
            <a href="/videokit/terms">이용약관</a>
            <a href="/videokit/privacy">개인정보처리방침</a>
            <a href="/videokit#refund">환불 안내</a>
          </p>
        </div>
        <div className="site-footer-bottom">
          <span>© 2026 GroundRooted</span>
          <span>ReadyMD · YouTube to MD 출시 준비 중</span>
          <a href="#page-top">맨 위로 ↑</a>
        </div>
      </div>
    </footer>
  );
}
