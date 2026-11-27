import type { Metadata } from 'next';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './blog.css';
import { INSTAGRAM_URL, SITE_URL } from '@/lib/blog';

// 루트 layout은 사이트 전체를 noindex로 두므로, 공개 블로그는 여기서 색인을 허용한다.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: '그라운드루티드 블로그', template: '%s | 그라운드루티드 블로그' },
  description: '그라운드루티드가 영상을 만들고, 도구를 만들고, 그 과정에서 겪은 이야기를 씁니다.',
  robots: { index: true, follow: true },
  alternates: { types: { 'application/rss+xml': '/blog/rss.xml' } },
  openGraph: { siteName: '그라운드루티드 블로그', locale: 'ko_KR', type: 'website' },
};

function Instagram() {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".6" fill="currentColor" />
  </svg>;
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <div className="blog">
    <header className="blog-bar">
      <div className="blog-wrap blog-bar-in">
        <a className="blog-home" href="/blog"><i className="blog-rec" aria-hidden="true" />그라운드루티드 <span>블로그</span></a>
        <nav className="blog-nav" aria-label="사이트">
          <a href="/videokit">클로드 비디오 키트</a>
          {INSTAGRAM_URL && <a href={INSTAGRAM_URL} target="_blank" rel="noopener" aria-label="그라운드루티드 인스타그램"><Instagram /></a>}
        </nav>
      </div>
    </header>
    <main>{children}</main>
    <footer className="blog-foot">
      <div className="blog-wrap blog-foot-in">
        <p><b>그라운드루티드 (GroundRooted)</b></p>
        <p>대표 강성철 · 사업자등록번호 543-09-03526 · 통신판매업 신고번호 2026-울산북구-0322</p>
        <p>울산광역시 북구 상방로 160 · <a href="mailto:sungchulkang@groundrooted.com">sungchulkang@groundrooted.com</a></p>
        <nav className="blog-foot-links" aria-label="블로그 안내">
          <a href="/blog/rss.xml">RSS</a>
          {INSTAGRAM_URL && <a href={INSTAGRAM_URL} target="_blank" rel="noopener">인스타그램</a>}
          <a href="/videokit">클로드 비디오 키트</a>
          <a href="/videokit/privacy">개인정보처리방침</a>
        </nav>
      </div>
    </footer>
  </div>;
}
