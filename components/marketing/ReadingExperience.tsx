"use client";
import { useState } from "react";
import { Tabs } from "@base-ui/react/tabs";
import { ArrowRight, BookOpen, Copy, Download, FileText, FolderOpen, Type } from "lucide-react";
import StatusMark from "@/components/react-bits/StatusMark";
import { readingStory as story, readingMarkdown } from "@/products/readymd-story";
import StoryDocument from "./StoryDocument";

export default function ReadingExperience() {
  const [fontSize, setFontSize] = useState(18);
  const [copyState, setCopyState] = useState<"pending" | "running" | "done" | "failed">("pending");
  async function copySample() {
    setCopyState("running");
    try { await navigator.clipboard.writeText(readingMarkdown); setCopyState("done"); }
    catch { setCopyState("failed"); }
  }
  function downloadSample() {
    const url = URL.createObjectURL(new Blob([readingMarkdown], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = story.filename; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <Tabs.Root defaultValue="read" className="rm-experience">
    <Tabs.List className="rm-experience-tabs" aria-label="같은 자료의 두 가지 활용">
      <Tabs.Tab value="read"><BookOpen size={20} /> 편하게 읽기</Tabs.Tab>
      <Tabs.Tab value="reuse"><FileText size={20} /> AI와 활용하기</Tabs.Tab>
    </Tabs.List>
    <p className="rm-example-caption">사용 방식을 보여주는 예시입니다. 실제 앱 화면·변환 결과가 아닙니다.</p>
    <Tabs.Panel value="read" className="rm-demo-panel">
      <div className="rm-demo-heading"><h3>글씨를 키워도,<br />문장은 화면 안에서.</h3><p>내 눈에 편한 크기로 바꿔 보세요. <br />이렇게 화면에 맞춰 읽는 전자책 파일이 <strong>EPUB</strong>입니다.</p></div>
      <div className="rm-reader-grid">
        <div className="rm-before"><div className="rm-surface-label"><FileText size={17} /><strong>원래의 PDF</strong><span>고정된 지면</span></div><div className="rm-paper-stage"><StoryDocument compact /></div><p>작은 화면에서는 본문도 함께 작아집니다.</p></div>
        <div className="rm-after"><div className="rm-surface-label"><BookOpen size={17} /><strong>읽기 편한 전자책</strong><span>EPUB</span></div>
          <label className="rm-font-control" htmlFor="epub-font-size"><Type size={19} /><span>글자 크기</span><input id="epub-font-size" type="range" min="16" max="28" step="2" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} aria-valuetext={`${fontSize}픽셀`} /><output htmlFor="epub-font-size">{fontSize}px</output></label>
          <article className="rm-reader" style={{ fontSize }} tabIndex={0} aria-label="글자 크기를 바꿔 읽는 설명용 본문"><StoryDocument /></article>
        </div>
      </div>
      <p className="rm-demo-note">브라우저에서 글자 크기와 줄바꿈을 체험합니다. 실제 읽기 설정은 사용하는 EPUB 뷰어에 따라 달라집니다.</p>
    </Tabs.Panel>
    <Tabs.Panel value="reuse" className="rm-demo-panel">
      <div className="rm-demo-heading"><h3>글과 그림을 함께,<br />다음 작업의 재료로.</h3><p>제목과 문단을 정리한 파일에 그림의 자리를 남깁니다. <br />이 텍스트 파일이 <strong>Markdown(MD)</strong>입니다.</p></div>
      <div className="rm-reuse-grid">
        <article className="rm-reuse-document"><div className="rm-surface-label"><FileText size={17} /><strong>정리된 본문</strong><span>reading-note.md</span></div><div className="rm-reuse-body"><span className="rm-document-label">READING NOTE</span><h4>{story.title}</h4><p>{story.intro}</p><h5>{story.heading}</h5>{story.paragraphs.map(text => <p key={text}>{text}</p>)}<a className="rm-image-reference" href="#connected-image"><span>그림 1</span> 읽기 → 메모 → 연결 <ArrowRight size={16} /></a></div></article>
        <div className="rm-reuse-side"><figure id="connected-image"><div className="rm-surface-label"><FolderOpen size={17} /><strong>본문에 연결된 그림</strong></div><img src={story.image} alt="본문의 그림 1: 읽기, 메모, 연결로 이어지는 과정" width={720} height={300} /><figcaption>{story.caption}</figcaption></figure><div className="rm-ai-handoff"><span>AI와 함께 쓸 때는</span><h4>본문 파일 + 이미지 파일</h4><p>두 파일을 함께 제공하세요. 이미지를 읽을 수 있는 AI 도구에서 글과 그림을 함께 참고할 수 있습니다.</p><p className="rm-demo-note">외부 AI에 자동 전송하지 않습니다. 도구별 파일·이미지 지원을 확인하세요.</p></div></div>
      </div>
      <details className="rm-file-details"><summary>파일 구조 보기 <span>MD 원문과 예시 파일</span></summary><div className="rm-file-content"><pre aria-label="Markdown 예시 원문"><code>{readingMarkdown}</code></pre><div className="rm-file-downloads"><strong>같은 폴더에 보관하세요</strong><code>reading-note.md<br />images/<br />　reading-map.svg</code><button type="button" onClick={copySample} disabled={copyState === "running"}><Copy size={16} /> MD 본문 복사</button><button type="button" onClick={downloadSample}><Download size={16} /> MD 예시 저장</button><a href={story.image} download={story.imageFile}><Download size={16} /> 그림 예시 저장</a><p>그림은 images 폴더에 넣어 주세요. 직접 작성한 설명용 파일입니다.</p><span role="status" className="rm-copy-status">{copyState !== "pending" && <StatusMark status={copyState} label={copyState === "done" ? "본문을 복사했습니다." : copyState === "failed" ? "복사하지 못했습니다. MD 예시를 저장해 주세요." : "복사 중입니다."} />}</span></div></div></details>
    </Tabs.Panel>
  </Tabs.Root>;
}
