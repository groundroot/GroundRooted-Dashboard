import { ArrowRight, ArrowUpRight, FileText, Play, Plus } from 'lucide-react';
import StorefrontShell from './StorefrontShell';
import AppMark from './AppMark';
import ProductVisual from './ProductVisual';
import TranscriptDemo from './TranscriptDemo';
import { appCatalog } from '@/products/catalog';
const steps = [
  [
    '채널이나 영상을 고릅니다',
    'YouTube 주소와 게시 기간을 정하고, 찾은 목록에서 저장할 영상을 선택합니다.',
  ],
  [
    '자막을 파일로 모읍니다',
    '영상별 Markdown에 자막 원문과 제목·채널·원본 주소를 남깁니다. 자막을 임의로 요약하거나 고치지 않습니다.',
  ],
  [
    '내 메모와 함께 읽습니다',
    '저장한 파일을 Markdown 편집기나 Obsidian에 모아 두고, 내 생각과 함께 정리하세요.',
  ],
];
const faqs = [
  [
    '자막이 없는 영상도 저장할 수 있나요?',
    '제공되는 자막이 있는 영상을 대상으로 합니다. 없는 자막을 새로 만들거나 영상·음성 파일을 내려받는 기능은 아닙니다.',
  ],
  [
    '자막을 자동으로 요약해 주나요?',
    '자막 원문을 Markdown으로 보관하는 도구입니다. 내용을 임의로 요약하거나 수정하지 않으며, 이후의 메모와 분석은 사용하는 편집기나 AI 도구에서 이어갈 수 있습니다.',
  ],
  [
    '원래 영상을 다시 찾을 수 있나요?',
    '영상 제목·채널·원본 주소를 파일에 함께 남깁니다. 자막에 오류가 있거나 맥락을 확인하고 싶을 때 원본을 찾아볼 수 있습니다.',
  ],
  [
    '어떤 컴퓨터에서 사용할 수 있나요?',
    '현재 개인용 Mac 빌드에서 사용 흐름을 다듬고 있습니다. 공개 배포 일정, 지원 환경, 가격은 확정 후 안내합니다. 서비스의 요청 제한과 원본 자막 상태는 수집에 영향을 줄 수 있습니다.',
  ],
];
export default function ProductPage({ id }: { id: 'youtube-to-md' }) {
  return (
    <StorefrontShell current={id}>
      <section className="gs-product-hero gs-container" aria-labelledby="product-heading">
        <div>
          <a href="/#apps" className="gs-breadcrumb">
            GroundRooted 앱 <span>/</span> YouTube to MD
          </a>
          <div className="gs-product-brand">
            <AppMark product="youtube-to-md" small />
            <span translate="no">YouTube to MD</span>
            <span className="gs-status">출시 준비 중</span>
          </div>
          <h1 id="product-heading">
            좋은 영상의 끝을,
            <br />
            <em>나의 기록의 시작으로.</em>
          </h1>
          <p className="gs-lead">
            좋은 강의와 인터뷰를 발견했는데,
            <br />그 말을 다시 찾느라 영상을 훑고 있다면.
            <br />
            자막을 읽을 수 있는 파일로 모아 두세요.
          </p>
          <div className="gs-actions">
            <a href="#example" className="gs-primary-link">
              저장되는 모습 보기 <ArrowRight size={17} aria-hidden="true" />
            </a>
            <a href="#availability" className="gs-text-link">
              출시 안내
            </a>
          </div>
        </div>
        <ProductVisual product="youtube-to-md" hero />
      </section>
      <div className="gs-product-facts gs-container">
        <span>
          <FileText size={18} aria-hidden="true" /> 자막 원문 보관
        </span>
        <span>제목·채널·출처 함께</span>
        <span>내 편집기에서 다시 읽기</span>
      </div>
      <section className="gs-example gs-container" id="example" aria-labelledby="example-heading">
        <div className="gs-section-title">
          <div>
            <p className="gs-eyebrow">영상에서, 내 서재의 한 페이지로</p>
            <h2 id="example-heading">
              흘러갔던 문장을
              <br />
              다시 읽을 수 있도록.
            </h2>
          </div>
          <p>
            자막과 Markdown 탭을 바꿔 보세요.
            <br />
            같은 문장이 어떻게 남는지 살펴볼 수 있습니다.
          </p>
        </div>
        <TranscriptDemo />
      </section>
      <section className="gs-product-workflow" id="how-it-works" aria-labelledby="steps-heading">
        <div className="gs-container">
          <p className="gs-eyebrow">사용 흐름</p>
          <h2 id="steps-heading">
            고르고, 저장하고,
            <br />내 생각을 더하세요.
          </h2>
          <ol className="gs-step-grid">
            {steps.map(([title, description], i) => (
              <li key={title}>
                <span>0{i + 1}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section
        className="gs-faq gs-container gs-product-faq"
        id="faq"
        aria-labelledby="youtube-faq-heading"
      >
        <div>
          <p className="gs-eyebrow">사용하기 전에</p>
          <h2 id="youtube-faq-heading">알아두면 좋은 점.</h2>
        </div>
        <div className="gs-faq-list">
          {faqs.map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <Plus size={18} aria-hidden="true" />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
      <section
        className="gs-availability gs-container"
        id="availability"
        aria-labelledby="availability-heading"
      >
        <div>
          <p className="gs-eyebrow">출시 안내</p>
          <h2 id="availability-heading">
            조금 더 다듬어,
            <br />
            다시 만나겠습니다.
          </h2>
        </div>
        <div>
          <p>
            현재 개인용 Mac 빌드에서 사용 흐름을 다듬고 있습니다. 공개 배포 일정, 지원 환경과 가격은
            확정 후 이 페이지에서 안내합니다.
          </p>
          <span className="gs-release-label">YouTube to MD · 정식 배포 준비 중</span>
        </div>
      </section>
      <section className="gs-other-apps gs-container" aria-labelledby="other-heading">
        <h2 id="other-heading">다음 작업을 위한 다른 도구.</h2>
        <div>
          {appCatalog
            .filter((app) => app.id !== id)
            .map((app) => (
              <a key={app.id} href={app.href}>
                <span>
                  <strong>{app.name}</strong>
                  <small>{app.category}</small>
                </span>
                {app.id === 'typecut-pro' ? (
                  <ArrowUpRight size={21} aria-hidden="true" />
                ) : (
                  <ArrowRight size={21} aria-hidden="true" />
                )}
              </a>
            ))}
        </div>
      </section>
    </StorefrontShell>
  );
}
