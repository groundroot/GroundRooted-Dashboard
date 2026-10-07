'use client';

import { ArrowRight, BookOpen, FileText, Laptop } from 'lucide-react';
import { useState } from 'react';
import { bookScanSources as sources, bookScanCsv, estimateBook, scanModes, type ScanMode } from '@/products/book-scan';

const number = (value: number) => value.toLocaleString('en-US');
const usd = (value: number) => `$${value.toFixed(2)}`;

export default function BookScanComparison() {
  const [mode, setMode] = useState<ScanMode>('high');
  const [output, setOutput] = useState(1000);
  const [budget, setBudget] = useState('20');
  const validBudget = budget.trim() !== '' && Number.isFinite(Number(budget)) && Number(budget) >= 0 && Number(budget) <= 10000;
  const result = estimateBook(mode, output, validBudget ? Number(budget) : 0);
  const comparisons = (Object.keys(scanModes) as ScanMode[]).map(key => ({ key, ...estimateBook(key, output, validBudget ? Number(budget) : 0) }));
  return <div className="rm-book-study" id="book-budget">
    <div className="rm-book-brief"><BookOpen size={26} aria-hidden="true" /><div><strong>스캔 책 200쪽 → 전체 본문을 텍스트로</strong><p>Astra API로 20쪽씩 나누어 변환하는 경우입니다.</p></div></div>
    <div className="rm-book-budget-heading"><h4>{validBudget ? `API 예산 $${number(Number(budget))}로 얼마나 가능할까요?` : '예산에 맞춰 비교해 보세요.'}</h4><span>한 권당 예상 비용</span></div>
    <div className="rm-book-results" aria-live="polite" aria-atomic="true">
      {comparisons.map(row => <div className="rm-book-option" key={row.key}>
        <span className="rm-book-option-label">{row.key === 'high' ? '이미지를 줄여서 보내면' : '300dpi 원본으로 보내면'}</span>
        <strong className="rm-book-price">{usd(row.totalUsd)}<small> / 권</small></strong>
        <p className="rm-book-option-detail">{row.key === 'high' ? '이미지 축소 · 작은 글자 인식에 영향 가능' : '원본 해상도 유지 · 더 많은 입력 토큰'}</p>
        <div className="rm-book-stack" aria-hidden="true"><span style={{ width: `${row.inputUsd / comparisons[1].totalUsd * 100}%` }} /><span style={{ width: `${row.outputUsd / comparisons[1].totalUsd * 100}%` }} /></div>
        <p className="rm-book-breakdown">이미지·지시문 입력 {usd(row.inputUsd)} + 본문 출력 {usd(row.outputUsd)}</p>
        <div className="rm-book-allowance"><span>{validBudget ? `$${number(Number(budget))} 예산 기준` : '예산 미입력'}</span><b>{!validBudget ? '예산을 입력해 주세요' : row.books === 0 ? '한 권에 부족' : `최대 ${number(row.books)}권`}</b></div>
      </div>)}
    </div>
    <p className="rm-book-assumptions">쪽당 본문 {number(output)}토큰 가정 · Standard · 캐시 미사용 · 추론·재시도 등 추가 비용 제외. 권수는 이 조건의 상한이며 실제 완료량은 달라집니다.</p>
    <p className="rm-book-subscription"><strong>ChatGPT Plus 월 $20 구독과는 별도입니다.</strong> 구독료를 API 잔액이나 고정 처리 권수로 바꿔 계산할 수는 없습니다. <a href={sources.plus} target="_blank" rel="noreferrer">공식 안내 ↗</a></p>
    <details className="rm-book-settings"><summary>내 예산·본문량으로 다시 계산하기</summary><div className="rm-book-controls">
      <label htmlFor="book-api-budget">API 예산 (USD)<input id="book-api-budget" type="number" min="0" max="10000" step="0.01" value={budget} aria-invalid={!validBudget} aria-describedby={!validBudget ? 'book-budget-error' : undefined} onChange={event => setBudget(event.target.value)} /></label>
      <label htmlFor="book-output">쪽당 변환 결과 <select id="book-output" value={output} onChange={event => setOutput(Number(event.target.value))}><option value={500}>500토큰 · 짧은 본문 가정</option><option value={1000}>1,000토큰 · 기본 가정</option><option value={2000}>2,000토큰 · 긴 본문 가정</option></select></label>
    </div>{!validBudget && <p className="rm-cost-error" id="book-budget-error" role="alert">API 예산은 0–10,000달러 범위로 입력해 주세요.</p>}<p className="rm-comparison-note">토큰은 AI가 글과 이미지를 처리하는 단위입니다. 글자 수와 같지는 않습니다. A4 300dpi 상당의 2,480 × 3,508px 이미지 200장, 텍스트 레이어 없음, 요청당 지시문 200토큰을 가정했습니다.</p></details>

    <div className="rm-book-capacity" aria-live="polite"><div className="rm-book-capacity-heading"><h4>파일 하나여도,<br />한 번에 다 옮기기는 어렵습니다.</h4><p>AI가 받아들이는 양과 답변으로 내보내는 양에는 각각 한도가 있습니다.</p></div>
      <fieldset className="rm-book-mode"><legend>이미지 처리 방식에 따른 한도 비교</legend>{(Object.keys(scanModes) as ScanMode[]).map(key => <button key={key} type="button" aria-pressed={mode === key} onClick={() => setMode(key)}>{key === 'high' ? '축소 이미지' : '300dpi 원본'}</button>)}</fieldset>
      <div className="rm-book-capacity-grid">
        <div><span>AI가 읽어야 할 이미지</span><strong>{(result.inputTokens / 10000).toFixed(1)}만 <small>토큰</small></strong><div className="rm-book-meter" aria-hidden="true"><span style={{width: `${Math.min(result.inputTokens / 922000 * 100, 100)}%`}} /></div><p>한 번에 입력 가능: 최대 92.2만 토큰</p><b className="rm-book-status" data-exceeded={result.inputTokens > 922000}>{result.inputTokens > 922000 ? '원본 이미지는 나눠 보내야 합니다' : '이미지 입력량은 한도 안에 들어갑니다'}</b></div>
        <div><span>AI가 돌려줘야 할 책 전체 본문</span><strong>{number(result.outputTokens / 10000)}만 <small>토큰</small></strong><div className="rm-book-meter" aria-hidden="true"><span style={{width: `${Math.min(result.outputTokens / 128000 * 100, 100)}%`}} /></div><p>한 번에 출력 가능: 최대 12.8만 토큰 · 추론 포함</p><b className="rm-book-status" data-exceeded={result.outputTokens > 128000}>{result.outputTokens > 128000 ? '책 전체를 한 답변에 담을 수 없습니다' : '본문은 한도 내 · 추론 여유는 별도입니다'}</b></div>
      </div>
      <p className="rm-book-verdict">{result.oneRequestFits ? '선택한 가정은 토큰 한도 내입니다. 실제 완료·품질은 별도 확인이 필요합니다.' : '그래서 위 비용은 20쪽씩 나누어 처리하는 방식으로 계산했습니다.'}</p>
      <ol className="rm-book-batches" aria-label="200쪽 책을 분할 처리하는 방법"><li><BookOpen size={23} aria-hidden="true" /><span>200쪽 책</span></li><li aria-hidden="true"><ArrowRight size={18} /></li><li><div className="rm-book-batch-blocks" aria-hidden="true">{Array.from({length:10},(_,i)=><i key={i} />)}</div><span>20쪽씩 × 10번</span></li><li aria-hidden="true"><ArrowRight size={18} /></li><li><FileText size={23} aria-hidden="true" /><span>결과 확인·합치기</span></li></ol>
    </div>
    <div className="rm-book-reuse"><div><p className="rm-kicker">ReadyMD가 로컬 AI를 쓰는 이유</p><h4>한 번 내 자료로 만들어 두고,<br />필요한 부분만 AI에게.</h4><p>내 컴퓨터에서 PDF를 읽기 좋은 EPUB과 재사용할 Markdown으로 정리합니다. 다음 분석에는 필요한 문단과 이미지를 골라 활용하세요.</p></div><div className="rm-book-local-fee"><Laptop size={27} aria-hidden="true" /><span>로컬 OCR 구간의 외부 AI 호출료</span><strong>$0</strong><small>앱·전기·장비 비용은 별도입니다.<br />외부 AI로 분석하면 해당 서비스 요금이 적용됩니다.</small></div></div>
    <div className="rm-book-evidence"><h4>숫자의 근거가 궁금하다면</h4>
      <details><summary>앞 페이지를 반복해서 보내면 얼마나 늘어나나요?</summary><p>20쪽씩 나누면서 매번 앞쪽 이미지까지 다시 넣으면 20 + 40 + … + 200 = 1,100쪽분입니다. 필요한 20쪽만 독립적으로 보내면 총 200쪽분으로, 누적 이미지 입력량에 5.5배 차이가 납니다.</p><p>누적 전송은 필수 동작이 아닙니다. 원본 누적 방식은 후반에 입력 한도도 넘습니다. 캐시 적중 시 비용은 줄어들므로 토큰 5.5배가 비용 5.5배를 뜻하지는 않습니다.</p></details>
      <details><summary>Plus에 스캔 PDF를 바로 올리면 되지 않나요?</summary><p>공식 파일 안내는 Enterprise 이외 플랜의 PDF 첨부를 텍스트 검색 방식으로 설명합니다. 이미지뿐인 PDF의 전 페이지 OCR을 보장하는 기능과는 다릅니다. PNG/JPEG로 따로 보내거나 다른 도구를 사용하는 것은 별도 경로입니다.</p><p>파일당 512MB·문서당 200만 토큰, 최대 80파일/3시간이라는 업로드 한도는 변환 완료량이 아닙니다. 계정·혼잡도에 따라 제한이 달라집니다. <a href={sources.uploads} target="_blank" rel="noreferrer">공식 파일 안내 ↗</a></p></details>
    <details className="rm-book-method"><summary>산식·추론 비용·캐시와 실제 검증 범위</summary><p>32 × 32px 패치 수에 Astra 배율 1.2를 곱해 올림합니다. high는 2,500패치 이내로 축소합니다. 원본은 쪽당 10,296토큰, high는 약 2,974토큰입니다. 서버의 반올림으로 1토큰 차이가 날 수 있습니다. 이 계산은 PDF를 직접 첨부했을 때의 내부 렌더링 실측이 아닌, 페이지를 명시한 크기의 이미지로 보낸 경우입니다.</p><p>각 20쪽 요청은 입력 272,000토큰 이하이므로 Standard 입력 $10 / 출력 $50(각 100만 토큰당)을 적용했습니다. 이를 넘으면 전체 요청의 입력은 $20, 출력은 $75입니다. 총 문맥은 1,050,000, 최대 입력 922,000, 최대 출력 128,000토큰입니다. 입력 한도와 출력 한도는 별도입니다.</p><p>캐시는 explicit 모드에서 breakpoint를 두지 않는 조건입니다. 기본 자동 캐시가 새로 기록하는 입력은 $12.50, 적중하는 입력은 $1(각 100만 토큰당, 짧은 문맥)이므로 실제 청구액은 달라집니다. Batch·Flex는 Standard의 50%이며 처리 조건이 다릅니다.</p><p>Astra는 추론 없음 설정을 지원하지 않습니다. 추론도 출력으로 과금되며 위 계산에서는 미지수라 제외했습니다. 20쪽 요청마다 추론이 1,000토큰 발생한다면 10개 요청에 $0.50가 추가됩니다. 쪽당 본문 토큰 수는 한국어 글자 수가 아닌 가정값입니다.</p><p>전송 용량도 별도입니다. 이미지 입력은 요청당 최대 1,500장·총 payload 512MB, 직접 PDF 입력은 파일당 50MB 미만·요청 합계 50MB입니다. PDF를 직접 보내면 추출 텍스트와 페이지 이미지가 함께 입력됩니다.</p><p>실제 문서 업로드·유료 API 호출·OCR 품질 비교는 하지 않았습니다. 시간·세금·도구·재시도·추가 내부 토큰도 제외했습니다. 원문과 결과의 문자 오류율·누락 페이지·표 정확도, API usage를 함께 측정해야 품질 대비 비용을 입증할 수 있습니다. ReadyMD의 실제 변환 품질과 처리 시간도 별도 검증 대상입니다.</p><div className="rm-source-links">{([['Astra 사양', sources.model], ['이미지 토큰', sources.vision], ['공식 요금', sources.pricing], ['추론 한도', sources.reasoning], ['캐시', sources.caching], ['파일 입력', sources.files]]).map(([label, href]) => <a key={label} href={href} target="_blank" rel="noreferrer">{label} ↗</a>)}</div></details>
      <div className="rm-source-links"><a href={`data:text/csv;charset=utf-8,${encodeURIComponent(bookScanCsv())}`} download="astra-200-page-estimates.csv">계산 예시 6개 내려받기 (CSV) ↓</a></div>
    </div>
    <p className="rm-comparison-date">공식 자료 확인 2026-09-26 · 공개 규칙을 적용한 추정이며 실제 청구액·OCR 품질 실측은 아닙니다. ReadyMD의 출시판 품질·처리 시간도 별도 검증 대상입니다.</p>
  </div>;
}
