"use client";
import { useRef, useState } from "react";
import { Tabs } from "@base-ui/react/tabs";
import { ArrowDownToLine, Check, Copy, FileText, Code2, BookOpen } from "lucide-react";
import StatusMark, { type StatusMarkStatus } from "@/components/react-bits/StatusMark";
import { pdfSamples, sampleMarkdown } from "@/products/pdf-demo";
import { DocumentPreview, MarkdownPreview } from "./DocumentPreview";

export default function ResultComparison() {
  const [sampleId, setSampleId] = useState("research");
  const [status, setStatus] = useState<StatusMarkStatus>("pending");
  const request = useRef(0);
  const sample = pdfSamples.find(s => s.id === sampleId)!;
  async function copy() {
    const current = ++request.current;
    setStatus("running");
    try { await navigator.clipboard.writeText(sampleMarkdown(sample)); if (request.current === current) setStatus("done"); }
    catch { if (request.current === current) setStatus("failed"); }
  }
  function download() {
    const blob = new Blob([sampleMarkdown(sample)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = sample.filename; a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="gr-comparison">
    <div className="gr-comparison-top"><span><span className="gr-dot" /> 직접 살펴보는 Markdown</span><label className="gr-sample-select">예시 선택 <select value={sampleId} onChange={e => { request.current++; setSampleId(e.target.value); setStatus("pending"); }} aria-label="설명용 샘플 선택">{pdfSamples.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label></div>
    <Tabs.Root defaultValue="markdown" className="gr-comparison-content">
      <div className="gr-comparison-source"><div className="gr-panel-label"><FileText size={15} /> 문서 형태 <span>INPUT</span></div><DocumentPreview sample={sample} /></div>
      <div className="gr-comparison-result">
        <div className="gr-result-toolbar"><Tabs.List className="gr-tabs" aria-label="결과 표시 방식">
          <Tabs.Tab value="source" className="gr-mobile-source"><FileText size={15} /> 문서</Tabs.Tab>
          <Tabs.Tab value="markdown"><Code2 size={15} /> Markdown</Tabs.Tab><Tabs.Tab value="reading"><BookOpen size={15} /> 읽기</Tabs.Tab>
        </Tabs.List><span className="gr-output-label">OUTPUT</span></div>
        <Tabs.Panel value="source"><DocumentPreview sample={sample} /></Tabs.Panel>
        <Tabs.Panel value="markdown"><MarkdownPreview sample={sample} /></Tabs.Panel>
        <Tabs.Panel value="reading"><MarkdownPreview sample={sample} rendered /></Tabs.Panel>
        <div className="gr-result-actions"><span className="gr-file-name">{sample.filename}</span><button type="button" onClick={copy} className="gr-icon-button" aria-label="Markdown 복사" disabled={status === "running"}>{status === "done" ? <Check size={17} /> : <Copy size={17} />}</button><button type="button" className="gr-icon-button" onClick={download} aria-label="설명용 Markdown 다운로드"><ArrowDownToLine size={17} /></button></div>
      </div>
    </Tabs.Root>
    <div className="gr-comparison-caption"><span>직접 구성한 설명용 예시입니다. 실제 앱의 변환 결과는 아닙니다.</span><span role="status"><StatusMark status={status} strike={false} label={status === "done" ? "복사했습니다" : status === "failed" ? "복사하지 못했습니다. 원문을 선택해 복사해 주세요." : status === "running" ? "복사 중" : "선택하고, 읽고, 복사해 보세요"} /></span></div>
  </div>;
}
