import type { ReactNode } from 'react';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';
import ReadingProgress from './ReadingProgress';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './storefront.css';
import './flexibits-theme.css';
export default function StorefrontShell({
  children,
  current,
}: {
  children: ReactNode;
  current?: string;
}) {
  return (
    <div id="gr-storefront" className="gr-public">
      <ReadingProgress />
      <div id="page-top" />
      <a className="site-skip" href="#storefront-main">
        본문 바로가기
      </a>
      <PublicHeader current={current} />
      <main id="storefront-main" tabIndex={-1}>
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
