import ReadingStory from '@/components/storefront/ReadingStory';
import EditorialImage from '@/components/storefront/EditorialImage';
import { ArrowRight, BookOpen, FileText, FolderOpen, Library, Search } from 'lucide-react';

export function OriginStory() {
  return <section className="rm-origin" id="origin-story" aria-labelledby="origin-heading"><div className="gr-container">
    <div className="rm-origin-opening"><div className="rm-section-heading"><p className="rm-kicker">ReadyMD를 만든 이유</p><h2 id="origin-heading">연구를 시작하려다<br /><em>토큰부터 써버렸습니다.</em></h2></div><div className="rm-origin-voice"><p>읽고 싶은 책과 연구에 쓸 PDF는 쌓여 있었습니다. 하지만 정작 제가 읽기도, AI에게 분석을 맡기기도 쉽지 않았습니다.</p><p>스캔 문서를 인식시키고 다시 정리하는 데 시간과 토큰을 쓰다 보니, 처음 하려던 분석은 시작도 못 하는 일이 생겼습니다.</p><p className="rm-origin-realization">먼저 자료를<br /><strong>AI가 잘 읽을 수 있게 만들어야 했습니다.</strong></p></div></div>
    <figure className="gr-origin-panorama"><EditorialImage name="origin" /><figcaption>작은 불편에서 시작해, 다음 생각으로. · AI 콘셉트 이미지</figcaption></figure>
    <div className="rm-nexus-story"><div className="rm-nexus-volume"><span>Nexus 프로젝트에서 쌓은 경험</span><strong><small>약</small> 40,000<small>권</small></strong><p>자료를 변환하며 배운 방법을<br />개인의 앱에 담았습니다.</p><span className="rm-origin-scope">Nexus의 변환 경험 기준</span></div><div className="rm-nexus-copy"><h3>Nexus에서 시작해,<br />ReadyMD로 이어졌습니다.</h3><p>이 문제를 풀려고 시작한 것이 Nexus 프로젝트입니다. 약 4만 권의 데이터를 변환하며 문서를 다루는 노하우를 쌓고, AI를 실제 작업에 연결하는 AX 과정을 익혔습니다.</p><p>그 경험을 개인도 자신의 자료에 쓸 수 있도록 앱으로 옮겼습니다. 사람이 읽기 좋은 파일, AI가 다시 활용하기 좋은 파일을 만드는 것. ReadyMD는 그렇게 만들어졌습니다.</p><div className="rm-origin-path"><span>Nexus<small>대규모 자료 변환 경험</small></span><ArrowRight size={20} aria-hidden="true" /><span>ReadyMD<small>내 컴퓨터에서 쓰는 앱</small></span></div></div></div>
    <div className="rm-origin-closing"><p>모아 둔 자료가 실제 연구와 생각으로 이어지도록.</p><a href="#library">나만의 서재로 이어지는 과정 <ArrowRight size={16} aria-hidden="true" /></a></div>
  </div></section>;
}

export function PersonalLibrary() {
  return <section className="rm-library" id="library" aria-labelledby="library-heading"><div className="gr-container">
    <div className="rm-library-heading"><div className="rm-section-heading"><p className="rm-kicker">For Your 2nd Brain</p><h2 id="library-heading">파일은 수백 개인데,<br /><em>언제 매번 업로드하나요?</em></h2></div><div className="rm-library-lead"><p>하나, 열 개쯤은 어떻게든 할 수 있습니다. 하지만 자료가 수백 개라면 질문할 때마다 파일을 골라 올리는 일도 부담이 됩니다.</p><p><strong>한곳에 모아 나만의 서재로 만들어 두세요.</strong><br />내가 읽고 메모하며, AI에게 질문할 때도 그 안의 지식을 꺼내 쓸 수 있도록.</p></div></div>
    <ol className="rm-library-flow" aria-label="ReadyMD에서 나만의 AI 서재로 이어지는 과정">
      <li><span className="rm-library-step">자료를 준비하고</span><div className="rm-library-flow-title"><FileText size={25} aria-hidden="true" /><h3>ReadyMD</h3></div><p>PDF를 읽기 좋은 EPUB과 <br />AI에 활용할 Markdown·이미지로.</p><div className="rm-library-files" aria-label="변환 결과"><span>읽기용 EPUB</span><span>Markdown + 이미지</span></div></li>
      <li><span className="rm-library-step">한곳에 모아 두면</span><div className="rm-library-flow-title"><Library size={25} aria-hidden="true" /><h3>Obsidian 서재</h3></div><p>Markdown과 이미지 폴더를 <br />내 보관함에 넣고 메모를 더합니다.</p><div className="rm-library-shelves"><span><FolderOpen size={15} aria-hidden="true" />책과 참고 자료</span><span><FolderOpen size={15} aria-hidden="true" />논문과 보고서</span><span><FileText size={15} aria-hidden="true" />내 생각과 메모</span></div></li>
      <li><span className="rm-library-step">질문에서 다시 꺼내 쓰는</span><div className="rm-library-flow-title"><Search size={25} aria-hidden="true" /><h3>나만의 세컨드 브레인</h3></div><p>서재를 읽는 AI 도구를 연결해 <br />질문과 관련된 자료를 찾고 분석합니다.</p><div className="rm-library-question"><span>이렇게 질문해 보세요</span><p>“내가 모은 자료에서<br />이 주제를 설명하는 근거를 찾아줘.”</p></div></li>
    </ol>
    <ReadingStory />
    <div className="rm-library-takeaway"><BookOpen size={25} aria-hidden="true" /><p>PDF를 모으는 데서 시작해,<br /><strong>내 서재에 질문하는 데까지.</strong></p><span>ReadyMD는 그 첫 준비를 맡습니다.</span></div>
    <p className="rm-library-note">활용 흐름을 설명하는 예시입니다. AI 질문·검색에는 별도 플러그인이나 AI 도구와 서재 접근 설정이 필요합니다. ReadyMD의 자동 연동 기능을 뜻하지 않습니다. 선택한 도구에 따라 색인·질문 비용과 자료 전송 범위가 달라집니다.</p>
    <details className="rm-library-details"><summary>Obsidian으로 자료를 옮길 때 알아둘 점</summary><p>Obsidian은 내 컴퓨터의 폴더를 보관함(Vault)으로 사용하며 Markdown 파일을 읽습니다. 변환한 본문과 이미지의 폴더 관계를 유지해 옮기고, 그림과 링크가 제대로 열리는지 확인하세요. 자료를 많이 모아 두는 것과 AI가 모든 파일을 한 번에 읽는 것은 다릅니다. 질문에 맞는 부분을 찾는 방식과 처리량은 연결한 도구에 따라 달라집니다.</p><p>외부 AI를 연결하면 선택한 본문이나 이미지가 외부로 전송될 수 있습니다. 민감한 자료는 연결 도구의 처리 위치와 접근 범위를 확인하세요.</p><div className="rm-library-sources"><a href="https://obsidian.md/help/data-storage" target="_blank" rel="noreferrer">Obsidian 보관 방식 ↗</a><a href="https://obsidian.md/help/import/markdown" target="_blank" rel="noreferrer">Markdown 가져오기 ↗</a></div></details>
  </div></section>;
}
