"use client";
import { useState } from "react";
import { notebookPlans, requiredNotebooks, comparisonSources } from "@/products/local-comparison";
export default function NotebookLimitComparison() {
  const [files, setFiles] = useState(100);
  return <div className="rm-notebook-comparison">
    <div className="rm-limit-metrics"><div><strong>200 <span>MB</span></strong><p>업로드 파일당 용량 상한</p></div><div><strong>50만 <span>단어</span></strong><p>소스 하나의 분량 상한</p></div><p>용량과 단어 수를 각각 확인하세요.<br /><a href={comparisonSources.notebookFiles} target="_blank" rel="noreferrer">Google 공식 파일 제한 ↗</a></p></div>
    <div className="rm-library-example"><div><h4>자료가 늘면, 나눠 담아야 할 수도 있습니다.</h4><p>PDF 1개를 소스 1개로 등록하고, 각 파일이 용량·단어 제한 안에 있는 경우</p></div><fieldset><legend>비교할 PDF 수</legend>{[50,100,500].map(count=><button key={count} type="button" aria-pressed={files===count} onClick={()=>setFiles(count)}>{count}개</button>)}</fieldset></div>
    <div className="rm-limit-chart" role="img" aria-label="NotebookLM 요금제별 노트북당 소스 수: Standard 50, Plus 100, Pro 300, Ultra 20TB 500, Ultra 30TB 600"><span className="gr-sr-only">각 막대는 같은 600개 척도입니다.</span>{notebookPlans.map(plan=><div className="rm-limit-row" key={plan.name+plan.detail}><div><strong>{plan.name}</strong><small>{plan.detail}</small></div><div className="rm-limit-track"><span style={{width:`${plan.sources/600*100}%`}} /></div><strong>{plan.sources}<small>개</small></strong></div>)}</div>
    <div className="rm-notebook-counts" aria-live="polite"><p><strong>PDF {files}개</strong>를 담는 데 필요한 노트북 수 <span>소스 수만으로 계산</span></p><div>{notebookPlans.map(plan=><span key={plan.name+plan.detail}><span>{plan.name}{plan.name==="Ultra"?` ${plan.detail}`:""}</span><strong>{requiredNotebooks(files,plan.sources)}<small>개</small></strong></span>)}</div></div>
    <p className="rm-comparison-note">노트북당 등록 가능한 소스 수입니다. 한 번의 업로드 개수나 한 답변에서 모든 내용을 빠짐없이 읽는 양을 뜻하지 않습니다. 나뉜 노트북 전체를 한 번에 통합 분석한다는 의미도 아닙니다. <a href={comparisonSources.notebookPlans} target="_blank" rel="noreferrer">요금제별 공식 한도 ↗</a></p>
  </div>;
}
