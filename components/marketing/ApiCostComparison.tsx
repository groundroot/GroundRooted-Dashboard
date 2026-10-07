"use client";
import { useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { calculateEstimate, comparisonModels, comparisonSources, defaultEstimate, estimateFields, validEstimateField, type EstimateField } from "@/products/local-comparison";
const number = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });
const dollars = (value: number) => value > 0 && value < .01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`;
const mainFields: EstimateField[] = ["files", "pages", "passes"];
const detailFields: EstimateField[] = ["text", "image", "output", "exchange"];

export default function ApiCostComparison() {
  const [values, setValues] = useState({ ...defaultEstimate });
  const estimate = calculateEstimate(values);
  const tokensValid = (["text", "image", "output"] as EstimateField[]).every(key => validEstimateField(key, values[key]));
  function field(key: EstimateField) {
    const config = estimateFields[key];
    const invalid = !validEstimateField(key, values[key]);
    return <label className="rm-cost-field" key={key} htmlFor={`cost-${key}`}><span>{config.label}</span><span className="rm-number-input"><input id={`cost-${key}`} type="number" inputMode="numeric" min={config.min} max={config.max} step="1" required value={values[key]} aria-invalid={invalid || undefined} aria-describedby={invalid ? "cost-error" : undefined} onChange={event => setValues(current => ({ ...current, [key]: event.target.value }))} /><span>{config.unit}</span></span></label>;
  }
  return <div className="rm-cost-calculator">
    <div className="rm-cost-inputs"><h4>내 자료로 계산해 보세요</h4><p>PDF를 페이지 단위로 나눠 글을 전사·정리하는 예시입니다.</p><div className="rm-cost-main-fields">{mainFields.map(field)}</div>
      <p className="rm-cost-assumption">{tokensValid ? <>현재 가정 · 페이지당 입력 {number.format(Number(values.text) + Number(values.image))}토큰<br />(글 {number.format(Number(values.text))} + 이미지 {number.format(Number(values.image))}) · 출력 {number.format(Number(values.output))}토큰</> : "토큰 가정 값을 확인해 주세요."}</p>
      <details className="rm-cost-settings"><summary>토큰·환율 가정 바꾸기</summary><div>{detailFields.map(field)}</div><p>토큰은 AI가 처리하는 단위입니다. 글자 수·페이지 수와 일치하지 않습니다. 이미지 토큰은 해상도·모델·detail 설정에 따라 달라지므로 위 값은 고정 요금이 아닌 가정입니다.</p><p>원화는 입력한 환율로 환산한 예시입니다. 실시간 환율이 아닙니다.</p></details>
      <button className="rm-reset-calculator" type="button" onClick={() => setValues({ ...defaultEstimate })}><RotateCcw size={14} /> 기본 예시로 초기화</button>
    </div>
    <div className="rm-cost-results" aria-live="polite" aria-atomic="true">
      {estimate ? <><div className="rm-cost-result-heading"><span>예상 외부 AI API 비용</span><strong>{number.format(estimate.pageCount)}쪽 처리</strong></div><div className="rm-cost-bars">{estimate.models.map((model, index) => <div className="rm-cost-row" key={model.id}><div><span>{model.name}</span><strong>{dollars(model.usd)} <small>약 {number.format(model.krw)}원</small></strong></div><div className="rm-cost-track" aria-hidden="true"><span className={index ? "rm-bar-secondary" : undefined} style={{ width: `${estimate.models[0].usd > 0 ? model.usd / estimate.models[0].usd * 100 : 0}%` }} /></div><p>입력 {dollars(model.inputUsd)} + 출력 {dollars(model.outputUsd)}</p></div>)}</div><p className="rm-cost-fx">원화 환산 · $1 = {number.format(Number(values.exchange))}원 가정<br />실시간 환율이 아닙니다.</p><div className="rm-local-cost"><div><span>ReadyMD 로컬 OCR</span><strong>$0 <small>외부 AI API 호출료</small></strong></div><p>로컬 모델만으로 처리하는 구간 기준입니다. <br />앱 가격·전기·장비 비용은 별도이며, 앱 가격은 미정입니다.</p></div></> : <div id="cost-error" className="rm-cost-error"><strong>계산할 값을 확인해 주세요.</strong><p>문서·페이지는 1–1,000, 재처리는 1–20, 토큰은 0–10,000, 환율은 1–10,000 범위의 정수를 입력하세요.</p></div>}
    </div>
    <details className="rm-cost-method"><summary>공식 단가와 계산 근거 <ArrowRight size={16} /></summary><div><p><strong>처리 페이지 = 문서 수 × 문서당 페이지 × 전체 재처리 횟수</strong><br />비용(USD) = 처리 페이지 × [(입력 글 토큰 + 입력 이미지 토큰) × 입력 단가 + 출력 토큰 × 출력 단가] ÷ 1,000,000</p><div className="rm-rate-list">{comparisonModels.map(model => <p key={model.id}><a href={model.source} target="_blank" rel="noreferrer">{model.name} 공식 단가 ↗</a><span>100만 토큰당 입력 ${model.input} · 출력 ${model.output}</span></p>)}</div><p>일반(Standard) 처리·비캐시 입력 기준입니다. Batch·캐시 할인, 시스템 프롬프트, 추가 추론 토큰, 재시도, 도구·저장 비용, 지역 할증·세금은 제외했습니다. GPT-5.4 mini는 추론 없음(none)을 가정합니다. 실제 토큰 사용량과 청구액은 다를 수 있습니다.</p><p>전체 재처리 횟수는 같은 내용을 다시 전사·정리하는 횟수입니다. 이미 만든 파일을 로컬에서 열어 읽는 횟수나 클라우드에 질문하는 횟수가 아닙니다. 검색·캐시를 쓰면 전체 자료를 매번 다시 보내지 않을 수 있습니다.</p><p><a href={comparisonSources.apiFiles} target="_blank" rel="noreferrer">PDF 입력은 추출된 글과 페이지 이미지를 함께 처리합니다 ↗</a>. 모델 간 품질이 같다는 비교가 아니며, ChatGPT 구독료·NotebookLM 요금과도 별개입니다.</p></div></details>
  </div>;
}
