import { ArrowRight, Cloud, FileText, FolderOpen, Laptop, LockKeyhole } from "lucide-react";
import BookScanComparison from "./BookScanComparison";
import ApiCostComparison from "./ApiCostComparison";
import NotebookLimitComparison from "./NotebookLimitComparison";
import { comparisonCheckedAt, comparisonSources as sources } from "@/products/local-comparison";

export default function LocalAiComparison() {
  return <section className="rm-local-section" id="why-local" aria-labelledby="local-heading"><div className="gr-container">
    <div className="rm-section-heading"><p className="rm-kicker">ReadyMD가 로컬 AI를 쓰는 이유</p><h2 id="local-heading">중요한 자료일수록,<br /><em>내 컴퓨터에서 먼저.</em></h2><p>외부에 올리기 어려운 문서, 반복해서 정리할 자료. <br />어디에서 처리하는지에 따라 자료의 이동과 비용이 달라집니다.</p></div>
    <nav className="rm-comparison-nav" aria-label="로컬 AI 비교 항목"><a href="#local-privacy">자료 보안 <ArrowRight size={14} /></a><a href="#local-cost">반복 처리 비용 <ArrowRight size={14} /></a><a href="#local-limits">파일 용량·개수 <ArrowRight size={14} /></a></nav>

    <div className="rm-comparison-chapter" id="local-privacy"><div className="rm-chapter-title"><span>01 / 자료의 이동</span><h3>업로드하면 안 되는 자료도<br />읽기 편해져야 하니까.</h3><p>고객 정보가 담긴 계약서, 공개 전 연구 자료, 내부 회의록. <br />외부 전송이 금지된 자료라면 처리 장소부터 달라야 합니다.</p></div>
      <div className="rm-data-paths"><div className="rm-local-path"><div className="rm-path-label"><Laptop size={19} /><strong>ReadyMD · 로컬 처리 방식</strong><span>내 컴퓨터 안에서</span></div><ol><li><FileText size={29} /><strong>나의 PDF</strong></li><li className="rm-path-arrow" aria-hidden="true"><ArrowRight size={20} /></li><li><LockKeyhole size={29} /><strong>로컬 AI가 인식</strong></li><li className="rm-path-arrow" aria-hidden="true"><ArrowRight size={20} /></li><li><FolderOpen size={29} /><strong>EPUB · MD · 이미지</strong></li></ol><p>문서 인식을 위해 외부 AI API에 원문을 보내지 않는 방식입니다.</p></div>
      <div className="rm-cloud-path"><span>클라우드 문서 분석</span><div><FileText size={21} /><span>나의 자료</span><ArrowRight size={18} /><Cloud size={25} /><strong>외부 서비스로 전송</strong></div><p>GPT API·NotebookLM은 제공한 자료를 서비스에서 처리합니다.</p></div></div>
      <div className="rm-privacy-context"><strong>‘학습에 사용하지 않음’과<br />‘업로드하지 않음’은 다릅니다.</strong><div><p>OpenAI API는 기본적으로 학습에 데이터를 사용하지 않습니다. NotebookLM도 기본 학습 제외 정책이 있지만, 일반 계정의 피드백 제출에는 관련 내용의 검토·활용 조건이 있습니다. 이런 정책이 있어도 외부 전송 자체가 허용되는지는 별도로 확인해야 합니다.</p><div className="rm-source-links"><a href={sources.apiData} target="_blank" rel="noreferrer">OpenAI 데이터 정책 ↗</a><a href={sources.notebookData} target="_blank" rel="noreferrer">Google 데이터 정책 ↗</a></div><details><summary>처리 범위와 계정별 차이</summary><p>ReadyMD 설명은 로컬 OCR 구간 기준입니다. 모델 다운로드·업데이트와 사용자가 결과를 외부 AI에 제공하는 일은 별도이며, 출시판 전체 데이터 흐름은 검증 후 공개합니다. 로컬 처리도 기기 보안과 자료 반출 규칙을 대신하지 않습니다.</p><p>OpenAI API는 기본 악용 모니터링 로그를 최대 30일 보관할 수 있고 예외·승인 기반 보관 제어가 있습니다. NotebookLM의 적격 Workspace·Education 계정은 피드백 시에도 인적 검토·AI 학습 제외 조건이 적용됩니다. 서비스·계정별 정책을 확인하세요.</p></details></div></div>
    </div>

    <div className="rm-comparison-chapter" id="local-cost"><div className="rm-chapter-title"><span>02 / 반복 처리 비용</span><h3>200쪽 책 한 권,<br />AI로 옮기면 얼마일까요?</h3><p>요약 몇 줄이 아니라, 책 전체를 다시 쓸 수 있는 텍스트로 만드는 비용입니다.</p></div><BookScanComparison /><details className="rm-usage-note"><summary>다른 모델·문서 수로 API 비용 계산하기</summary><ApiCostComparison /></details></div>

    <div className="rm-comparison-chapter" id="local-limits"><div className="rm-chapter-title"><span>03 / 파일 용량과 개수</span><h3>올리고 싶은 자료가 많다면,<br />한도부터 확인하게 됩니다.</h3><p>NotebookLM 기준으로 용량과 소스 수를 비교했습니다. <br />현재 Google 공식 도움말의 명칭은 <strong>Gemini Notebook</strong>입니다.</p></div><NotebookLimitComparison />
      <div className="rm-compare-table-wrap" tabIndex={0} role="region" aria-label="처리 방식 비교표, 작은 화면에서 가로 스크롤 가능"><table className="rm-compare-table"><caption>ReadyMD · NotebookLM · GPT API의 처리 기준</caption><thead><tr><th scope="col">비교 항목</th><th scope="col">ReadyMD<small>로컬 OCR 기준</small></th><th scope="col">NotebookLM<small>Gemini Notebook</small></th><th scope="col">GPT API<small>파일 직접 입력 기준</small></th></tr></thead><tbody>
        <tr><th scope="row">자료가 처리되는 곳</th><td>내 컴퓨터</td><td>Google 서비스</td><td>OpenAI 서비스</td></tr>
        <tr><th scope="row">외부 AI 호출료</th><td>로컬 처리 구간 $0<small>앱·전기·장비 비용 별도</small></td><td>무료 / 유료 요금제<small>토큰별 API 요금 비교 대상 아님</small></td><td>입력·출력 토큰에 따라 과금</td></tr>
        <tr><th scope="row">파일 용량</th><td>앱 처리 한도 검증 중<small>기기 메모리·문서 구성 영향</small></td><td>파일당 최대 200MB<small>소스당 최대 50만 단어</small></td><td>파일당 50MB 미만<small>한 요청의 파일 합계 최대 50MB</small></td></tr>
        <tr><th scope="row">파일 개수</th><td>클라우드 노트북 상한 없음<small>앱 자체 일괄 처리 한도는 미확정</small></td><td>노트북당 50–600개<small>요금제별 소스 수</small></td><td>여러 파일 입력 가능<small>요청 용량·모델 문맥 한도 내</small></td></tr>
        <tr><th scope="row">계속 사용하는 조건</th><td>저장 공간·기기 성능<small>지원 환경·품질 검증 후 안내</small></td><td>소스 한도 + AI 사용량 한도<small>사용량에 따라 대기·업그레이드</small></td><td>사용량 예산·요청 속도 제한<small>모델·계정 등급에 따라 다름</small></td></tr>
      </tbody></table></div>
      <p className="rm-comparison-note">GPT API의 50MB는 한 요청에 직접 입력하는 파일 기준이며, ChatGPT 앱이나 Files API의 저장 한도와 다릅니다. ReadyMD를 거쳐 외부 AI에 전달하더라도 해당 서비스의 한도·정책은 그대로 적용됩니다. <a href={sources.apiFiles} target="_blank" rel="noreferrer">API 파일 입력 기준 ↗</a></p>
      <details className="rm-usage-note"><summary>NotebookLM의 답변 횟수 제한은 어떻게 되나요?</summary><p>Google은 2026년 9월 2일부터 프롬프트 복잡도·모델·기능·대화 길이를 반영하는 연산량 기반 사용 한도를 안내합니다. 5시간 단위 갱신과 주간 한도가 있으므로, 과거의 ‘하루 질문 몇 회’ 숫자를 현재의 고정 한도로 제시하지 않았습니다. <a href={sources.notebookUsage} target="_blank" rel="noreferrer">현재 공식 사용량 안내 ↗</a></p></details>
    </div>
    <div className="rm-local-takeaway"><LockKeyhole size={23} /><div><h3>먼저 내 자료로 정리하고,<br />공유할 자료는 내가 고르세요.</h3><p>ReadyMD는 읽기·재사용을 위한 파일을 만드는 단계에 집중합니다. <br />클라우드 AI의 질문·답변 기능은 필요한 자료에 선택해서 활용하세요.</p></div></div>
    <p className="rm-comparison-date">공식 자료 확인: {comparisonCheckedAt} · 요금·한도는 변경될 수 있습니다. ReadyMD 항목은 제품 설계 기준이며 출시판 실측 한도는 미확정입니다.</p>
  </div></section>;
}
