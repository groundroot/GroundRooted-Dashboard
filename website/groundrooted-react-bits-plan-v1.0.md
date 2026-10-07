# GroundRooted React Bits 적용 계획 1.0

작성일: 2026-09-19  
상태: PDF to MD에 6개 컴포넌트 적용·로컬 렌더링 확인 / 전체 T25·T26 및 실제 제품 자산 검수 전

**2026-09-20 최종 시각 변경:** [DESIGN.md 2.0](../DESIGN.md)의 CleanShot 참조와 **그림자·hover·장식 외곽선 금지**가 우선한다. Molten Metal은 light mode, blue/white, opacity 0.2로 조정했다. SpotlightCard는 정적 카드만 유지하고 pointer 추적/RAF/glow를 제거했다. 아래 과거 hover 요구는 더 이상 적용하지 않는다. 나머지 조작·모션 안전·사실 구분 기준은 유지한다.

사용자 지시: https://reactbits.dev/를 활용해 Backgrounds, Animations, Micro, Components, Text Animations를 웹사이트에 적용한다.

추가 지시: 배경은 **Molten Metal**로 교체한다. 앱 소개에는 방문자가 입력·사용 과정·결과를 이해하도록 돕는 컴포넌트를 사용한다. 카드 장식만으로 앱 소개 요구를 충족했다고 판정하지 않는다.

**다섯 범주 모두 실제 페이지에 적용하는 것을 제작 요건으로 삼는다.** 참고 링크나 후보 목록만 추가하거나 비슷한 효과를 새로 그린 것으로 적용 완료를 대신하지 않는다. 공식 소스에서 도입한 부품·수정 내역·페이지 위치를 추적하고 실제 브라우저에서 검수한다.

이 문서는 [구현·운영 계획](groundrooted-implementation-plan-v1.0.md)의 6절과 M2–M3/T25를 구체화한다. 기존 설계의 React Bits 관련 선택사항은 이 사용자 지시로 필수사항이 된다. GRDS의 한글 서체·뉴트럴/깊은 녹색·정확한 제품 설명과 함께 사용한다.

## 1. 공식 카탈로그·소스 확인

- [React Bits 공식 사이트](https://reactbits.dev/)와 [컴포넌트 인덱스](https://reactbits.dev/get-started/index)에서 다섯 범주를 확인했다.
- Micro는 단순 hover 효과의 임의 분류가 아니라 [공식 Micro 범주](https://reactbits.dev/c/micro)를 사용한다.
- 공식 저장소: [DavidHDev/react-bits](https://github.com/DavidHDev/react-bits).
- 검토한 commit: 2ec034e04f9f8e2ca30335415d8834f468558f5b (2026-09-19).
- TS + Tailwind 변형의 아래 여섯 소스를 실제 읽고 동작·import·정리 코드·접근성 조건을 검토했다. 다섯 범주에 여섯 부품을 사용하며, Components에는 SpotlightCard와 Stepper를 함께 포함한다.
- 사이트 소개 화면의 품질 설명은 우리 제품의 성능·접근성 증거로 사용하지 않는다.

## 2. 필수 적용 매핑

| ID·범주 | 도입할 실제 부품 | 웹사이트 위치·역할 | GRDS 적용·동작 |
|---|---|---|---|
| RB01 · Backgrounds | [Molten Metal](https://reactbits.dev/backgrounds/molten-metal) | 브랜드 홈 hero와 제품 상세 hero의 배경 | 흐르는 금속의 형태를 유지한 은빛·깊은 녹색 장식층. 본문·앱 화면은 대비가 안정적인 별도 표면 |
| RB02 · Animations | [AnimatedContent](https://reactbits.dev/animations/animated-content) | 홈 대표 제품 화면, PDF S06 가치 장면, 다른 제품의 설명 미디어 | 16px 이내 진입·0.98→1 scale, 약 480ms. 제품 설명의 순서를 보조 |
| RB03 · Micro | [StatusMark](https://reactbits.dev/micro/status-mark) | 공개 제품 링크 복사/MD 복사 결과, 이후 계정 요청·실제 주문 처리 상태 | 실제 사용자 동작·서버 결과에 맞춰 대기/진행/성공/오류 표시 |
| RB04 · Components | [SpotlightCard](https://reactbits.dev/components/spotlight-card) | 홈의 세 앱 카드, 제품의 관련 도구 소개 | 흰 표면·20px radius·제품 강조색, pointer/focus 반응과 실제 제품 링크 |
| RB05 · Text Animations | [SplitText](https://reactbits.dev/text-animations/split-text) | 홈 브랜드 문구의 강조 부분, PDF 상세 가치 제목 | 한글 단어/줄 단위의 짧은 순차 전개. 중요한 h1은 처음부터 읽힘 |
| RB06 · Components | [Stepper](https://reactbits.dev/components/stepper) | 각 앱의 작동 방식 구간에 들어가는 WorkflowDemo | 입력 → 앱에서 하는 작업 → 결과를 직접 선택. 단계에 맞는 실제 화면·짧은 설명·결과 확인이 함께 바뀜 |

추가 React Bits 부품은 목적·시각 비교·예산 검수를 거쳐 확장한다. 위 다섯 범주의 도입 자체는 사용자 요구이므로 누락할 수 없다. 모바일/동작 줄이기에서 정적 모드로 바꾸더라도 같은 부품의 정보·기능은 유지한다.

### 2.1 앱 소개 컴포넌트 — 필수 이해 흐름

각 앱 소개는 **무엇을 넣는가 → 앱에서 무엇을 하는가 → 무엇을 얻는가 → 어디까지 지원하는가**에 답한다. 소개 문구와 화면을 같은 단계에 연결하고, 방문자가 직접 단계를 바꾸거나 실제 결과를 비교할 수 있게 한다. 모션을 보지 않아도 이 네 가지를 읽을 수 있어야 한다.

| ID·제품 | 설명용 컴포넌트 구성 | 방문자가 확인할 내용·행동 | 실제 근거·범위 |
|---|---|---|---|
| AC01 · PDF to MD | WorkflowDemo(Stepper) + ProductStage + ResultComparison(Base UI Tabs) | 공개 샘플 선택 → PDF 선택/변환 장면 → MD 원문·읽기 보기 → 저장 결과. 데스크톱 원본/결과 나란히, 모바일 탭, 실제 MD 복사·다운로드 | 같은 원본·앱 버전에서 얻은 실제 결과와 조건/제한. PDF/MD는 구조가 다르므로 겹치는 이미지 슬라이더로 비교하지 않음 |
| AC02 · Typecut | WorkflowDemo(Stepper) + FeatureExplorer(Base UI Tabs) + ProductStage | 같은 구간의 원본 영상·자막 → 실제 자막 편집 화면 → 편집 전/후 결과. 기능 선택 시 관련 화면·설명이 함께 전환 | 실제 앱에서 확인한 작업·내보내기 형식만 공개. 녹화/결과가 없는 기능은 설명용 초안이며 자동 편집·정확도·절약 시간을 연출로 증명하지 않음 |
| AC03 · 트랜스크라이브 그랩퍼 | WorkflowDemo(Stepper) + ScriptPreview + OutputPreview | 미리 확보한 예시 선택 → 스크립트 확보·확인 과정 → 저장된 파일 내용 확인. 확인된 샘플 텍스트는 실제 복사 가능 | 실제 지원 입력과 저장 형식에 맞춤. 방문자 URL을 실시간 수집하는 웹 기능·영상/음성 다운로드·AI 요약을 이 소개 작업으로 추가하지 않음 |

홈에서는 SpotlightCard로 앱별 목적·대표 결과·출시 상태를 비교하고, 각 제품의 작동 방식 구간으로 바로 이동하게 한다. 상세 페이지에서는 앱당 적어도 하나의 수동 조작 가능한 과정 컴포넌트와 실제 결과 확인 영역을 제공한다. 카드 hover·아이콘·제목 애니메이션만으로 이를 대체하지 않는다.

공통 구현 계약:

- WorkflowDemo는 React Bits Stepper의 로컬 adapter이며 앱의 처리 엔진이 아니다. 사전 검증된 샘플/녹화를 탐색한다는 사실을 표시한다. 단계를 누른 것을 '변환/추출 완료'로 표시하지 않는다.
- FeatureExplorer는 기능을 선택하면 대응하는 실제 화면·무엇이 달라지는지·제한이 바뀌는 탭이다. 장식 카드만 움직이거나 설명과 무관한 스크린샷을 반복하지 않는다.
- PDF S03 ScrollStory의 스크롤 서사는 유지한다. RB06은 S05 작동 방식의 수동 탐색에 배치하고, S04 결과 비교로 연결한다. 스크롤 pin과 Stepper가 같은 미디어를 동시에 제어하지 않는다.
- 단계에는 제목, 사용자 행동, 결과 설명, 실제 화면/녹화, 필요한 제한을 둔다. 캡처 위 주석은 웹의 설명용 표시임을 구별하고 실제 앱에 없는 버튼·기능을 그려 넣지 않는다.
- 제품별 demo manifest에 product/version, sample ID, 단계별 자산·유형(실제 캡처/녹화/결과/설명 그래픽), 출처·공개 권리·checksum, 입력/출력 형식, 확인된 제한을 연결한다. 제품 사실과 별개인 임의 mock을 공개 증거로 쓰지 않는다.
- 상태는 선택한 샘플·단계·보기 방식·미디어 로딩/실패로 제한한다. StatusMark는 실제 복사·다운로드 요청 결과에 연결하되, 다운로드 요청 성공을 로컬 저장 완료로 단정하지 않는다.
- 자동 단계 넘김은 기본 비활성이다. 처음/이전/다음/다시 보기와 단계 직접 선택을 제공하고 마지막 결과를 유지한다. 모든 단계 열람을 구매 버튼의 선행 조건으로 만들지 않는다.
- 모바일에서는 단계 버튼과 실제 내용이 잘리지 않게 세로로 구성한다. 키보드 조작·초점·현재 단계 이름·정적 HTML 요약을 제공하며, JS 실패/모션 감소에서도 입력·과정·결과·제한을 이해할 수 있어야 한다.
- 실제 자산이 없으면 내부 preview에서만 '설명용 예시'로 표시한다. 공개 시연·다운로드를 완성했다고 처리하지 않고 해당 제품의 자산 게이트를 미완료로 남긴다.

기능별 데이터와 페이지 구성을 달리하되 상태·접근성·실패 처리는 재사용한다. React Bits는 설명의 전개를 돕고, Base UI는 Tabs 등 조작의 기초를 맡는다. Molten Metal은 이 설명 컴포넌트 뒤의 장식으로만 사용한다.

## 3. 원본에서 확인한 사항과 필수 수정

### RB01 · Molten Metal

[검토 소스](https://github.com/DavidHDev/react-bits/blob/2ec034e04f9f8e2ca30335415d8834f468558f5b/src/ts-tailwind/Backgrounds/MoltenMetal/MoltenMetal.tsx) · [registry 의존성](https://github.com/DavidHDev/react-bits/blob/2ec034e04f9f8e2ca30335415d8834f468558f5b/public/r/MoltenMetal-TS-TW.json)

원본은 OGL Renderer/Program/Mesh/Triangle과 WebGL 2 셰이더를 사용하며 registry는 ogl@^1.0.11을 요구한다. DPR 상한 2, ResizeObserver, viewport 이탈/탭 숨김 시 RAF 중단, canvas 범위의 마우스 이벤트, 해제 시 observer/listener/RAF/context 정리가 이미 있다. 이를 없는 기능처럼 다시 구현하지 않고 유지·검증한다.

추가로 확인한 결함: lightMode가 props와 effect 의존성에 있으나 uLightMode uniform은 false로 초기화된 뒤 갱신되지 않는다. 밝은 모드를 지정하는 것만으로 의도한 셰이더 분기가 적용되지 않으므로 로컬 도입 시 u.uLightMode.value = lightMode를 연결하고 false/true 전환을 검수한다. 원본에는 사용자 일시 정지·prefers-reduced-motion·WebGL 실패 대안이 없다.

도입 시:

- 한 화면에서 활성 배경 canvas는 하나로 제한한다. hero 높이를 예약하고 OGL은 클라이언트 장식층에서 분리 로드한다. 제목·CTA·제품 시연의 SSR/로딩을 기다리게 하지 않는다.
- 원본의 가시성 중단에 사용자 정지·모션 감소 조건을 결합한다. speed=0만 설정하면 RAF가 계속 돌므로 정지 기능으로 취급하지 않는다. 일시 정지 시간은 애니메이션 시간에서 제외해 복귀 시 갑자기 장면이 뛰지 않게 한다.
- DPR은 desktop 최대 2, mobile 초기 목표 1–1.5, 렌더링 초기 목표 최대 30fps로 측정·조정한다. 품질 조절은 로컬 adapter 기능이며 원본에 없는 fps/dpr props가 있다고 가정하지 않는다.
- JS off·reduced-motion·WebGL 2 미지원·초기화/셰이더 실패·context loss에서는 정적 은빛/녹색 배경 또는 검수된 Molten Metal 정지 이미지를 유지한다. 성공 프레임 이후에만 정적층을 교체하며 실패/반복 복구가 CTA를 가리거나 무한 재시작하지 않게 한다.
- canvas는 aria-hidden, 장식층은 pointer-events:none으로 링크·탭·스크롤·텍스트 선택을 방해하지 않는다. 기본 mouseInteraction:false; 필요 시 hero wrapper의 제한된 포인터 입력으로 연결하고 키보드/터치에 기능 차이를 만들지 않는다.
- 미술 초기안: lightMode:true, backgroundColor #F7F8F5, color1 #174D3C, color2 #7E8F84, color3 #FFFFFF, colorMode:molten, speed 0.15, detail 3, grain:false, opacity 0.5. hexToRgb가 6자리 hex만 해석하므로 CSS 변수 이름을 그대로 전달하지 않고 해석된 토큰 값을 쓴다. 값은 시각 비교 전 제안이며 금속의 유동감이 실제로 보이도록 조정한다.
- 본문·결과 뷰어에는 안정적인 밝은 표면을 두고 필요한 곳에 scrim을 추가한다. 금속의 밝기 변화가 텍스트·focus 대비를 흔들지 않게 검수한다. 결제/계정/긴 본문에 배경을 반복하지 않는다.

### RB02 · AnimatedContent

[검토 소스](https://github.com/DavidHDev/react-bits/blob/2ec034e04f9f8e2ca30335415d8834f468558f5b/src/ts-tailwind/Animations/AnimatedContent/AnimatedContent.tsx)

원본은 GSAP/ScrollTrigger를 사용하며 초기 렌더에 invisible class가 있다. 그대로 넣으면 JS나 모션 초기화가 실패할 때 자식 콘텐츠가 보이지 않을 수 있다.

도입 시:

- 초기 서버 HTML은 visible이다. 필요한 장식 미디어에만 초기화 후 움직임을 적용한다.
- 텍스트·가격·지원·CTA를 불투명도 0으로 기다리게 하지 않는다. animateOpacity:false 또는 항상 보이는 콘텐츠와 분리된 장식층을 사용한다.
- distance 16 이하, duration 약 0.48초, scale 0.98, disappearAfter 0을 시작점으로 삼는다.
- reduced-motion에서는 위치/scale 변환을 제거한다. 의존성 변경·라우트 전환·Strict Mode에서 생성한 timeline/trigger/tween을 자기 범위만 정리한다.
- S03의 대표 4단계 ScrollStory는 기존 GSAP scrub/pin 서사를 유지한다. AnimatedContent를 반복해서 모든 구간의 모션을 대신하지 않는다.

### RB03 · StatusMark

[검토 소스](https://github.com/DavidHDev/react-bits/blob/2ec034e04f9f8e2ca30335415d8834f468558f5b/src/ts-tailwind/Micro/StatusMark/StatusMark.tsx)

원본은 motion/react의 animate/useMotionValue/useReducedMotion을 사용한다. 기본 성공 상태에는 취소선과 낮아진 글자 opacity가 있고, 보조기기용 영문 상태 문자열을 포함한다. reduced-motion에서도 running 상태의 숨쉬기 CSS가 남아 있다.

도입 시:

- 제품 링크 복사는 clipboard 쓰기 성공/실패를 기준으로 표시한다. 실제 MD가 확보되면 같은 동작을 결과 비교에도 적용한다.
- 동기적으로 한국어 상태 텍스트를 먼저 갱신하고 장식 마크를 함께 표시한다. 원본 영문 낭독·중복 live announcement는 제거한다.
- strike:false, GRDS status 색, 충분한 글자 대비를 적용한다. 취소선으로 '구매 완료'를 지우지 않는다.
- reduced-motion은 숨쉬기/회전까지 없는 정적 마크로 만든다. 무한 진행은 화면 밖·background에서 정지한다.
- 실제 진행률이 없으면 숫자 progress를 만들지 않는다. 결제 성공은 서버 검증 뒤에만 done으로 표시한다.
- 웹 시연의 복사 성공 표시를 PDF 변환 완료·앱 성능 증거처럼 사용하지 않는다.

### RB04 · SpotlightCard

[검토 소스](https://github.com/DavidHDev/react-bits/blob/2ec034e04f9f8e2ca30335415d8834f468558f5b/src/ts-tailwind/Components/SpotlightCard/SpotlightCard.tsx)

원본은 React/CSS로 구성되며 포인터 위치를 mousemove마다 React state에 쓴다. 기본 dark 표면과 색은 GroundRooted 기본 테마와 다르다. wrapper의 focus handler가 카드 자체의 접근 가능한 링크 역할을 만들어 주지는 않는다.

도입 시:

- GRDS raised 표면·border·radius·accent로 바꾼다. 포인터 좌표는 ref+CSS 변수로 제한된 frame에 반영한다.
- 카드의 실제 이동은 Next Link/anchor가 담당한다. nested link/button을 만들지 않고 각 제품 제목을 링크 이름으로 사용한다.
- 키보드 focus에서도 일정한 강조와 outline이 보이며, 터치에서는 기본 정보·링크를 항상 제공한다.
- 장식 overlay는 pointer-events:none, 읽기 순서/선택/텍스트 대비를 유지한다.

### RB05 · SplitText

[검토 소스](https://github.com/DavidHDev/react-bits/blob/2ec034e04f9f8e2ca30335415d8834f468558f5b/src/ts-tailwind/TextAnimations/SplitText/SplitText.tsx)

원본은 GSAP SplitText/ScrollTrigger/@gsap/react를 사용하고 폰트 준비 뒤 분할한다. 기본은 글자별 opacity 0/y 40의 긴 애니메이션이며 자체 reduced-motion 분기는 없다.

도입 시:

- SSR에 원래 한글 텍스트를 남긴다. h1 전체를 지연 로딩하거나 처음에 숨기지 않는다.
- words 또는 lines 단위를 기본으로 하고 한글 음절·어절이 부자연스럽게 쪼개지지 않는지 확인한다.
- 첫 화면 강조 문구는 opacity 1을 유지하고 y 12 이하, 전체 약 600–800ms 이내의 전개로 조정한다. 긴 문장에는 단어마다 50ms씩 무한히 지연을 더하지 않는다.
- 폰트 실패·느린 폰트·resize에도 본문 가시성·줄바꿈·선택·낭독이 유지된다.
- reduced-motion에서는 원문 그대로이며 split/움직임이 필요 없다. GSAP 인스턴스·trigger는 자기 handle로 정리하고 다른 story의 trigger를 제거하지 않는다.

### RB06 · Stepper

[검토 소스](https://github.com/DavidHDev/react-bits/blob/2ec034e04f9f8e2ca30335415d8834f468558f5b/src/ts-tailwind/Components/Stepper/Stepper.tsx) · [registry 의존성](https://github.com/DavidHDev/react-bits/blob/2ec034e04f9f8e2ca30335415d8834f468558f5b/public/r/Stepper-TS-TW.json)

원본은 motion/react를 사용하며 registry는 motion@^12.23.12를 요구한다. 기본 단계 선택은 클릭 가능한 motion.div이고, 콘텐츠 부모 높이는 0에서 시작해 useLayoutEffect로 측정한다. 마지막 Complete 버튼은 마지막 결과를 접어 없앤다. 기본 이전/다음/완료 문구는 영문이고 reduced-motion 분기가 없다. 가입 마법사의 원본 동작을 앱 소개에 그대로 사용하지 않는다.

도입 시:

- WorkflowDemo adapter에서 renderStepIndicator를 사용해 이름 있는 button type=button, 현재 단계 aria-current=step, 표시 패널 연결, 44px 이상 조작 영역과 focus-visible을 제공한다. 완료 체크는 실제 앱 작업 완료가 아니라 열람 상태이며 상태를 혼동시키면 숫자만 표시한다.
- 처음/이전/다음/다시 보기 문구를 한국어로 통일한다. 마지막 단계에서 결과를 숨기거나 가짜 성공 callback을 호출하지 않는다. 사용자 선택은 유효한 1…N 단계로 제한한다.
- 서버 HTML에는 읽을 수 있는 전체 과정 요약과 첫 실제 화면을 둔다. height:0/absolute 초기 레이아웃을 고쳐 JS 실패에도 내용이 사라지지 않게 한다. 비동기 이미지·폰트·resize·확대 후에도 잘림/CLS가 없도록 크기를 예약하고 재측정한다.
- 단계 전환에서 사라지는 콘텐츠에 키보드 초점이 남지 않게 하고, 현재 단계 제목/번호를 한 번만 알린다. 콘텐츠 탐색과 CTA 이동을 막지 않는다.
- reduced-motion은 slide/spring/선 채움/체크 그리기를 제거하고 즉시 전환한다. 기본 전환은 작은 거리로 제한하며 매번 텍스트를 긴 페이드로 숨기지 않는다.
- StatusMark와 동일한 잠금 Motion 버전을 재사용하고, GSAP ScrollStory와 다른 DOM/상태를 소유한다. 로딩 실패에는 설명·실제 정지 화면·재시도를 제공한다.

## 4. 의존성·소스 관리

| 책임 | 사용 기술 | 분리 규칙 |
|---|---|---|
| 대표 스크롤·텍스트·미디어 | GSAP, ScrollTrigger, SplitText, @gsap/react | 필요한 plugin만 import; 페이지/가시성 기준 로드 |
| Molten Metal 배경 | OGL, WebGL 2; registry ogl@^1.0.11 | 실제 설치 버전 고정; 장식 client chunk·단일 활성 canvas·정적 대안 |
| Micro 상태·앱 과정 탐색 | motion/react; Stepper registry motion@^12.23.12 | StatusMark/Stepper에 한정해 동일 버전 재사용; GSAP과 같은 DOM 속성 중복 제어 금지 |
| SpotlightCard·기본 상태 | React·CSS 변수 | 불필요한 per-frame React render 제거 |
| 폼·Dialog·Tabs·Accordion | Base UI + GRDS | React Bits의 시각 효과와 접근 가능한 동작 기초를 결합 |

기존 'GSAP 하나' 규칙은 대표 모션의 기본 엔진으로 유지하되, **Micro와 앱 소개 Stepper의 공식 소스에 필요한 Motion, Molten Metal에 필요한 OGL을 허용한다.** 동일 요소·동일 속성은 한 엔진이 소유한다. 페이지 전체를 motion/react로 감싸지 않는다. 교체한 배경만을 위해 InertiaPlugin을 가져오지 않는다.

도입 위치는 components/react-bits, 제품용 adapter는 components/marketing 또는 components/account로 나눈다. 각 부품에 source URL, commit SHA, 원본 path, variant, checksum, 외부 dependency, 로컬 변경점, 라이선스 위치를 기록한다.

검토 commit에서 StatusMark의 TS-TW 원본은 존재하지만 public/r/StatusMark-TS-TW.json은 찾지 못했다. 동작하지 않는 registry 명령을 문서에 확정하지 않는다. 구현 시 재확인하고 필요하면 고정 commit의 원본을 직접 도입한다. 검증하지 않은 npx latest 명령으로 소스를 덮어쓰지 않는다.

React Bits 전체 사이트/쇼케이스 패키지를 설치하지 않고 선정한 부품 소스와 필요한 의존성만 사용한다. 원본 import를 임의로 지우고 동작을 축소했다면 변경 이유와 시각 검증을 남긴다.

## 5. 라이선스 기록

검토 commit의 [LICENSE.md](https://github.com/DavidHDev/react-bits/blob/2ec034e04f9f8e2ca30335415d8834f468558f5b/LICENSE.md)는 MIT + Commons Clause이며 앱·웹사이트·제품의 일부 사용과 저작권 고지 보존을 명시하고, 컴포넌트 자체의 판매·재배포를 제한한다. 일반 MIT라고만 기록하지 않는다.

GroundRooted 웹사이트에 포함하는 용도로 도입하며, 원본 고지는 THIRD_PARTY_NOTICES와 해당 소스 옆에 보존한다. React Bits Pro 자산·템플릿·라이선스는 이번 무료 공개 소스와 구분한다. Pro 구매나 계정 변경을 수행하지 않는다.

GSAP/Motion/OGL과 직접 가져오는 플러그인·자산의 조건도 실제 잠금 버전 기준으로 기록한다. 제품 UI 통합 권한과 별도 컴포넌트 라이브러리 재판매 권한을 혼동하지 않는다.

## 6. 성능·접근성 완료 기준

기존 초기 JS gzip 250KB/전체 초기 1MB 예산을 유지하면서 실제 적용 결과를 측정한다. 라이브러리 이름만으로 '가볍다'고 판정하지 않는다. 초과하면 import·범위·로드 시점·원본 구현을 최적화하고 다섯 범주의 요구는 유지한다.

| 검사 | 통과 증거 |
|---|---|
| 다섯 범주 적용 | 실제 route/section·도입 소스·렌더링 기록이 각각 존재 |
| 앱 소개 이해 | AC01–AC03에서 입력→과정→결과→제한을 설명할 수 있고 단계 선택·결과 비교가 실제 자산과 대응 |
| 원본과 수정 추적 | 고정 SHA/variant/checksum·변경점·라이선스 |
| 첫 화면 | h1·설명·CTA가 JS off/지연/초기화 실패에도 보임 |
| 키보드·터치 | 제품 링크·복사 동작·focus·aria 상태가 실사용 가능 |
| 모션 감소 | pin·이동·scale·장식 회전/숨쉬기 제거, 정보 동일 |
| 배경 중지 | viewport 이탈·탭 background·사용자 정지에서 RAF/tween 비용 중단 |
| Molten Metal | 밝은 모드 실제 반영, WebGL 실패/context loss의 정적 대안, 수동 정지·복귀, 텍스트 대비·단일 canvas |
| 과정 탐색 | 단계 버튼 키보드 접근·현재 단계 안내, 마지막 결과 유지, 이미지/폰트 지연·JS off에서 내용 보존 |
| 수명 관리 | Strict Mode·resize·라우트 왕복 후 duplicate listener/trigger·메모리 누적 없음 |
| 상태 정합성 | 실제 복사/서버 결과만 성공, 거래 상태와 모션 상태가 분리됨 |
| 한글 | 폰트 실패·줄바꿈·확대·선택·스크린리더에서 문장 보존 |
| 크기·성능 | production mobile/desktop 전송 크기·3회 Lighthouse·브라우저 trace |

Storybook에는 여섯 React Bits 부품과 AC01–AC03 조합의 기본/긴 한글/mobile/reduced-motion/실패 상태를 등록한다. 주문·라이선스 fixture는 합성 데이터만 사용한다. 제품 시연 fixture와 실제 공개 증거는 구분한다. 운영 화면에 제품 설명용 모션을 무조건 반복하지 않는다.

## 7. 작업 순서

1. M2에서 고정 소스 도입·고지·GRDS adapter·정적 fallback을 먼저 만든다.
2. RB04의 제품 카드와 RB03의 실제 링크 복사 상태를 공개 페이지 동선에 연결한다.
3. AC01–AC03의 실제 자산을 연결하고 RB06 과정 탐색·결과 비교를 구성한다. RB05·RB02를 제목·대표 미디어에 적용하고 RB01을 hero에서 조정한다.
4. S03 고유 스크롤 story와 동시에 실행될 때 엔진·가시성·CPU 예산을 검사한다.
5. M3에서 다섯 범주의 실제 화면·키보드·모션 감소·실패·성능 증거를 T25에, 세 앱의 소개 동선과 실제 결과 대조를 T26에 남긴다.
6. M4–M6에서는 검증된 StatusMark adapter를 계정·주문·다운로드의 실제 상태에도 재사용한다.

현재 완료한 것은 적용 계획과 원본 소스 검토다. 위 부품을 저장소의 실제 웹 화면에 도입·빌드·실행한 것은 아니다.
