# Emil · Taste · Figma MCP · Playwright 적용

## 설치와 연결을 구분한다

| 요청 | 원본 / 설치 경로 | 현재 상태 |
| --- | --- | --- |
| emilkowalski | https://github.com/emilkowalski/skills / ~/.codex/skills/emil-design-eng | 설치 및 지침 적용 |
| Taste | https://github.com/Leonxlnx/taste-skill / ~/.codex/skills/taste-skill (`design-taste-frontend`) | 설치 및 지침 적용 |
| Figma MCP | openai/skills의 figma, figma-implement-design | 두 스킬 설치, 공식 원격 MCP 등록 |
| Playwright | ~/.codex/skills/playwright | 기존 설치 보존, 실제 Chromium 검수에 사용 |

공식 skill-installer로 설치했다. 조회 시점 main SHA: Emil `85e8e2363b713506e1d5b6e07a0eb2da66be1bc3`, Taste `5217fb45be2c0b302f29c9cd31cbd3237501c684`, OpenAI skills `49f948faa9258a0c61caceaf225e179651397431`. 설치 후 조회한 main이므로 엄밀한 설치 아카이브 체크섬은 아니다. 기존 스킬을 덮어쓰지 않았다. 새로운 스킬은 다음 턴부터 자동 검색 대상으로 사용할 수 있고 이번 턴에는 본문을 직접 읽었다.

Figma 서버는 `codex mcp add figma --url https://mcp.figma.com/mcp`로 등록했다. OAuth는 사용자 승인 없이 시간 초과됐다. **계정 연결과 디자인 읽기는 미완료**다. `codex mcp login figma`로 승인하고 정확한 프레임 링크를 제공해야 Figma 기반 구현을 할 수 있다. 이 페이지를 Figma에 업로드하거나 원격 파일을 만들지 않았다.

## 재설계 전 점검

- 모드: 브랜드와 경로 보존형 재구성. `/pdf-to-md`, 주요 메뉴·앵커, HQ 보호 유지.
- 기존 색: 흰 바탕, #1657e8 CTA, #17191e 본문. Pretendard 자체 제공, 24px 패널, GroundRooted 로고 유지.
- 기존 구성: 중앙 대형 제목, 정적인 변환 개념도, 영문 번호 섹션, 고정 스크롤 이야기, 균등 3카드, EPUB/MD 체험, 단계별 예시, FAQ.
- 보존: 로컬 OCR → EPUB / MD+images 제품 설명, 샘플/실제 결과 구분, 조작 체험, 키보드·모션 감소·오류 처리.
- SEO: noindex 제작 미리보기 유지. 공개 검색 순위·운영 전환에 관한 주장 없음. 제목은 제품 의미를 유지하며 구분자만 정리.
- 기존 화면: `output/playwright/taste-before.png`. 새 기준 6/3/3은 구성 변화는 분명히 하되 장식 모션과 정보 밀도를 줄인다.

## 적용 판단

| Before | After | Why |
| --- | --- | --- |
| 정적 개념도 아래로 스크롤해야 체험 | 첫 화면에서 글자 크기 조절 | 핵심 장점이 직접 작동 |
| 영문 섹션 번호와 반복 소제목 | 간결한 제목과 세로 설명 | 읽기 흐름과 한국어 정보 위계 |
| 동일한 카드 세 칸 | 큰 카드 + 작은 카드 두 칸 | 기능별 중요도와 시각 리듬 |
| ScrollTrigger pin/scrub | 서버 렌더링 과정 설명 | 키보드/스크롤을 가로채지 않음 |
| 키보드에도 단계 애니메이션 | 키보드 즉시, 클릭 180ms | 입력에 즉각 반응 |
| 제목 600ms/진입 480ms | 240ms 짧은 진입 | 과도한 연출 축소 |

React 성능 지침에 따라 새 상태는 HeroReader 클라이언트 컴포넌트에 한정했다. 과정 설명은 서버 컴포넌트로 전환해 ScrollTrigger 로딩·리스너·상태 갱신을 제거했다. Stepper는 대기 exit 없이 새 결과를 즉시 표시한다.

## 사용자 규칙에 따른 스킬 예외

- 그림자·호버·장식 외곽선 금지는 스킬의 일반적인 shadow/hover 권장보다 우선한다. 포커스 표시와 의미 있는 SVG 선은 유지한다.
- CleanShot의 밝은 방향을 보존하며 다크 모드를 임의 추가하지 않는다. Molten Metal은 사용자 지정이므로 모션 3의 정적 기본값에 대한 제한된 예외다. 정지/감소/비가시 중단은 유지한다.
- 현재 결과 시각화는 동작하는 브라우저 컴포넌트와 명시된 설명용 자료다. Taste의 일반 이미지 생성 권장보다 사용자가 요청한 기능 설명을 우선했다. 실제 앱 화면·변환 결과·Higgsfield 생성물로 오인시키는 이미지는 만들지 않았다.
- 기존 Lucide 패밀리, FAQ의 품질/네트워크/AI 사용 조건, 기능 조작 번호는 유지한다. 일반 마케팅 카드와 실제 단계 탐색을 구분한다.
- Taste 적용 범위는 소개 페이지다. HQ·서버·DB·결제·고객 인증을 재설계하지 않는다.

## 검증

검증 결과는 아래에 추가한다. 배포·commit·push 없음. 실기기 및 Figma 대조는 수행하지 않았다.

- 최종 Node 24 typecheck / production build / git diff --check 통과.
- Playwright Chromium desktop/mobile에서 EPUB 및 MD 탭 axe 검사 위반 0. 최종 모바일 배경 변경 후에도 재검사 0. 전체 WCAG 인증 또는 실기기 보조기술 검수는 아니다.
- 320/390/768/1024/1440px 문서 scrollWidth = clientWidth. 새 리더 28px 및 최대값 버튼 비활성화·초기화 확인. MD 사진 선택 시 photo-01.svg 연결 확인.
- 키보드 Stepper 전환 시 실행 중 애니메이션 0, 클릭 후 최종 파일 목록 표시, 모바일 메뉴 열기/Escape/포커스 복귀 확인.
- 대표 CTA hover 전후 computed style 동일. 일반 DOM에서 box/text/drop shadow 및 상단 border 발견 0. 내부 앵커 누락 0. reduced-motion 적용 시 canvas 제거와 transition 0s 확인.
- 모바일에서는 초기 canvas 0, `배경 재생` 클릭 후 WebGL ready, 정지 후 aria-pressed=true 확인. 사용자 지정 Molten Metal을 제거하지 않고 초기 모바일 실행을 선택형으로 바꿨다.
- HQ와 유사 경로 307 로그인 보호, 미리보기 200/noindex 유지.
- 실제 화면 캡처: `taste-hero-desktop.png`, `taste-features-desktop.png`, `taste-mobile-final.png` (output/playwright).
- Lighthouse 모바일 시뮬레이션 단일 측정: 변경 전 성능 47 / 접근성 100 / 권장사항 100, LCP 5.5s, TBT 1380ms, CLS 0. 모바일 배경 선택형 후 성능 77 / 접근성 100 / 권장사항 100, LCP 4.4s, TBT 0ms, CLS 0. 네트워크/CPU 제한 모드의 로컬 측정이며 필드 데이터가 아니다. **LCP <2.5s 목표는 미달**, 폰트·렌더링 차단 CSS·초기 전달량 추가 개선이 남았다. INP는 측정하지 않았다.
- Lighthouse 첫 실행은 기존 npm 캐시의 EACCES로 실패했다. 전역 권한을 변경하지 않고 독립 임시 캐시로 실행했다.
- Taste 사전 점검의 사용자 규칙 예외는 위 절에 명시했다. 성능 목표·실제 앱 이미지·Figma 대조가 미완료이므로 전 항목 완료 또는 출시 준비 완료로 표시하지 않는다.

최종 미리보기: http://127.0.0.1:3027/pdf-to-md
