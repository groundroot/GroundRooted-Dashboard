import { BookOpen } from 'lucide-react';
import PublicHeader from '@/components/storefront/PublicHeader';
export default function MarketingHeader() {
  return (
    <>
      <PublicHeader current="readymd" />
      <div className="rm-product-nav">
        <div className="gr-container">
          <a href="#top" className="rm-product-nav-brand" translate="no">
            <BookOpen size={18} aria-hidden="true" />
            ReadyMD <span>레디엠디</span>
          </a>
          <nav aria-label="ReadyMD 페이지 안내">
            <a href="#experience">제품 체험</a>
            <a href="#why-local">로컬 AI</a>
            <a href="#workflow">사용 방법</a>
            <a href="#faq">FAQ</a>
            <a href="#availability">출시 안내</a>
          </nav>
        </div>
      </div>
    </>
  );
}
