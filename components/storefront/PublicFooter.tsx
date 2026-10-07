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
          </nav>
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
