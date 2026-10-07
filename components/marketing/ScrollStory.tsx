import { FileText, ScanText, BookOpen, FolderOpen } from "lucide-react";

const scenes = [
  { label: "가지고 있던 PDF", description: "작은 글씨와 고정된 지면. 읽기 불편했던 자료에서 시작합니다.", Icon: FileText },
  { label: "로컬 모델 OCR", description: "내 컴퓨터에서 본문을 읽고 제목·문단·표와 시각 자료의 관계를 정리합니다.", Icon: ScanText },
  { label: "사람을 위한 EPUB", description: "화면 너비와 글자 크기에 맞춰 본문을 다시 배치해 편안하게 읽습니다.", Icon: BookOpen },
  { label: "AI를 위한 MD + 이미지", description: "본문과 이미지 폴더를 함께 보관하고, 이미지 이해를 지원하는 AI 도구에서 활용합니다.", Icon: FolderOpen },
];

/** Readable server-rendered process; no scroll pinning or input interception. */
export default function ScrollStory() {
  return <section className="gr-process" id="story" aria-labelledby="story-heading">
    <div className="gr-container">
      <div className="gr-section-heading"><h2 id="story-heading">읽고, 구조를 잇고, 다시 활용하세요.</h2><p>하나의 입력에서 사람과 AI를 위한 두 가지 결과로.</p></div>
      <ol className="gr-process-flow">{scenes.map(({ label, description, Icon }, index) => <li key={label} id={"story-scene-" + index}><Icon size={26} strokeWidth={1.5} aria-hidden="true" /><h3>{label}</h3><p>{description}</p></li>)}</ol>
      <p className="gr-section-footnote">제품 흐름을 설명하는 예시입니다. 실제 변환은 수행하지 않습니다.</p>
    </div>
  </section>;
}
