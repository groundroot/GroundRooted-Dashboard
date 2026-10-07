import type { Metadata } from "next";
import { ArrowDown, ArrowRight, BookOpen, FileText, Plus } from "lucide-react";
import PublicFooter from "@/components/storefront/PublicFooter";
import ReadingProgress from "@/components/storefront/ReadingProgress";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import HeroBackground from "@/components/marketing/HeroBackground";
import FooterStarField from "@/components/marketing/FooterStarField";
import ReadingExperience from "@/components/marketing/ReadingExperience";
import LocalAiComparison from "@/components/marketing/LocalAiComparison";
import { OriginStory, PersonalLibrary } from "@/components/marketing/OriginStory";
import WorkflowDemo from "@/components/marketing/WorkflowDemo";
import AnimatedContent from "@/components/react-bits/AnimatedContent";
import SplitText from "@/components/react-bits/SplitText";

export const metadata: Metadata = {
  title: "ReadyMD 레디엠디 | 모아 둔 PDF를, 읽고 다시 쓰는 나의 지식으로",
  description: "For Your 2nd Brain. 지성 확장의 시작, ReadyMD. PDF를 읽기 편한 전자책과 AI에 활용할 자료 파일로 바꿔 보세요.",
  robots: { index: false, follow: false },
  icons: { icon: "/favicon.svg" },
};

const faqs = [
  ["Obsidian에서 내 자료를 AI에게 질문할 수 있나요?", "ReadyMD로 정리한 Markdown과 이미지 폴더를 Obsidian 보관함에 모으고, 서재를 읽을 수 있는 AI 플러그인이나 도구를 별도로 연결하는 방식입니다. ReadyMD가 자동으로 AI 검색을 연결하는 것은 아닙니다. 자료 접근 범위와 색인·질문 비용은 선택한 도구에 따라 달라집니다. 중요한 답변은 인용된 원문과 함께 확인해 주세요."],
  ["어떤 PDF를 바꾸면 도움이 되나요?", "작은 글씨 때문에 자주 확대하게 되는 보고서, 다시 읽고 싶은 스캔 자료, 다음 글이나 수업에 참고할 문서에 활용할 수 있습니다. 지금도 읽기 편한 PDF라면 그대로 사용해도 좋습니다."],
  ["변환하면 어떤 파일을 받나요?", "읽기용 전자책인 EPUB, 제목과 문단을 정리한 Markdown(MD), 본문에 연결된 이미지 폴더로 구성됩니다. 이 페이지에서는 사용 방식을 보여주는 예시를 체험할 수 있습니다. 실제 PDF 변환과 EPUB 다운로드는 제공하지 않습니다."],
  ["표와 사진도 함께 활용할 수 있나요?", "표를 포함한 문서 구조를 정리하고 그래프·사진·양식을 별도 이미지로 보관해 본문과 연결하는 것이 제품의 방향입니다. AI와 사용할 때는 MD와 실제 이미지 파일을 함께 제공해야 합니다. 연결 주소만으로 모든 AI가 이미지를 읽을 수 있는 것은 아닙니다."],
  ["어떤 컴퓨터와 전자책·AI 도구에서 쓰나요?", "지원 운영체제와 문서 유형별 품질은 검증 후 안내합니다. 전자책은 EPUB을 지원하는 뷰어가 필요하며, AI 도구는 텍스트와 이미지 파일 지원 여부를 확인해야 합니다. 글자 크기 등 읽기 설정은 뷰어마다 다를 수 있습니다."],
  ["로컬 AI를 쓰면 무엇이 달라지나요?", "로컬 OCR은 문서 인식을 위해 원문을 외부 AI API로 전송하지 않는 방식입니다. 외부 업로드가 어려운 자료를 내 컴퓨터에서 정리하고, 해당 구간의 외부 AI 토큰 호출료 없이 반복 처리할 수 있습니다. 앱 가격·전기·장비 비용은 별도이며, 출시판 처리 한도와 전체 데이터 흐름은 검증 후 공개합니다. 결과를 외부 AI에 제공할 때는 그 서비스의 한도와 정책이 적용됩니다."],
  ["내 자료는 어디에서 처리되나요?", "앱은 내 컴퓨터의 로컬 모델로 PDF의 글자를 읽고 재구성하는 방식입니다. 이 소개 페이지는 PDF를 업로드받지 않습니다. 외부 AI에 자료를 제공하는 일은 별도 선택이며, 모델 다운로드와 업데이트 등 네트워크 사용 범위는 출시 시 안내합니다."],
  ["원문과 다르게 변환되는 경우도 있나요?", "스캔 해상도, 작은 글씨, 복잡한 표나 수식, 여러 단으로 편집된 지면은 결과에 영향을 줄 수 있습니다. 변환 후에는 중요한 문장과 수치, 그림의 연결을 원문과 비교해 주세요. 원본 지면을 똑같이 복제하는 방식은 아닙니다."],
  ["언제 사용할 수 있고, 비용은 얼마인가요?", "현재 출시를 준비하고 있습니다. 출시 일정과 가격, 지원 환경, 라이선스·환불 정책은 확정 후 안내합니다. 지금은 제품의 사용 방식을 살펴보는 미리보기이며 구매·결제를 받지 않습니다."],
];

export default function PdfToMdPage() {
  return <div id="gr-site" className="rm-renewal gr-public">
    <ReadingProgress />
    <div id="page-top" />
    <a className="gr-skip" href="#main">본문 바로가기</a>
    <MarketingHeader />
    <main id="main" tabIndex={-1}>
      <section className="gr-hero rm-hero" id="top" aria-labelledby="hero-heading">
        <HeroBackground />
        <div className="gr-container gr-hero-composition"><div className="gr-hero-copy">
          <div className="rm-hero-brand"><BookOpen size={19} strokeWidth={1.7} /> ReadyMD <span>레디엠디</span></div>
          <h1 id="hero-heading"><SplitText text="For Your 2nd Brain" /></h1>
          <p className="gr-hero-subtitle">지성 확장의 시작</p>
          <p className="rm-hero-lead">모아 둔 PDF, 이제 편하게 읽고<br className="rm-mobile-break" /> 다시 활용하세요.</p>
          <p className="rm-hero-description">ReadyMD가 읽기 좋은 전자책과<br className="rm-mobile-break" /> AI에 활용할 자료 파일로 바꿔드립니다.</p>
          <div className="gr-hero-actions"><a className="gr-button gr-button-dark" href="#experience">달라지는 모습 보기 <ArrowDown size={17} /></a><a className="gr-button gr-button-light" href="#workflow">사용 방법 <ArrowRight size={17} /></a></div>
          <div className="rm-hero-bottom"><span>저장한 자료에서, 나의 지식으로.</span><ArrowDown size={16} /></div>
        </div></div>
      </section>

      <section className="rm-change" id="experience" aria-labelledby="experience-heading"><div className="gr-container">
        <div className="rm-section-heading rm-centered"><p className="rm-kicker">자료는 그대로, 쓰는 방식은 새롭게</p><h2 id="experience-heading">같은 PDF를,<br /><em>나에게 필요한 모습으로.</em></h2><p>내가 읽을 때는 편한 전자책으로.<br />다시 활용할 때는 글과 그림이 연결된 자료로.</p></div>
        <ReadingExperience />
      </div></section>

      <section className="rm-section rm-problem gr-container" aria-labelledby="problem-heading">
        <div className="rm-section-heading"><p className="rm-kicker">다시 읽고 싶어서 저장했는데</p><h2 id="problem-heading">그 PDF,<br />다시 열어보셨나요?</h2><p>좋은 내용인 건 알지만,<br />다시 읽고 쓰기까지는 손이 많이 갑니다.</p></div>
        <AnimatedContent><div className="rm-frictions"><div><span>01</span><div><h3>읽으려면, 자꾸 확대하게 되고.</h3><p>휴대폰 화면보다 넓은 지면.<br />한 줄을 읽으려고 이리저리 움직입니다.</p></div><span className="rm-friction-art rm-zoom-art" aria-hidden="true">작은 글씨 <strong>가</strong></span></div><div><span>02</span><div><h3>문장 하나 옮기려다, 줄바꿈부터.</h3><p>필요한 부분을 복사했는데<br />끊어진 문장부터 다시 정리합니다.</p></div><span className="rm-friction-art rm-lines-art" aria-hidden="true"><i /><i /><i /></span></div><div><span>03</span><div><h3>본문은 여기, 참고할 그림은 저기.</h3><p>설명과 그림을 함께 보려면<br />원본 파일을 다시 찾아야 합니다.</p></div><span className="rm-friction-art rm-image-art" aria-hidden="true"><FileText size={24} /><span>그림 1 ?</span></span></div></div></AnimatedContent>
      </section>




      <PersonalLibrary />

      <LocalAiComparison />

      <section className="rm-section rm-audiences gr-container" id="possibilities" aria-labelledby="audience-heading">
        <div className="rm-section-heading"><p className="rm-kicker">이런 순간에, ReadyMD</p><h2 id="audience-heading">읽은 자료가<br />다음 일로 이어지도록.</h2></div>
        <div className="rm-audience-list"><article><span className="rm-audience-index">01 / 연구와 공부</span><h3>읽어야 할 논문과<br />보고서가 많을 때.</h3><p>긴 문서를 내 눈에 편한 크기로 읽고, 필요한 내용을 다시 살펴보세요.</p><div className="rm-use-path">모아 둔 보고서 <ArrowRight size={16} /> 나에게 맞는 읽기</div></article><article><span className="rm-audience-index">02 / 수업과 콘텐츠</span><h3>다음 강의와 글에<br />참고할 자료가 필요할 때.</h3><p>본문과 그림을 함께 꺼내 쓰고, AI와 자료를 살펴보며 다음 작업을 준비하세요.</p><div className="rm-use-path">참고 자료 <ArrowRight size={16} /> 다음 작업의 재료</div></article><article><span className="rm-audience-index">03 / 나만의 지식</span><h3>쌓아 둔 PDF를<br />내 생각으로 잇고 싶을 때.</h3><p>좋은 문장을 다시 읽고 메모를 더하세요. 저장에서 끝났던 자료에 쓰임이 생깁니다.</p><div className="rm-use-path">보관한 문서 <ArrowRight size={16} /> 다시 꺼내 쓰는 지식</div></article></div>
      </section>

      <section className="rm-workflow" id="workflow" aria-labelledby="workflow-heading"><div className="gr-container"><div className="rm-section-heading"><p className="rm-kicker">시작은, PDF 하나</p><h2 id="workflow-heading">파일을 고르고,<br />새로운 쓰임을 열어보세요.</h2><p>ReadyMD는 내 컴퓨터의 모델로<br />PDF의 글을 읽고 재구성합니다.</p></div><WorkflowDemo /><p className="rm-demo-note">앱의 사용 순서를 설명하는 개념도입니다. 이 페이지에서 실제 변환은 실행하지 않습니다.</p></div></section>

      <OriginStory />

      <section className="gr-faq gr-container rm-faq" id="faq" aria-labelledby="faq-heading"><div className="rm-section-heading"><p className="rm-kicker">사용하기 전에</p><h2 id="faq-heading">궁금한 점을<br />모았습니다.</h2></div><div className="gr-faq-list">{faqs.map(([q, a]) => <details key={q}><summary>{q}<Plus size={18} aria-hidden="true" /></summary><p>{a}</p></details>)}</div></section>

      <section className="rm-release gr-container" id="availability" aria-labelledby="availability-heading"><div><span className="gr-dot" /><h2 id="availability-heading">ReadyMD는 지금 출시 준비 중입니다.</h2></div><p>출시 일정과 가격, 지원 환경은 확정 후 안내합니다.</p></section>
      <section className="gr-final gr-container rm-final" aria-labelledby="final-heading"><FooterStarField /><div className="gr-final-content"><span className="rm-kicker">ReadyMD 레디엠디</span><h2 id="final-heading">사람이 읽고,<br />AI와 함께 활용하도록.</h2><p>모아 둔 PDF에서 시작하는 지성의 확장.</p><a className="gr-button gr-button-dark" href="#experience">달라지는 모습 다시 보기 <ArrowRight size={17} /></a></div></section>
    </main>
    <PublicFooter />
  </div>;
}
