import { ArrowRight, ArrowUpRight, BookOpen, FileText, Play, Plus, Scissors, Sprout } from 'lucide-react';
import StorefrontShell from '@/components/storefront/StorefrontShell';
import AppMark from '@/components/storefront/AppMark';
import ProductVisual from '@/components/storefront/ProductVisual';
import WorkExplorer from '@/components/storefront/WorkExplorer';
import { appCatalog } from '@/products/catalog';
export const metadata = {
  title: 'GroundRooted | 자료를 지식으로, 생각을 결과물로',
  description: 'PDF를 읽기 좋은 책으로, 영상의 자막을 나의 기록으로, 대본을 편집으로. 일상의 일을 가볍게 만드는 GroundRooted의 앱을 만나보세요.',
};
const faqs = [
  [
    '어떤 앱부터 살펴보면 좋을까요?',
    'PDF를 읽고 정리하려면 ReadyMD, 영상 자막을 모아 두려면 YouTube to MD, Final Cut Pro에서 말 중심의 영상을 편집하려면 TypeCut Pro를 살펴보세요. 각 앱은 서로 다른 작업을 위한 독립된 도구입니다.',
  ],
  [
    '지금 다운로드하거나 구매할 수 있나요?',
    'ReadyMD와 YouTube to MD는 출시 준비 중입니다. 각 소개 페이지에서 사용 흐름을 살펴볼 수 있으며, 가격과 지원 환경은 확정 후 안내합니다. TypeCut Pro의 배포·구매 정보는 연결된 공식 사이트에서 확인해 주세요.',
  ],
  [
    '페이지에 보이는 예시는 실제 앱의 결과인가요?',
    '이 사이트의 문서는 직접 작성한 설명용 예시이며, 종이 조형 이미지와 영상은 AI로 제작한 콘셉트입니다. 실제 앱 화면이나 변환 결과가 아닙니다. ReadyMD 페이지에서는 글자 크기와 자료 구성을, YouTube to MD 페이지에서는 자막과 Markdown의 차이를 살펴볼 수 있습니다.',
  ],
  [
    '세 앱을 함께 설치해야 하나요?',
    '아닙니다. 필요한 작업에 맞는 앱을 각각 선택하면 됩니다. 전자책을 읽는 뷰어, Markdown 편집기, Final Cut Pro 같은 주변 도구는 각 제품의 안내를 확인해 주세요.',
  ],
];
export default function HomePage() {
  return <StorefrontShell>
    <section className="fx-products gs-container" id="apps" aria-label="GroundRooted의 앱">
      <div className="fx-product-pair">
        {appCatalog.slice(0, 2).map((app, index) => <article className={`fx-product-tile fx-tile-${app.id}`} key={app.id}>
          <h2 translate="no">{app.name}</h2>
          <p className="fx-tile-tagline">{index === 0 ? '읽고. 연결하고. 다시 쓰고.' : '보고. 남기고. 다시 꺼내고.'}</p>
          <AppMark product={app.id} />
          <a className={`fx-pill fx-pill-${app.id}`} href={app.href}>자세히 보기 <ArrowRight size={20} aria-hidden="true" /><span className="fx-sr-only"> — {app.name}</span></a>
          <span className="fx-tile-status">출시 준비 중</span>
        </article>)}
      </div>
      <article className="fx-typecut-banner">
        <div className="fx-banner-art fx-banner-art-left" aria-hidden="true"><span /><span /><span /></div>
        <div className="fx-banner-copy">
          <h2><AppMark product="typecut-pro" small /><span translate="no">TypeCut <em>Pro</em></span></h2>
          <p>말을 읽으며, 이야기의 흐름을 다듬으세요.</p>
          <a href={appCatalog[2].href} className="fx-pill fx-pill-typecut-pro">공식 사이트 보기 <ArrowUpRight size={18} aria-hidden="true" /></a>
        </div>
        <div className="fx-banner-art fx-banner-art-right" aria-hidden="true"><span /><span /><span /></div>
      </article>
    </section>

    <section className="fx-brand-story gs-container" id="about" aria-labelledby="home-heading">
      <div className="fx-symbol-garden" aria-hidden="true">
        <span><BookOpen /></span><span><Play /></span><span><FileText /></span>
        <span className="fx-garden-root"><Sprout /></span>
        <span><Scissors /></span><span><BookOpen /></span><span><FileText /></span>
      </div>
      <p className="fx-kicker">GroundRooted</p>
      <h1 id="home-heading">자료를 지식으로.<br /><em>생각을 결과물로.</em></h1>
      <p className="fx-brand-description">다시 읽고 싶은 문서, 오래 남기고 싶은 이야기.<br />직접 겪은 작은 불편에서 시작해,<br className="fx-mobile-only" /> 매일 쓰고 싶은 도구를 만듭니다.</p>
      <a className="fx-text-link" href="/pdf-to-md#origin-story">우리가 만드는 이야기 <ArrowRight size={18} aria-hidden="true" /></a>
    </section>

    <section className="fx-playground gs-container" aria-labelledby="playground-heading">
      <div className="fx-playground-copy">
        <span className="fx-section-symbol" aria-hidden="true"><BookOpen size={28} /></span>
        <p className="fx-kicker">작은 도구, 새로운 쓰임</p>
        <h2 id="playground-heading">당신의 다음 작업은<br /><em>어디에서 시작되나요?</em></h2>
        <p>문서에서 기록으로. 기록에서 창작으로.<br />탭을 바꾸며 나에게 필요한 장면을 찾아보세요.</p>
        <a href="#guide" className="fx-text-link">나에게 맞는 앱 찾기 <ArrowRight size={18} aria-hidden="true" /></a>
      </div>
      <WorkExplorer />
    </section>

    <section className="fx-usecases gs-container" aria-labelledby="usecases-heading">
      <div className="fx-centered-heading"><p className="fx-kicker">일상에 더하는 가능성</p><h2 id="usecases-heading">같은 자료도,<br className="fx-mobile-only" /> 쓰는 방식은 새롭게.</h2><p>자료와 다음 쓰임을 선택해 각 앱의 역할을 살펴보세요.</p></div>
      <div className="fx-usecase-grid">
        {appCatalog.map((app,index)=><article className={`fx-usecase gs-${app.id}`} key={app.id}>
          <ProductVisual product={app.id} />
          <div className="fx-usecase-copy"><span className="fx-usecase-tag">{app.category}</span><h3>{['모아 둔 PDF를 나의 서재로.','좋은 영상의 말을 나의 기록으로.','전하고 싶은 말을 한 편의 이야기로.'][index]}</h3><p>{app.description}</p><a href={app.href} className="fx-text-link">{app.name} 보기 {index===2?<ArrowUpRight size={17} aria-hidden="true" />:<ArrowRight size={17} aria-hidden="true" />}</a></div>
        </article>)}
      </div>
    </section>

    <section className="gs-guide fx-guide" id="guide" aria-labelledby="guide-heading"><div className="gs-container">
      <div className="fx-centered-heading"><p className="fx-kicker">제품 선택 가이드</p><h2 id="guide-heading">하고 싶은 일부터<br className="fx-mobile-only" /> 골라보세요.</h2><p>필요한 작업에 맞는 앱을 각각 선택할 수 있습니다.</p></div>
      <WorkExplorer guide />
    </div></section>

    <section className="gs-faq gs-container" id="faq" aria-labelledby="faq-heading">
      <div><p className="gs-eyebrow">시작하기 전에</p><h2 id="faq-heading">궁금한 점을<br />모았습니다.</h2></div>
      <div className="gs-faq-list">{faqs.map(([q,a])=><details key={q}><summary>{q}<Plus size={18} aria-hidden="true" /></summary><p>{a}</p></details>)}</div>
    </section>
    <section className="fx-closing gs-container"><Sprout size={42} aria-hidden="true" /><h2>좋은 도구가 만드는,<br />조금 더 가벼운 하루.</h2><a href="#apps" className="fx-pill">앱 둘러보기 <ArrowRight size={18} aria-hidden="true" /></a></section>
  </StorefrontShell>;
}
