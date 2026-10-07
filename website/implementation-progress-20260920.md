# PDF to MD — 첫 페이지 구현 기록

날짜: 2026-09-20 (KST). 범위: 로컬 B01 시안 및 기능 구현. 전체 사이트 출시 완료 아님.

최신 후속 작업(2026-09-22): [Emil·Taste 재구성/설치 및 Figma 연결 상태](skill-redesign-20260922.md). 현재 디자인 정본은 DESIGN.md 2.1, 최신 로컬 미리보기는 3027 포트다. 아래는 이전 검수 기록이다.

## 최신 변경: CleanShot 참조와 효과 금지

- 공식 CleanShot 페이지의 데스크톱·모바일 화면을 분석해 밝은 바탕, 파란 CTA, 큰 제목, 대형 제품 시연과 파스텔 기능 카드로 변경했다. [분석 기록](cleanshot-reference-review-20260920.md), [현재 디자인 시스템 2.0](../DESIGN.md)을 기준으로 한다. 아래 Raycast 관련 내용은 이전 구현 기록이다.
- 그림자·hover CSS·장식 외곽선을 제거하고 SpotlightCard의 pointer 처리와 glow도 제거했다. 키보드 포커스와 정보성 아이콘/도표의 선은 유지한다. Molten Metal은 밝은 청색으로 조정했다.
- 기존 Raycast DESIGN.md와 테마는 `website/archive/`에 보존했다. 제품 설명·EPUB/MD+이미지 체험·HQ 보호는 유지했다. frontend-design 지침은 시연 중심 구성에, React 성능 지침은 불필요한 pointer 처리를 제거하는 데 반영했다.
- 최종 TypeScript 검사·production build·diff 공백 검사 통과. Chromium 데스크톱/모바일 EPUB 및 MD 탭의 axe 자동 검사 위반 0. 이는 수동 보조기술 검사나 전체 WCAG 인증이 아니다.
- 320/390/768/1024/1440px에서 문서 가로 넘침 없음. 모바일 EPUB 28px 본문도 가로 넘침 없음. 사진/양식 참조와 미리보기 연동, 모바일 메뉴 열기·Escape 닫기·포커스 복귀·링크 클릭 후 닫힘을 확인했다.
- 대표 버튼/카드의 hover 전후 computed style이 동일하고 그림자·장식 border가 없음을 확인했다. 로컬 미리보기 200/noindex, HQ와 유사 경로 307/login 보호를 재확인했다.
- 최종 캡처: `output/playwright/cleanshot-final-md-desktop.png`, `cleanshot-final-mobile.png`. 외부 배포·commit·push·Higgsfield 재생성은 하지 않았다.

## 후속 변경: EPUB·이미지 연결 강조

- 사용자 제공 제품 특징에 따라 [제품 서사](pdf-product-story-20260920.md)를 추가했다. 핵심은 로컬 OCR → 사람이 읽는 EPUB / AI가 활용할 MD + 별도 이미지 폴더다.
- 히어로·워크플로·카드·FAQ를 바꾸고 `ReadingExperience`에 두 가지 직접 조작 예시를 구현했다. PDF/EPUB 예시는 같은 본문을 사용한다. 글자 크기 16–28px, 실제 본문 재배치, 그래프/사진 영역/양식 참조와 폴더 선택의 양방향 연동을 확인했다.
- 추가 변경 typecheck/production build 통과. Chromium 데스크톱 EPUB/MD 탭, 모바일 MD 탭 axe 자동 검사 위반 0. MD 탭에서 320/390/768/1024/1440px 가로 넘침 없음. 그래프·사진·양식 선택 및 키보드 Enter 동작 확인.
- 최종 모바일 EPUB 28px에서도 axe 위반 0, 본문 가로 넘침 없음. 320px 체험 탭의 scrollWidth = clientWidth 확인. 최종 뷰포트 캡처로 모바일 리더/MD 탭과 데스크톱 MD 연결 화면을 직접 확인했다. SVG 3종 HTTP 200, HQ/유사 경로 307 보호, 내부 링크 누락 0 확인.
- `output/playwright/epub-md-hero.png`, `epub-reader-large.png`, `md-linked-images.png`, `md-images-mobile.png`는 개발 중 캡처. 최종 상태 캡처는 후속 `epub-final-*` 파일을 사용한다. element screenshot의 fixed nav/skip-link 합성 위치는 실제 뷰포트 레이아웃과 구별한다.
- Higgsfield GPT Image 2 16:9/2k 이미지 생성 요청은 크레딧 부족(`not_enough_credits`)으로 거부됐다. **생성 이미지/영상은 아직 없음**. 웹사이트의 개념도·SVG는 직접 제작한 설명용 자료이며 실제 PDF 추출 결과나 Higgsfield 결과로 표시하지 않는다. 프롬프트는 위 제품 서사 문서에 보존했다.

## 이전 사용자 결정과 기준: Raycast 단계

- 최신 디자인: 사용자가 `npx getdesign@latest add raycast`로 추가한 루트 `DESIGN.md`. 파일을 수정하지 않고 기준으로 사용했다.
- 다크 전용 표면(#07080a/#0d0d0d/#101111/#121212), 흰 주요 CTA, 헤어라인, 8–16px 모서리, 카드 그림자 제거, 96/64/48px 섹션 간격. Inter(ss03) + 한글 Pretendard를 패키지에서 자체 제공한다.
- GroundRooted 브랜드 유지. Raycast 로고/스크린샷은 복제하지 않았다. 붉은 사선은 히어로 한 곳만 사용한다.
- Molten Metal은 실제 React Bits shader를 유지하고 어두운 중성 금속 팔레트로 조정했다. 수동 정지, reduced motion, 뷰포트/탭 가시성, WebGL 실패 대안을 포함한다.
- frontend-design 스킬은 구성·타이포·실제 화면 검수를, React 성능 지침은 동적 로딩·pointer ref 처리를, Playwright 스킬은 브라우저 조작 검증을 안내했다. 사용자 Raycast 지정이 일반적인 스타일 취향보다 우선한다.
- 실제 세션의 정확한 모델/추론 설정은 검증 불가. Astra High/xHigh로 자동 전환됐다고 기록하지 않는다. 하위 에이전트/독립 검수는 실행하지 않았다.

## 구현

- `/pdf-to-md`: 서버 렌더링 제품 소개, sticky 메뉴, 히어로, 스크롤 이야기, 결과 비교, 3단계 설명, 활용 카드, 지원/판매 준비 안내, FAQ.
- React Bits: MoltenMetal / AnimatedContent / StatusMark / SpotlightCard / SplitText / Stepper. 고정 upstream revision과 수정 내역은 `components/react-bits/PROVENANCE.md`, 원본 참조는 `website/vendor/react-bits/`.
- Base UI Tabs, 두 종류 샘플, 원문/읽기 전환, 클립보드 성공/거부 상태, 실제 Markdown 파일 다운로드, 단계 직접 선택/이전/다음/다시 보기.
- 설명용 fixture는 `products/pdf-demo.ts`. 실제 앱 출력/업로드/변환 서비스가 아니다. 근거 없는 지원 OS·가격·서버 처리 정책을 기재하지 않았다.
- 테마는 `#gr-site`로 범위를 제한했다. 기존 HQ `/`, 서버 데이터·DB·Stripe collector는 변경하지 않았다.
- 런타임: Node 24.21.0 / pnpm 11.20.0 / Next 16.3.5 / React 19.3.0. package-lock을 pnpm-lock으로 전환했다. Next 16 규약에 따라 `middleware.ts`를 `proxy.ts`로 옮겼다.
- `/pdf-to-md`만 개발 모드 또는 명시적 `MARKETING_PREVIEW_ENABLED=true`에서 로그인 없이 열며 noindex 헤더/메타를 제공한다. HQ 보호는 유지한다. 공개 출시 설정이 아니다.

## 확인한 증거

- Node 24에서 frozen-lockfile 설치, TypeScript 검사, 프로덕션 빌드 통과.
- Chromium 데스크톱 1440px/모바일 390px 화면 캡처 직접 확인. `output/playwright/raycast-desktop.png`, `raycast-mobile.png`, `raycast-results.png` (로컬 산출물, Git 제외).
- axe-core 4.13.0, WCAG 2 A/AA·2.1 AA 및 best-practice 자동 검사: 데스크톱/모바일 각 위반 0. 전체 WCAG 준수 인증이나 수동 보조기술 검수 완료를 뜻하지 않는다.
- 320/390/768/1024/1440px에서 document scrollWidth = clientWidth, 가로 넘침 없음.
- 탭 클릭·키보드 화살표, meeting 샘플 교체, 클립보드 실제 텍스트, `meeting-note.md` 다운로드 이름/내용 확인. 클립보드 거부를 주입했을 때 실패 안내 확인.
- Stepper 1→2→3→다시 보기, 마지막 단계 유지 확인. FAQ Enter 키 열기, 모든 내부 anchor 대상 존재 확인.
- MoltenMetal `data-state=ready`, 정지/재생 토글, ScrollStory pin 및 마지막 장면 탐색 확인. reduced-motion으로 전환하면 canvas가 제거되고 pin이 해제됨을 확인.
- JS 비활성 컨텍스트에서도 제목·모든 단계 설명을 읽을 수 있음. WebGL 생성 실패를 주입한 컨텍스트에서도 정적 대안과 본문 유지.
- HTTP 접근 경계: 미리보기 200/noindex, HQ 및 비슷한 다른 경로는 307/login (기존 인증 기능 전체 검수 아님).

## 남은 게이트

- 사용자 시각 확인과 별도 독립 검수 후 기준 고정. 홈/Typecut/그랩퍼로 아직 확장하지 않음.
- 실제 앱 화면·실제 입력/출력 쌍·앱 버전·지원 정책이 필요하다. 실제 자산이 없으므로 AC01/T26 완료로 처리하지 않는다.
- Lighthouse 반복 성능 측정·실기기 Safari·스크린리더·전체 보안/운영 테스트는 미수행. T01–T26/M0–M7 전체 완료 아님.
- 고객 인증/결제/라이선스/메일/원격 DB 변경 없음. 배포·commit·push 없음.

## 로컬 미리보기

`http://127.0.0.1:3026/pdf-to-md`

Node 24에서 `pnpm install --frozen-lockfile`, `pnpm build` 후 로컬 전용 DASHBOARD_PASSWORD와 `MARKETING_PREVIEW_ENABLED=true`를 지정해 `pnpm exec next start --hostname 127.0.0.1 --port 3026`로 실행한다. 기존 운영 비밀번호나 원격 DB 자격증명을 새로 입력할 필요가 없다.
