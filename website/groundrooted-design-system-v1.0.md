# GroundRooted Design System 1.0

> 이전안 보관 문서. 2026-09-20 최신 사용자 변경으로 [디자인 시스템 2.0](groundrooted-design-system-v2.0.md) / 루트 [DESIGN.md](../DESIGN.md)의 **CleanShot 참조**가 우선한다. 그림자·호버 효과·장식 외곽선은 금지한다. 아래 녹색/밝은 테마 및 중간 Raycast 토큰은 현재 구현 기준이 아니다. 활성 테마는 `app/pdf-to-md/cleanshot.css`다. 제품 사실·보안·접근성 기준은 유지한다.

**작성일: 2026-09-19 · 상위 기준: GroundRooted 통합 설계서 v1.3**

**구현 보완:** [구현·운영 계획 1.0](groundrooted-implementation-plan-v1.0.md)의 5–6절과 12·15절을 함께 적용한다. 기존 시각 토큰은 유지하고 공개/개인 캐시 경계, 오류·대기 상태, 키보드·확대·모션 실패 대안, 성능 측정·인수 증거를 보완했다. 웹 화면이나 Figma/Storybook을 구현 완료했다는 뜻은 아니다.

**React Bits 필수 적용:** 사용자 요구에 따라 Molten Metal(Backgrounds), AnimatedContent(Animations), StatusMark(Micro), SpotlightCard·Stepper(Components), SplitText(Text Animations)를 이 토큰에 맞춰 적용한다. 앱 소개는 단계 탐색·실제 화면·결과 비교로 입력→과정→결과를 이해하도록 구성한다. [별도 적용 계획](groundrooted-react-bits-plan-v1.0.md)의 RB01–RB06·AC01–AC03, 소스 수정·엔진 분리·접근성/성능 기준을 따른다.

제품마다 독립된 `/<slug>` 페이지를 만들되 브랜드·계정·구매 경험은 일관되게 유지하기 위한 디자인 시스템 명세다. 첫 적용 대상은 `/pdf-to-md`다. 실제 화면·코드·Figma·Storybook을 제작한 파일이 아니다.

이 파일은 통합 설계서의 20절과 관련 구현·검수 기준을 발췌한 재사용용 문서다. 앞으로 변경할 때는 상위 기준과 함께 개정하고 서로 다른 토큰 값을 따로 유지하지 않는다. 외부 링크의 제품별 초기 벤치마크는 상위 설계서 18절을 참조한다.

## 20. GroundRooted Design System 1.0

### 20.1 시스템의 목적과 언어

**핵심 인상: 차분한 전문성, 분명한 제품 가치, 읽을 수 있는 실제 화면, 예측 가능한 구매 경험.**

디자인 시스템은 색상표만이 아니라 색·서체·간격·컴포넌트·반응형·모션·상태·문구·검수 규칙을 묶은 계약이다. 사용자는 제품을 바꿔도 로그인·구매·관리 방법을 다시 배울 필요가 없어야 한다.

브랜드와 고객 계정은 같은 규칙을 사용한다. 제품별로 변경할 수 있는 것은 아이콘·강조색·시연 자료·제품 카피·대표 장면이다. 제품별 가격과 라이선스 상태의 의미, 버튼 높이, 글자 체계, 접근성 규칙은 바꾸지 않는다.

### 20.2 토큰 구조와 기준본

```text
Primitive                     Semantic                     Component
색상·크기 원값           →     역할을 뜻하는 이름       →     실제 부품의 값
forest.800                    action.primary.bg             button.primary.background
stone.50                      surface.canvas                page.background
space.6                       component.padding             card.padding
```

일반 컴포넌트는 hex 값이나 임의 간격을 직접 쓰지 않고 semantic token을 참조한다. 제품별 강조색은 product.accent로, 성공·위험 같은 상태는 status token으로 분리한다. 초록색 제품이라는 이유로 모든 상태가 성공처럼 보이게 하지 않는다.

이 설계서의 제안 토큰을 초기 기준본으로 삼는다. 구현 착수 시 버전 관리되는 토큰 파일을 기준으로 하고 Tailwind `@theme`·CSS 변수·Figma 변수의 이름을 대응시킨다. Figma가 변경됐다는 이유만으로 운영 코드가 자동 갱신된다고 전제하지 않는다. 토큰 변경과 디자인·코드·Storybook 반영을 한 변경 묶음으로 기록한다.[N02][N13]

### 20.3 색상 — 기본 테마

| semantic token | 값 | 쓰임 |
|---|---|---|
| surface.canvas | `#F7F8F5` | 기본 페이지 배경 |
| surface.raised | `#FFFFFF` | 카드·입력·제품 프레임 |
| surface.subtle | `#EEF2ED` | 분리된 설명 구간·가벼운 배경 |
| text.primary | `#17221D` | 제목·중요 문구 |
| text.secondary | `#54615A` | 설명·메타 정보 |
| border.subtle | `#DCE3DC` | 장식 구분선. 입력 경계의 유일한 단서로 쓰지 않음 |
| border.control | `#7E8F84` | 입력·선택·버튼 경계가 필요한 곳 |
| action.primary.bg | `#174D3C` | 공통 주요 행동 |
| action.primary.hover | `#103B2E` | 주요 행동 hover |
| action.primary.fg | `#FFFFFF` | 주요 행동 글자·아이콘 |
| action.disabled.bg | `#E7ECE6` | 사용할 수 없는 버튼 배경 |
| action.disabled.fg | `#647068` | 사용할 수 없음 상태의 문구 |
| focus.ring | `#174D3C` | 밝은 표면의 키보드 포커스 |

고객 계정과 결제는 밝은 테마를 기본으로 한다. 첫 출시에서는 전체 사이트의 다크모드 전환 기능을 별도로 만들지 않는다. 아래 inverse는 제품 이야기의 한 구간을 위한 **섹션 테마**이지 OS 설정에 따라 사이트 전체가 바뀐다는 뜻이 아니다.

### 20.4 어두운 시연 구간과 제품 강조색

| 토큰 | 값 | 적용 |
|---|---|---|
| inverse.canvas | `#111A16` | S03 대표 변환 이야기 배경 |
| inverse.surface | `#1B2921` | 어두운 구간 안의 보조 패널 |
| inverse.text | `#F5F8F3` | 핵심 설명 |
| inverse.text.secondary | `#B8C6BA` | 보조 설명 |
| inverse.focus | `#A4D5A8` | 어두운 배경의 포커스 표시 |
| product.pdf-to-md.accent | `#174D3C` | PDF→MD 아이덴티티·활성 단계 |
| product.typecut.accent | `#3349A4` | Typecut 소개·시연의 제한적 포인트 |
| product.transcribe.accent | `#92521B` | 트랜스크라이브 그랩퍼의 제한적 포인트 |

어두운 구간의 CTA를 밝은 배경의 짙은 글자 버튼으로 뒤집거나 테두리가 분명한 inverse variant로 사용한다. 어두운 배경 위에 식별하기 어려운 짙은 녹색 덩어리를 그대로 놓지 않는다. 로고·공통 계정 CTA는 제품마다 색을 바꾸지 않는다.

### 20.5 상태 색상과 대비 기준

| 상태 | 글자·아이콘 | 배경 | 표시 예 |
|---|---|---|---|
| 성공·유효 | `#23633F` | `#EDF7F0` | 사용 가능 / 결제 완료 |
| 정보·진행 | `#2456A6` | `#EEF4FF` | 구매 정보 확인 중 |
| 주의 | `#865300` | `#FFF5DF` | 기기 등록 필요 / 기간 만료 임박 |
| 오류·차단 | `#B42318` | `#FFF0EE` | 결제 실패 / 사용 권한 회수 |
| 중립 | text.secondary | surface.subtle | 개발 중 / 기기 등록 해당 없음 |

환불 완료는 처리 결과 자체가 정상일 수 있으므로 주문의 환불 상태는 중립 표시, 현재 사용 불가 사유는 별도 표시한다. 상태색만으로 구매 여부를 판단하게 하지 않고 항상 텍스트를 함께 둔다.

WCAG의 일반 텍스트 4.5:1, 큰 텍스트 3:1 기준을 바탕으로 아래 불투명 기본 쌍을 계산했다. 이는 색 토큰 계산이며 실제 페이지 전체의 접근성 인증이 아니다. opacity·영상·이미지·hover·focus·선택 상태를 적용한 실제 화면은 별도로 검사한다.[N14]

| 계산한 조합 | 대비율(약) |
|---|---:|
| text.primary / surface.canvas | 15.36:1 |
| text.secondary / surface.canvas | 6.09:1 |
| 흰 글자 / action.primary.bg | 9.71:1 |
| border.control / 흰 배경 | 3.42:1 |
| inverse.text / inverse.canvas | 16.57:1 |
| inverse.text.secondary / inverse.canvas | 9.99:1 |
| 성공 글자 / 성공 배경 | 6.54:1 |
| 주의 글자 / 주의 배경 | 5.96:1 |
| 오류 글자 / 오류 배경 | 5.93:1 |
| 정보 글자 / 정보 배경 | 6.43:1 |

border.subtle은 장식용이며 강한 대비를 보장하는 입력 경계로 취급하지 않는다. 링크는 본문에서 밑줄 또는 명확한 비색상 단서를 제공한다.

### 20.6 서체와 타이포그래피

기본 서체는 **Pretendard Variable 하나로 한글·영문 UI를 통일**한다. Markdown 원문·주문 식별자 등은 `ui-monospace` 계열 시스템 고정폭 폰트를 사용한다. 필요하지 않은 추가 디스플레이 폰트를 얹지 않는다. Pretendard의 공식 OFL 조건을 확인하고 실제 배포 시 필요한 라이선스 고지를 유지한다. 이번 산출물에는 폰트 파일을 포함하지 않는다.[N15]

| 스타일 | 모바일 | 태블릿 | 데스크톱 | 굵기·행간·용도 |
|---|---:|---:|---:|---|
| display.hero | 40px | 64px | 80px | 650, 1.12, 히어로 H1 |
| heading.section | 32px | 40px | 48px | 650, 1.20, 섹션 제목 |
| heading.feature | 24px | 28px | 32px | 600, 1.30, 기능·가치 제목 |
| heading.card | 20px | 22px | 24px | 600, 1.35, 카드·제품명 |
| body.lead | 18px | 20px | 20px | 400–450, 1.65, 히어로 보조 설명 |
| body.default | 16px | 18px | 18px | 400, 1.70, 상세 설명 |
| ui.label | 15px | 15px | 16px | 550–600, 1.40, 버튼·라벨 |
| caption | 14px | 14px | 14px | 400–500, 1.55, 버전·촬영·파일 조건 |
| code.preview | 14px | 15px | 15px | 400, 1.65, MD 원문 |

제목 자간은 -0.025em을 시작값으로 하되 한국어 가독성이 나빠지면 줄인다. 본문은 기본 0이다. 제목에는 의미 단위의 한국어 줄바꿈과 `word-break: keep-all`을 적용하고 긴 URL·주문번호에는 안전한 줄바꿈을 허용한다. 고정 높이로 한글·영문 문구를 잘라내지 않는다.

픽셀값은 설계 기준이고 실제 구현에서는 rem과 반응형 clamp로 연결한다. 320px·확대 환경에서는 H1의 의미가 유지되는 범위에서 36px까지 낮추거나 줄 수를 늘린다. 입력 글자는 모바일 확대 동작을 고려해 최소 16px로 둔다. 가격·파일 크기·기기 수는 tabular 숫자를 사용한다.

Pretendard는 자체 호스팅을 기준으로 필요한 문자 범위의 서브셋·WOFF2를 사용하고 전체 한글 파일들을 일괄 preload하지 않는다. 외부 폰트 CDN 지연으로 핵심 카피가 사라지지 않게 fallback을 둔다. 정확한 용량은 실제 사용 범위로 측정한다.

### 20.7 레이아웃·간격·반응형

| 항목 | 기준 |
|---|---|
| 전체 콘텐츠 폭 | 최대 1200px |
| 주요 제품 시연 폭 | 최대 1320px까지 확장 가능; 텍스트 폭과 분리 |
| 설명 본문 폭 | 최대 720px |
| 계정·결제 폼 폭 | 440–520px; 모바일은 컨테이너 폭 |
| 그리드 | 데스크톱 12열 / 태블릿 8열 / 모바일 4열 |
| 바깥 여백 | 모바일 20px / 태블릿 32px / 데스크톱 40px 이상 |
| gutter | 모바일 16px / 태블릿·데스크톱 24px |
| 주요 섹션 위아래 | 모바일 72px / 태블릿 96px / 데스크톱 128px |
| 헤더 | 글로벌 64px, 제품 내비게이션 56px; 모바일 각 56px·52px |
| 공통 간격 scale | 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 72 / 96 / 128 / 160px |
| breakpoint | 640 / 768 / 1024 / 1280 / 1536px |

고정되는 것은 제품 내비게이션 하나를 기본으로 한다. 글로벌 헤더까지 겹쳐 항상 두 줄을 차지하지 않게 한다. 섹션 앵커에는 고정 내비게이션 높이를 반영한다.

1024px 이상이면서 높이·입력 환경이 적합한 경우에만 대표 스크롤 pin을 켠다. 짧은 화면, 세로 공간 부족, 모션 감소 상태에는 정적 단계 흐름을 사용한다. 모바일에서 억지 가로 스크롤·hover 전용 정보·자동 재생 캐러셀을 사용하지 않는다.

계정 주문표는 작은 화면에서 의미 있는 요약 카드로 전환하되 주문번호·상태·금액·상세 진입은 유지한다. 파일 비교·MD 원문처럼 실제 긴 콘텐츠가 있는 영역만 내부 스크롤을 허용한다.

### 20.8 모서리·표면·아이콘·레이어

| 항목 | 토큰·규칙 |
|---|---|
| radius.control | 12px: 버튼·입력 |
| radius.card | 20px: 정보·구매 카드 |
| radius.media | 24px: 앱 시연 프레임; 모바일 20px |
| radius.hero | 32px: 큰 히어로 stage; 모바일 20px |
| radius.badge | 999px: 짧은 상태 배지에만 |
| border.width | 기본 1px, 포커스 2px |
| shadow.card | `0 8px 24px rgba(17,26,22,.06)` |
| shadow.media | `0 24px 72px rgba(17,26,22,.12)` |
| shadow.overlay | `0 24px 80px rgba(17,26,22,.20)` |
| 아이콘 | Lucide React, 20px 기본 / 16px 보조 / 24px 큰 행동, stroke 1.75 |
| z-index | 기본 0 / sticky 20 / popover 40 / backdrop 50 / dialog 60 / toast 80 |

아이콘은 필요한 것만 가져온다. 의미 있는 아이콘에 접근 가능한 이름을 주고, 텍스트를 중복하는 장식 아이콘은 보조기기에서 중복 읽지 않게 한다.[N21]

모든 카드에 강한 그림자를 넣지 않는다. 앱 화면·모달 등 실제로 표면 분리가 필요한 곳에만 강조한다. backdrop blur는 제품 내비게이션 같은 제한된 구간에서만 사용하고 지원되지 않아도 충분한 배경색을 둔다.

앱 아이콘은 각 제품의 승인된 독립 자산으로 제작하고 시스템 아이콘을 그대로 앱 로고로 쓰지 않는다. GroundRooted 로고의 실제 형태는 미확정이며 이 문서가 새 로고를 제작한 것은 아니다.

### 20.9 버튼·입력·상태 컴포넌트

| 부품 | 규격·variant | 반드시 설계할 상태 |
|---|---|---|
| Button | primary / secondary / ghost / destructive / inverse; 높이 44·48·52px, 좌우 20–24px | default, hover, focus-visible, pressed, loading, disabled |
| TextField | 높이 48px, 16px 글자, 12px radius, 고정 label·도움말 | empty, filled, focus, error, disabled |
| OTPField | 논리 입력 1개, 시각적 6자리 표시 가능, 전체 붙여넣기·자동 완성 | entering, verifying, invalid, expired, resend-wait |
| Badge | 텍스트+선택 아이콘, status 토큰; 비동작 요소 | neutral, info, success, warning, error |
| Tabs | 44px 이상 조작 높이, 선택 표시+문구 | active, focus, disabled, panel loading/error |
| Accordion | 48px 이상 질문 행, 제목·펼침 표시 | open, closed, focus; 높이 변화는 절제 |
| Dialog | 명확한 제목·설명·닫기, 모바일 너비 대응 | opening, open, validation, destructive confirm |
| Toast / InlineNotice | 일시 안내와 영속 오류 분리 | success, info, warning, error |
| Skeleton | 실제 부품과 같은 공간, 모션 감소에서는 정적 | loading; 오래 대기하면 설명·재시도 제공 |

primary 버튼은 화면의 주요 결정 영역에서 하나를 중심으로 한다. 히어로의 구매와 작동 방식 보기는 primary/secondary로 우선순위를 다르게 둔다. 키보드 포커스는 2px outline과 3px offset을 기본으로 하며 제거하지 않는다. 조작 영역은 최소 44×44px를 내부 기준으로 삼는다.

loading 중에도 버튼 너비를 유지하고 설명을 ‘확인 중…’처럼 행동에 맞게 바꾼다. 거래 진행은 낙관적으로 ‘구매 완료’로 표시하지 않는다. 같은 버튼의 반복 입력을 막아도 서버 멱등성 검사는 별개로 필수다.

영수증·환불·기기 해제처럼 중요한 결과는 자동으로 사라지는 toast만으로 끝내지 않고 본문 상태도 갱신한다. 결제 실패와 권한 확인 불가의 문구를 구분한다. form label을 placeholder로 대체하지 않는다.

### 20.10 제품 페이지·계정 전용 컴포넌트

| 컴포넌트 | 책임 | 핵심 데이터 |
|---|---|---|
| BrandHeader | 공통 브랜드·앱 탐색·내 계정 | products, account state |
| ProductNav | 현재 제품·섹션 이동·구매 관리 | product ID, anchors, purchase state |
| ProductHero | 제품 가치·핵심 시연·첫 행동 | 제품명, 카피, poster/video, CTAs |
| ProductStage | 실제 앱 화면 프레임·영상 컨트롤 | 자산, 실제/설명 라벨, 앱 버전 |
| WorkflowDemo | React Bits Stepper 기반의 수동 과정 탐색 | 제품별 입력·행동·결과·제한, 실제 자산, 현재 단계; 마지막 결과 유지 |
| FeatureExplorer | 기능 선택과 실제 화면·설명 연결, Base UI Tabs | 확인된 기능, 대응 캡처/녹화, 사용 조건 |
| ScriptPreview / OutputPreview | 스크립트와 실제 저장 결과 확인 | 승인된 샘플, 저장 형식, 원문·결과·버전, 실제 복사 상태 |
| ScrollStory | 4단계 대표 이야기, 모바일 대체 | stages, trigger policy, reduced motion |
| ResultComparison | 원본 PDF·MD 원문·읽기 보기 | sample manifest, 원본·결과·조건 |
| ValueSection | 사용자 작업의 이득을 실제 장면으로 설명 | 제목, 설명, 검증된 결과 자산 |
| TrustFacts | OS·파일·처리·지원 범위 | 확인된 사실·기준 버전 |
| PricingPanel | 가격과 이용 조건 | 서버 offer·policy·availability |
| PurchasePanel | 사용자별 구매·조회·권한 상태 | server purchase state; 공용 캐시 금지 |
| LibraryCard | 보유 제품·현재 사용·다운로드 | entitlement, release, platform |
| LicenseSummary | 제품 사용권과 기기 현황 | 상태, 기간, 업데이트 범위 |
| DeviceList | 기기 확인·해제와 재확인 | activations, 한도, 공개 기기 이름 |
| OrderDetails | 과거 구매 조건·영수증·환불 | 주문 snapshot, 결제 최종 상태 |
| SupportEntry | 제품별 사용법·문의·업데이트 | 실제 지원 문서와 연락 경로 |

공통 컴포넌트를 사용한다는 이유로 제품마다 같은 섹션 순서와 같은 앱 화면을 강제하지 않는다. PDF→MD에는 문서 변환 이야기와 결과 비교, Typecut에는 자막 편집 작업, 그랩퍼에는 스크립트 확보·저장 흐름을 넣는다. 섹션 내부 레이아웃과 시연은 제품별로 구성한다.

각 앱은 수동 단계 선택과 실제 결과 확인을 제공한다. 설명용 시연은 실시간 처리로 표시하지 않으며 카드 장식만으로 소개를 끝내지 않는다. Molten Metal은 hero의 배경층이고, 내용·제품 화면에는 대비가 안정적인 표면을 둔다. 구체적인 구성과 완료 기준은 React Bits 계획의 AC01–AC03 및 실행 계획 T26을 따른다.

### 20.11 구매 상태 표현 계약

| 서버가 확인한 상태 | 고객 문구 | 행동 | 표현 |
|---|---|---|---|
| signed_out | 구매하거나 기존 제품을 확인하세요 | 구매 시 이메일 인증 | 공개 가격·설명은 유지 |
| checking | 구매 정보를 확인하고 있습니다 | 기다림·필요 시 재시도 | 크기 유지 skeleton/안내 |
| check_failed | 구매 정보를 확인하지 못했습니다 | 다시 확인 / 문의 | 미구매로 전환 금지 |
| not_owned | 구매 조건을 확인하세요 | 구매하기 | 일반 구매 패널 |
| payment_pending | 결제 상태를 확인하고 있습니다 | 주문 보기 | 중복 결제 제한 |
| provisioning | 결제는 확인됐습니다. 제품을 준비하고 있습니다 | 주문 상태 확인 | 재구매 유도 금지 |
| active | 사용 가능 | 다운로드·앱 열기·인증 관리 | 성공 배지와 이용 범위 |
| activation_required | 구매 완료 · 기기 등록 필요 | 설치·기기 연결 | 구매 성공/기기 주의 분리 |
| expired | 사용 기간이 만료되었습니다 | 정책에 있는 경우 갱신 | 날짜·이유와 지원 |
| revoked | 현재 이 제품을 사용할 수 없습니다 | 사유·주문·지원 | 구매 이력은 유지 |
| not_applicable | 기기 등록이 필요 없는 제품입니다 | 앱 열기 | 오류로 보이지 않게 |

이 표의 이름은 UI 상태 모델이며 DB를 한 개 상태 컬럼으로 합치라는 뜻이 아니다. 이메일 인증·주문·권한·기기 상태는 각각 유지하고 서버의 결과를 조합해 패널을 만든다. 신규 판매 중지 여부도 기존 이용 권한과 별도다.

### 20.12 모션 시스템

| 토큰·유형 | 기준 | 적용 |
|---|---|---|
| motion.instant | 0ms | 권한·보안·필수 상태 반영 |
| motion.fast | 160ms | 버튼·색·아이콘의 작은 변화 |
| motion.ui | 220ms | 탭·아코디언·패널 변화 |
| motion.section | 480ms | 보조 섹션의 한 번만 등장 |
| motion.hero | 600ms | 앱 프레임 등 장식 진입; H1은 처음부터 읽힘 |
| ease.out | `cubic-bezier(.22,1,.36,1)` | 차분한 등장·안착 |
| ease.standard | `cubic-bezier(.2,0,0,1)` | UI 상태 전환 |
| offset.enter | 최대 16px | 작은 등장 이동 |
| scale.enter | 0.98 → 1 | 미디어 강조, 텍스트 전체 확대 금지 |
| motion.scroll | 스크롤 진행에 종속 | 시간 길이가 아닌 0–100% 장면 상태 |

스크롤 이야기의 기본 전체 높이는 데스크톱 약 260svh, 고정 stage는 제품 내비게이션을 제외한 가시 높이다. 실제 스크롤 진행 길이는 이 차이로 계산하고 고정된 픽셀 마법값을 넣지 않는다. 시연이 읽히지 않거나 구매까지 불필요하게 길어지면 길이를 조정한다.

PDF→변환→MD→활용의 네 장면을 0–25–50–75–100%로 나눈다. 한 시점에 하나의 메시지와 하나의 주 화면을 중심으로 한다. 단계 버튼은 해당 장면으로 이동하며, 전체 단계 설명은 보조기기가 순서대로 읽을 수 있게 둔다. 스크롤 갱신마다 aria-live 안내를 반복하지 않는다.

CSS와 GSAP이 같은 요소의 transform을 동시에 제어하지 않도록 소유 영역을 분리한다. 앱 영상의 재생 시간을 스크롤에 억지로 프레임 단위 동기화하는 방식은 기본안에서 제외한다. 영상은 독립 재생, 스크롤 이야기는 HTML/SVG/실제 캡처의 장면 조합으로 만든다.

`prefers-reduced-motion`에서는 pin·이동·scale·parallax를 제거하고 단계 카드를 일반 문서 흐름으로 보여준다. 시연의 정보는 동일해야 한다. 자동으로 움직이는 히어로에는 재생·정지 수단을 제공한다. 접근성 목표는 WCAG 2.2 AA를 중심으로 하며 비필수 상호작용 모션 감소는 추가 설계 기준으로 적용한다.[N25][N26]

### 20.13 영상·결과물·카피 규격

히어로 요약은 12–18초, 자세한 시연은 45–60초를 편집 출발점으로 사용한다. 길이는 제품 속도 광고가 아니다. 고해상도 마스터에서 데스크톱·모바일 목적별 인코딩을 만들고, 실제 앱 화면의 텍스트가 읽히도록 필요한 곳을 잘라 보여준다. 전체 앱 UI를 아주 작게 넣고 4K라는 이유로 읽힌다고 판단하지 않는다.

영상·앱 화면에는 실제 녹화 / 설명용 모션 / 내보낸 파일 활용 예시를 구분해 표시한다. 촬영 앱 버전·입출력 샘플·설정·배속 여부를 기록한다. 성능·후기·기능 증거를 합성하지 않는다.

PDF 샘플은 입력과 실제 MD를 한 쌍으로 제공한다. MD 원문은 장식용 코드 이미지가 아니라 선택·복사 가능한 텍스트다. 영상에 내레이션이 있다면 자막·텍스트 설명을 제공하고, 중요한 내용은 영상 바깥의 HTML에도 존재하게 한다.

문구는 ‘혁신적인 AI 생산성’ 같은 추상어보다 ‘어떤 자료를 어떻게 준비해서 어떤 작업에 쓰는가’를 말한다. 한 섹션에는 하나의 주장과 하나의 증거를 배치한다. 실제 측정 전에는 절약 시간·변환 성공률·토큰 절감률을 적지 않는다.

**PDF→MD 히어로 기준 초안**

> PDF to MD · by GroundRooted  
> **쌓아 둔 PDF를, AI와 일하는 자료로.**  
> 가지고 있는 PDF를 Markdown으로 변환해, AI에게 전달하고 다시 활용할 수 있는 자료로 준비하세요.  
> 구매하기 / 작동 방식 보기

이 카피는 직접 PDF 입력이 불가능하다고 주장하지 않는다. 앱이 자동 AI 전송을 하지 않는다면 저장 후 사용자 전달 단계로 설명한다. 구매 버튼과 가격·OS 표시는 실제 출시·정책 확인 후 공개한다.

### 20.14 Figma와 Storybook의 관리 방식

Figma는 Foundations / Components / Product-PDF-to-MD / Account-Commerce / Motion-Spec / Handoff-Checks의 여섯 영역으로 구성하는 안을 사용한다. 색·간격·radius를 변수로, 서체를 텍스트 스타일로, 버튼·입력·탭을 variant와 Auto Layout으로 정의한다. Light·Inverse와 제품 accent를 별도 계층으로 관리한다. 변수 mode 수와 팀 라이브러리 사용 범위는 실제 Figma 요금제에서 확인한다.[N13]

Storybook은 구현 단계의 실제 컴포넌트 카탈로그다. 부품의 default만 전시하지 않고 loading·error·long Korean text·mobile·reduced motion·구매자/미구매자 상태를 stories로 만든다. 거래·인증 데이터는 fixture로만 사용한다. 운영 DB 키를 넣지 않는다.[N27]

토큰 이름은 Figma와 코드에서 대응 가능하게 유지한다. ‘회색3’, ‘버튼초록최종’ 같은 이름 대신 text.secondary, action.primary.bg처럼 역할이 드러나는 이름을 쓴다. 변경 시 버전·변경 이유·영향 부품·검수 결과를 기록하고 임의의 페이지별 예외를 누적시키지 않는다.

이번 작업은 위 구성의 **명세를 작성한 것**이며 Figma 프로젝트나 Storybook 실행 파일을 생성한 것은 아니다.

## 21. PDF→MD 첫 페이지의 화면·기술·디자인 매핑

| 구간 | React 컴포넌트 | 기술 | 디자인 기준 | 근거·검수 |
|---|---|---|---|---|
| S01 히어로 | ProductHero + ProductStage | 서버 HTML, Next Image, video | 80/40px 제목, 밝은 배경, 최대 1320px stage, 52px 주 버튼 | 포스터만 있어도 가치 이해; 실제 녹화 |
| S02 문제 | ValueSection | 서버 HTML + 작은 CSS 전환 | 48/32px 제목, 긴 텍스트는 720px 이하 | 가짜 통계 없이 작업 문제 설명 |
| S03 변환 이야기 | ScrollStory | GSAP ScrollTrigger + useGSAP | inverse 구간, 네 장면, desktop pin, mobile 정적 | 순방향·역방향·중단·모션 감소 |
| S04 결과 증거 | ResultComparison | PDF.js, react-markdown, Tabs | desktop 좌우 비교, mobile 원본/MD/읽기 탭 | 실제 원본·결과, 복사·다운로드, XSS 방어 |
| S05 사용 영상·과정 탐색 | DemoVideo + WorkflowDemo | HTML video + React Bits Stepper | 24px frame, 재생·정지·자막·수동 단계 선택 | 실제 녹화·설명 구분, 배속 안내, 마지막 결과 유지·S04 비교 연결 |
| S06 구매 가치 | ValueSection 3개 | 제품별 React 구성 | 큰 결과 화면과 짧은 문구 번갈아 배치 | 앱 자체 기능/외부 활용 구분 |
| S07 신뢰 | TrustFacts | 검증된 manifest | OS·파일·처리 조건을 숨기지 않는 표/행 | 미정 항목과 거짓 배지 없음 |
| S08 가격 | PricingPanel + PurchasePanel | 서버 offer + 개인 no-store 조회 + Toss v2 | 거래 조건과 가격을 한 묶음, 주요 버튼 고정 폭 | 가격 변조·재구매·결제 확인 지연 |
| S09 FAQ | Accordion | shadcn/Base UI | 48px 질문, 키보드 접근, 과도한 모션 없음 | 모든 답변이 실제 정책과 일치 |
| S10 최종 행동 | ProductCTA + Footer | 동일 구매 상태 서비스 | 새로운 가격·혜택을 임의 추가하지 않음 | 첫 CTA와 상태·정책 일치 |

제품 내비게이션은 실제 섹션 ID와 동일한 anchors를 사용한다. 글로벌 헤더의 제품명은 `/pdf-to-md`처럼 루트 slug로 직접 연결한다. 로그인 복귀와 주문 완료도 제품 ID·허용된 내부 경로를 기준으로 처리한다.

## 22. 제작 단계·검수·인계 기준

### 22.1 단계별 산출물

| 단계 | 수행 범위 | 완료 판단 |
|---|---|---|
| 0. 현재 단계 | 기술·디자인 시스템·제품 경험 명세 | 이 문서 v1.3, 디자인 시스템 추출본 |
| 1. 제품 증거 확보 | 실제 앱 화면·PDF/MD 한 쌍·기능·처리·지원 범위 | 자산마다 앱 버전·출처·검증 상태 기록 |
| 2. 정적 상세 디자인 | `/pdf-to-md` desktop/mobile, 주요 구매 상태 | 실제 카피·읽을 수 있는 화면·거래 정보 포함 |
| 3. 기본 웹·부품 | Next/Tailwind/Base UI, 공개 페이지, Storybook | 토큰과 states 일치, 링크·새로고침·responsive 검수 |
| 4. 모션·결과 데모 | 대표 GSAP 장면, 실제 영상, 결과 비교 | 정적 대체·키보드·모바일·성능 예산 통과 |
| 5. 거래·앱 통합 | Auth·PG·권한·배포·기기, 운영자·복구 | 실제 테스트 결제·환불·실제 앱 인증 E2E |
| 6. 브랜드 확장 | GroundRooted 홈, Typecut·그랩퍼 전용 내용 | 동일 계정·디자인 기준, 제품별 독립 서사 |
| 7. 출시 | 계약·정책·운영 지원·복원·성능 확인 | 남은 미정 판매 조건 해소 후 공개 |

기술 서비스 가입·유료 계약·실제 결제·배포는 별도 실행 작업이며 이번 설계 요청으로 수행하지 않는다. 전 단계의 실제 테스트를 완료했다고 보고하지 않는다.

### 22.2 품질 예산

Core Web Vitals의 운영 목표는 모바일·데스크톱 각각 실제 방문의 75번째 백분위 기준 LCP ≤2.5초, INP ≤200ms, CLS ≤0.1이다.[N20]

아래는 내부 설계 예산이며 이미 측정한 결과가 아니다.

| 대상 | 초기 예산·검수 기준 |
|---|---|
| 공개 제품 페이지 초기 전송 JS | gzip 기준 250KB 이내를 출발 목표; 실제 분석으로 검토 |
| 초기 정적 전송 합계 | HTML/CSS/JS·첫 화면 이미지·초기 폰트 합계 1MB 이내 목표, 지연 영상/PDF 제외 |
| 히어로 poster | 데스크톱 250KB 이내, 모바일 150KB 이내 목표; 실제 가독성 우선 |
| 히어로 영상 | 지연 로드, desktop 5MB/mobile 3MB 이내를 편집 목표로 검토 |
| PDF.js·추가 시연 | 첫 화면 필수 JS에서 분리; 가까워지거나 사용자가 열 때 로드 |
| 외부 분석·위젯 | 구매 전 페이지에 결제 SDK·불필요한 tracking을 일괄 로드하지 않음 |
| 영상 동시 재생 | 가시 영역의 주 시연 1개만 자동 재생; 다른 시연은 정지 |
| 레이아웃 이동 | 영상·이미지·구매 패널 크기 사전 확보 |

부품 예산을 합산했을 때 전체 예산도 통과해야 한다. 용량을 맞추려고 실제 앱 글자를 읽지 못할 정도로 압축하지 않는다. 수치가 초과되면 원인·대안·승인 이유를 기록하고 무조건 ‘통과’라고 표시하지 않는다.

### 22.3 자동·수동 검수

Vitest는 가격 검증·상태 전이·권한 합산 같은 로직을, Playwright는 실제 페이지·로그인·결제·구매 복귀를 검사한다. Storybook/axe는 부품의 자동 접근성 검사를 수행한다. 자동 검사가 모든 접근성 문제를 찾는 것은 아니므로 VoiceOver·키보드·확대·실기기 Safari를 함께 확인한다.[N27][N28]

| ID | 검사 |
|---|---|
| Q01 | 세 제품의 `/<slug>` 직접 접근·새로고침·공유·404·예약 경로 |
| Q02 | 320·390·768·1024·1440px에서 의미 있는 콘텐츠 잘림·불필요한 가로 넘침 없음 |
| Q03 | JS·영상·모션 실패 시 H1·가치·지원 조건·구매 안내가 남음 |
| Q04 | keyboard·focus·dialog 복귀·탭 패널·읽기 순서·확대 검수 |
| Q05 | reduced-motion과 짧은 화면에서 pin 해제, 가시성·가격·구매 유지 |
| Q06 | 실제 PDF/MD 샘플 대응, raw HTML·외부 자원·임의 URL 제한 |
| Q07 | 로그인 전후 product CTA·주문·내 계정의 상태 일치 |
| Q08 | 다른 사용자의 주문 조회·기기 해제·파일 다운로드를 차단 |
| Q09 | 가격 변조·중복 승인·지연/역순 웹훅·PG 승인 후 DB 실패 복구 |
| Q10 | 결제 완료와 메일 발송 실패를 구분, 재시도로 중복 권한 미발급 |
| Q11 | 기기 한도 동시 등록 경쟁·재등록·해제·제품별 권한 분리 |
| Q12 | 환불 후 이력 보존, 늦은 구매 이벤트로 권한 부활 금지 |
| Q13 | 현재 세션·관리자 권한 취소·비밀 키 노출·RLS·GRANT 검수 |
| Q14 | 실제 배포 파일 설치·서명·버전·체크섬과 웹 정보 대응 |
| Q15 | 로컬 실험실 성능과 운영 RUM을 구분해 보고 |
| Q16 | DB·Storage 복원 절차와 긴급 신규 판매 중지·기존 고객 지원 절차 |

### 22.4 개발 에이전트 인계 규칙

실제 개발 환경에서 사용자 공용 vault의 `WIKI.md`와 해당 `projects/<프로젝트명>.md`를 먼저 읽는다. 그 규칙에 따라 이미 있는 저장소와 상태를 확인한 후 작업한다. 이 설계서는 현재 Mac의 파일 경로나 실제 저장소 브랜치를 확인한 문서가 아니다.

재사용할 결정은 기존 프로젝트 문서의 `## 메모` 아래에만 기록하고 자동 생성 영역을 덮어쓰지 않는다. 이번에 작성한 파일은 대화 산출물이며 vault·GitHub·운영 서비스에 저장하지 않았다.

인계 요약:

> GroundRooted는 하나의 브랜드 홈과 `/<slug>` 제품 페이지를 가진 통합 소프트웨어 스토어다. 첫 제품은 `/pdf-to-md`. Next.js/React/TypeScript, Tailwind 4, shadcn/Base UI, GSAP를 채택한다. Auth·DB·Storage는 Supabase, 이메일은 Resend, 배포는 Vercel Pro다. 국내 원화 판매 가정 시 Toss v2를 사용하되 계약·판매 국가·상품 정책은 별도 확정한다. 기존 앱의 변환 엔진은 재작성하지 않는다. 디자인은 GRDS 1.0 토큰과 구매 상태 계약을 따른다. 실제 시연·실제 결과·제한과 정책이 구매 신뢰의 근거다. 화면·코드·서비스 구현은 아직 수행하지 않았다.

## 23. 신규 기술·디자인 공식 근거와 확인 범위

확인 기준일은 2026-09-19다. 아래 공식 문서에서 확인한 기능과 설계 선택을 구분한다. 문서의 정확한 패키지 patch·플랜별 한도·약관은 실제 착수·계약 때 다시 확인한다. 벤치마크 원문과 기존 제품 정의의 근거는 상위 통합 설계서의 18절을 함께 본다.

| ID | 공식 자료 | 적용 범위 |
|---|---|---|
| N01 | Next.js App Router 및 Next.js 16: `https://nextjs.org/docs/app/getting-started/server-and-client-components`, `https://nextjs.org/blog/next-16` | 서버/클라이언트 경계와 기준 프레임워크 |
| N02 | Tailwind Theme variables: `https://tailwindcss.com/docs/theme` | CSS-first 디자인 토큰·utility 연결 |
| N03 | shadcn/ui 2026년 7월: `https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default` | 신규 Base UI 기본값, Radix와의 선택 구분 |
| N04 | Supabase 이메일 passwordless: `https://supabase.com/docs/guides/auth/auth-email-passwordless` | 이메일 OTP, 자동 가입 옵션 |
| N05 | Supabase SSR: `https://supabase.com/docs/guides/auth/server-side`, `https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs` | SSR 클라이언트·getClaims/getUser/getSession 역할 |
| N06 | Supabase RLS: `https://supabase.com/docs/guides/database/postgres/row-level-security` | 행별 소유권, 키·metadata·view 주의 |
| N07 | Supabase Storage: `https://supabase.com/docs/guides/storage/buckets/fundamentals` | public/private 버킷과 서명 URL |
| N08 | Resend Supabase SMTP: `https://resend.com/docs/send-with-supabase-smtp` | 인증 메일 발송 연결 |
| N09 | Toss v2 주문서형 결제위젯: `https://docs.tosspayments.com/guides/v2/payment-widget/integration`, 결제창 승인 흐름: `https://docs.tosspayments.com/guides/v2/payment-widget/integration-window` | 공식 위젯 연동과 인증·서버 승인·결과 검증. 정확한 SDK 메서드는 착수 시 고정 버전 문서와 대조 |
| N10 | react-markdown 공식 저장소: `https://github.com/remarkjs/react-markdown` | MD 표시·확장·신뢰 경계 |
| N11 | GSAP ScrollTrigger: `https://gsap.com/docs/v3/Plugins/ScrollTrigger/` | pin·scrub·타임라인·React 정리 안내 |
| N12 | Mozilla PDF.js: `https://mozilla.github.io/pdf.js/getting_started/` | PDF 표시 계층·worker·뷰어 용도 |
| N13 | Figma Variables: `https://help.figma.com/hc/en-us/articles/15343816063383-Modes-for-variables` | 값·모드·토큰 이름의 대응, 실제 요금제 제약 |
| N14 | W3C Contrast Minimum: `https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html` | 텍스트 대비 기준·계산 |
| N15 | Pretendard 공식 라이선스: `https://github.com/orioncactus/pretendard/blob/main/LICENSE` | 실제 폰트 사용 시 OFL 조건 |
| N16 | Vercel Fair Use: `https://vercel.com/docs/limits/fair-use-guidelines`, `https://vercel.com/pricing` | 상업 서비스의 Pro 기본안 |
| N17 | Vercel Node versions: `https://vercel.com/docs/functions/runtimes/node-js/node-js-versions` | Node 24 major 지정과 관리형 patch 갱신 |
| N18 | Vercel Cron: `https://vercel.com/docs/cron-jobs/manage-cron-jobs` | 주기 복구 작업·호출 보안·운영 검토 |
| N19 | Sentry 공식 Next.js SDK: `https://github.com/getsentry/sentry-javascript/blob/develop/packages/nextjs/README.md` | 오류·성능 수집의 선택 근거 |
| N20 | Google Web Vitals: `https://web.dev/articles/vitals` | LCP·INP·CLS와 p75·현장 측정 |
| N21 | Lucide React: `https://lucide.dev/guide/react` | SVG 아이콘·명시적 import·접근성 |
| N22 | Supabase Node 20 종료: `https://supabase.com/changelog/45715-deprecation-notice-dropping-support-for-node-js-20` | 구 런타임을 신규 기준으로 두지 않음 |
| N23 | Supabase Data API 변경: `https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically`, `https://supabase.com/docs/guides/api/securing-your-api` | 명시적 GRANT와 RLS를 함께 구성 |
| N24 | Supabase 인증 템플릿 변경: `https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier` | 자체 SMTP·템플릿 관리 조건 |
| N25 | W3C Pause Stop Hide: `https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html` | 자동 움직임의 중지 수단 |
| N26 | W3C Animation from Interactions: `https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html` | 비필수 모션 감소, 추가 접근성 기준 |
| N27 | Storybook 접근성 검사: `https://storybook.js.org/docs/writing-tests/accessibility-testing` | 부품 상태·axe·Vitest 검수 |
| N28 | Playwright 접근성 검사: `https://playwright.dev/docs/accessibility-testing` | 자동 검사와 수동 평가의 구분 |

Supabase의 `changelog.md` 직접 요청은 본 작업에서 실패했다. 이후 HTML 변경 이력과 해당 Auth·Data API·Node 변경 상세 페이지를 확인해 설계에 반영했다. Figma·PG·배포 계정의 실제 이용 가능 기능·가격·연결 상태, PDF 변환 앱의 코드·성능은 이 작업에서 검증하지 않았다.

**실제로 수행한 검증:** 첨부 v1.2 읽기, 선택 기술의 공식 문서 확인, 정의한 불투명 색상쌍의 대비 계산, 작성 문서의 구조·참조·파일 존재 확인. **수행하지 않은 검증:** 웹 렌더링, 실제 결제·이메일 발송, 앱 인증, 브라우저 E2E, Figma/Storybook 구현, DB·Storage·리전 설정.
