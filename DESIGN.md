---
version: "5.0"
name: GroundRooted-Flexibits-inspired
reference: https://flexibits.com/
reviewed: 2026-10-04
status: active
---

# GroundRooted 디자인 시스템 5.0

최신 사용자 지시: **Flexibits를 레퍼런스로 디자인을 다시 구성한다.**
이 절이 아래 CleanShot/Raycast/GRDS 기록과 충돌하는 시각 규칙보다 우선한다. 기존의 **그림자·hover·장식 외곽선 금지**와 접근성 포커스 예외는 유지한다.
Raycast 원문은 [보관본](website/archive/DESIGN-raycast-20260920.md)에 보존한다.

## 2026-10-04: Flexibits 기반 제품 중심 구성

- 실제 홈페이지 1440px/390px와 Fantastical 상세 첫 화면을 관찰했다. 제품 2열 패널 → 가로 기능 배너 → 중앙 브랜드 메시지 → 사용 장면 → 검은 푸터가 핵심 참고다.
- 메인 첫 화면은 ReadyMD/YouTube to MD 두 앱 패널, 바로 아래 TypeCut Pro 외부 사이트 배너다. 이 구성은 앱 묶음 판매나 통합 앱을 뜻하지 않는다.
- 공통 헤더는 제품별 작은 기호와 둥근 '앱 둘러보기' CTA, 모바일 native details 메뉴를 제공한다. 콘텐츠 기준 폭 1120px, 표면 반경 26–34px, 파란 CTA와 녹색/보라색 제품 보조 색을 사용한다.
- 중앙 브랜드 문구는 짙은 글자와 주황색 강조로 구성한다. 서체는 자체 제공 Pretendard를 유지한다. Flexibits의 유료 Effra·앱 아이콘·사진·로고를 복사하지 않는다. AppMark는 기존 Lucide를 조합한 자체 웹사이트 기호다.
- GPT Image·Higgsfield 자산과 작업 선택·자료/결과·맞춤 가이드·영상 제어는 체험 영역에 배치한다. 영상 초기 자동 재생은 없다.
- YouTube 상세는 중앙 제품명/가치 제안/CTA/체험 이미지 순서로 변경한다. ReadyMD의 브랜드·Lightfall·체험을 둥근 제품 소개 영역과 공통 버튼·푸터로 정돈한다.
- 최종 활성 시각 규칙은 `components/storefront/flexibits-theme.css`. StorefrontShell 및 ReadyMD layout에서 기존 스타일 뒤에 로드하며 공개 루트로 한정한다.
- [레퍼런스 관찰·적용·검증](website/flexibits-redesign-20261004.md).

## 2026-10-04: GPT Image·Higgsfield와 섹션별 인터랙션

- 최신 요청에 따라 GPT Image 이미지 4장과 Higgsfield Seedance 2.0 영상 1개를 실제 생성해 적용한다. 종이 조형과 청색/베이지/연보라/연녹색으로 문서·기록·편집·제작 철학을 구분한다.
- 모든 생성 자산은 콘셉트라고 표시하며 제품 캡처나 변환 결과로 표현하지 않는다. 설명용 문서는 기존 저작 예시를 유지한다.
- 메인 작업 탭, 제품 입력/결과 선택, 맞춤 앱 가이드, ReadyMD 읽기/활용 선택과 상단 읽기 진행 표시를 제공한다. 키보드·모바일에서도 조작할 수 있다.
- 영상은 수동 재생, 재생 전 다운로드 없음, 화면 밖/백그라운드 정지, 오류 시 정적 이미지로 복귀한다. 모션 감소 설정에서 초기 화면은 정적이다.
- 새 자산은 정확한 파일 목록만 공개한다. 기존 색상·포커스·그림자/hover/장식 외곽선 금지와 ReadyMD 브랜드는 유지한다.
- [자산 경로·프롬프트·생성 이력·검증](website/interactive-art-direction-20261004.md).

## 2026-10-04: 공개 사이트 통합 개편

- 메인은 브랜드 가치 → 제품 바로가기 → ReadyMD 대표 소개와 나머지 두 앱 → 작업별 선택 가이드 → 제작 철학 → FAQ 순서다. 앱 순서와 TypeCut Pro 공식 외부 링크를 유지한다.
- 흰 바탕, 짙은 청회색 글자, 파란 CTA를 공통으로 사용한다. 문서는 청색, 영상 기록은 베이지, 편집은 연보라로 구분한다. 장식선·그림자·hover 효과 금지와 키보드 포커스 예외는 그대로다.
- 공통 `PublicHeader`·`PublicFooter`와 `public-foundation.css`는 `.gr-public`에만 적용한다. 모바일 메뉴는 native details로 JS 없이도 열리며, JS 사용 시 Escape/포커스 복귀와 링크 선택 닫기를 지원한다.
- 콘텐츠 폭 1200px, 모바일 여백 20px. 제목은 유동 크기와 균형 줄바꿈, 컨트롤은 44px 이상을 기본으로 한다. ReadyMD 하위 메뉴는 조밀한 제품 탐색용으로 별도 구성한다.
- 모든 제품 그림은 직접 작성한 개념도이며 실제 앱 캡처가 아니다. 고객 수·후기·성능 수치·미확정 판매 약속을 추가하지 않는다.
- ReadyMD 브랜드 문구, Lightfall, 별빛, EPUB/MD 체험을 유지하고 체험을 히어로 다음으로 앞당긴다. 제작 이야기는 FAQ 앞에 둔다. `enterprise.css`가 최종 공통 정렬을 담당한다.
- YouTube to MD는 자막/Markdown 탭, 키보드 전환, 복사 상태·실패 안내, FAQ·출시 상태를 제공한다. 실제 자막 수집은 수행하지 않는다.
- React/디자인 스킬을 적용하되 일반 UI에 TypeSafe API 호출을 추가하지 않는다. IBM Carbon은 그리드·간격 설계의 참고 자료이며 해당 라이브러리나 브랜드 자산을 복사하지 않았다.
- [스킬 선정·변경·검증](website/enterprise-upgrade-20261004.md).

## 2026-09-29: 브랜드 메인과 세 앱 상세 페이지

- `/`는 GroundRooted 메인이다. 앱 순서는 ReadyMD → YouTube to MD → TypeCut Pro로 고정한다. 내부 HQ는 보호된 `/admin/hq`로 분리한다.
- 앱마다 한 줄의 쓰임, 짧은 상황 설명, 입력 → 결과 개념도와 상세 페이지 링크를 제공한다. ReadyMD의 기존 스토리텔링 화면은 유지한다.
- 공통 밝은 바탕에 앱별 청색·따뜻한 베이지·연보라 영역을 사용한다. 기존 효과 금지 규칙과 키보드 포커스를 유지한다.
- [경로·제품 근거·검증 기록](website/groundrooted-app-catalog-20260929.md).

## 2026-09-26: 제작 이야기와 개인 서재

- 사용자 제공 경험을 토대로 Nexus 약 4만 권 변환 → 개인용 ReadyMD 제작 배경을 소개한다. 이 수치를 ReadyMD 성능 측정치로 바꾸지 않는다.
- ReadyMD → Obsidian 서재 → 별도 AI 질문 흐름을 정적 도식으로 보여준다. 실제 AI 응답이나 자동 연동을 꾸미지 않는다.
- [문구·근거·검증 기록](website/readymd-origin-story-20260926.md).

## 2026-09-26: 결과를 먼저 보여주는 비교 화면

- 비용 두 가지와 예산별 권수를 먼저 나란히 보여준다. 예산·본문량 설정과 긴 근거는 접기 영역으로 옮긴다.
- 입력·출력 한도를 만 단위와 상태 문장으로 표시하고, 200쪽 → 20쪽씩 10번 → 결과 확인·합치기 흐름을 붙인다.
- API 예산과 Plus 구독의 차이, 추론 등 제외 조건은 접지 않고 결과 바로 아래에 유지한다.
- 로컬 OCR의 외부 API 호출료와 앱·전기·장비의 총비용을 구분한다.

## 2026-09-26: 200쪽 책과 Astra 예산

- Plus $20 구독과 API $20 예산을 구분한다. 고정 구독 처리 권수를 만들지 않는다.
- 해상도·본문량·예산을 바꾸는 계산기, 입력/출력 비용 막대, 두 한도를 따로 표시한다. Standard·캐시 미사용·추론 제외 조건을 결과 바로 옆에 표시한다.
- OCR 정확도나 토큰 낭비를 실증했다고 주장하지 않는다. [근거와 검증 계획](website/readymd-astra-book-budget-20260926.md)을 따른다.

## 2026-09-26: 로컬 AI 비교 섹션

- 같은 문서 체험 다음에 자료 이동 → API 비용 계산 → NotebookLM 용량·소스 수 비교를 배치한다. 검증 날짜와 공식 출처를 붙인다.
- 로컬 OCR과 클라우드 분석의 데이터 경로를 구분한다. 학습 제외 정책을 외부 미전송으로 표현하지 않는다.
- 외부 API 호출료 $0와 앱·전기·장비의 총비용을 구분한다. 가정·단가·입력/출력 토큰을 드러내며 실제 OCR 품질이나 청구액이라고 주장하지 않는다.
- NotebookLM의 노트북당 소스 수를 1회 업로드·완독량으로 바꾸어 설명하지 않는다. ReadyMD의 미검증 처리 한도는 무제한으로 표시하지 않는다.
- [공식 근거·산식·검수 기록](website/readymd-local-ai-comparison-20260926.md)을 참조한다.

## 2026-09-23: ReadyMD 스토리텔링 리뉴얼 (최신)

- 근거: [스토리텔링 계획 1.0](website/readymd-storytelling-plan-v1.0.md). 페이지는 공감 → 같은 PDF의 두 가지 쓰임 → 대상별 사용 장면 → 3단계 사용법 → FAQ → 출시 상태와 마무리로 이어진다.
- 히어로 `For Your 2nd Brain` / `지성 확장의 시작`, 제품명 `ReadyMD 레디엠디`, Lightfall과 마무리 문구 뒤 별빛을 유지한다. 헤더는 제품명 중심, 푸터는 제작사 GroundRooted다.
- 제품 설명은 ‘읽기 편한 전자책’과 ‘다시 활용할 자료’로 시작한다. EPUB·Markdown 용어는 해당 체험 안에서 설명하며 코드 원문은 ‘파일 구조 보기’ 안에 둔다.
- 같은 저작 샘플 `products/readymd-story.ts`와 `reading-map.svg`를 PDF 지면, 읽기 본문, MD, 사용 순서에 공유한다. 실제 앱 화면·출력이라고 주장하지 않는다. 그래프 수치·후기·성능 보장은 만들지 않는다.
- `storytelling.css`를 마지막에 적용한다. 넓은 전후 비교, 비대칭 공감/대상 섹션, 밝은 청색·중성 바탕을 사용한다. 그림자·hover·장식 외곽선은 계속 금지한다. 포커스와 강제 색상 모드의 선택 상태 표시는 유지한다.
- 주요 행동은 ‘달라지는 모습 보기’, 보조 행동은 ‘사용 방법’이다. 미구현 업로드·구매·알림 신청 행동을 만들지 않는다.
- 중복 ScrollStory·ResultComparison·기능 카드 영역은 현재 페이지에서 제외한다. 기존 컴포넌트 파일은 보존한다. React Bits Backgrounds(Lightfall), Animations(AnimatedContent), Components(Stepper), TextAnimations(SplitText), Micro(StatusMark)는 유지한다.

## 2026-09-23: ReadyMD 문구와 하단 배경 (최신)

- 제품명은 `ReadyMD 레디엠디`, 히어로 타이틀은 `For Your 2nd Brain`, 바로 아래 부제목은 `지성 확장의 시작`이다. 제작사 GroundRooted와 미리보기 경로 `/pdf-to-md`는 유지한다.
- 별빛은 별도의 푸터 하단 영역 대신 “사람이 읽고, AI와 함께 활용하도록.” 마무리 문구의 뒤 배경으로 배치한다. 텍스트와 버튼을 앞 레이어에 두고 배경은 포인터 입력을 받지 않는다.
- 사용자 요청으로 푸터 별빛 정지 버튼을 삭제한다. 모션 감소 설정의 정적 별, 화면 밖·숨김 탭 렌더링 중단과 30fps/DPR 제한은 유지한다. 아래 과거 수동 정지 규칙보다 이 지시가 우선한다.

## 2026-09-22: Lightfall + 무료 푸터 별빛 (최신)

- 첫 화면의 EPUB 읽기 카드(HeroReader)는 제거한다. 중앙 정렬한 가치 제안과 CTA만 남기고, 아래쪽 EPUB·Markdown 상세 체험은 유지한다.
- 메인 배경은 React Bits **Lightfall**이다. 이전 Molten Metal 지정은 폐기한다. 밝은 청색 팔레트, 원본 lightMode 셰이더, 텍스트 영역의 밝은 오버레이를 사용한다.
- 모바일은 수동 재생, 데스크톱은 자동 재생한다. 정지 시 시간을 고정하고, 화면 밖·숨김 탭에서 렌더링을 멈춘다. 모션 감소·WebGL 실패 시 정적 배경을 제공한다.
- 푸터 맨 마지막에는 별이 중앙에서 퍼지는 **자체 제작 Canvas 2D 효과**를 사용한다. 사용자 요청에 따라 구매 없이 구현하며 React Bits Pro Star Burst 코드·번들·이미지는 사용하지 않는다. 원본의 1:1 복제 또는 공식 Pro 컴포넌트라고 표시하지 않는다.
- 두 효과 모두 30fps 상한, DPR 제한, 수동 정지, 자원 정리를 적용한다. 포인터 반응·그림자·장식 외곽선은 없다. 푸터 모션 감소 모드는 정적 별을 표시한다.
- 아래 과거 히어로 구성·Molten Metal 규칙과 충돌하면 이 절이 우선한다.

## 2026-09-22: Emil + Taste 적용 규칙 (이전 구성 기록)

- CleanShot의 밝은 브랜드와 기존 URL/메뉴/제품 계약을 보존하는 재구성이다. `emil-design-eng`, `design-taste-frontend`, `playwright`를 적용한다. 설치·Figma 연결 상태는 [스킬 적용 기록](website/skill-redesign-20260922.md)에 분리한다.
- Taste 설정: DESIGN_VARIANCE 6, MOTION_INTENSITY 3, VISUAL_DENSITY 3. 섹션 번호·반복 영문 소제목을 없애고, 제목과 설명은 세로로 묶는다. 같은 크기의 카드 3개 대신 큰 읽기 카드와 작은 맥락 카드 2개를 배치한다.
- 히어로는 왼쪽 가치 제안, 오른쪽 실제 작동하는 브라우저 리더다. 글자 16–28px 조절과 초기화를 제공하며 실제 EPUB 또는 앱 화면이라고 표시하지 않는다. 첫 화면 주요 CTA가 보이도록 설계한다.
- 헤더 72px, 히어로 제목 최대 54px, 패널 반경 24px, 내부 리더 16px, 조작면 12px를 사용한다. 아래 이전 수치와 충돌하면 이 규칙이 우선한다.
- Emil 적용: 진입/제목 240ms, 클릭 단계 전환 180ms, 누르기 피드백 140ms. 키보드 단계 전환·크기 조절은 즉시 반영한다. 스크롤 고정/가로 강제 이동은 제거한다. 포인터 hover 효과는 계속 금지한다.
- 모바일(767px 이하)은 초기 렌더링 부담을 줄이기 위해 Molten Metal 자동 실행 대신 정적 대안을 표시하고 `배경 재생`으로 시작한다. 데스크톱 자동 실행, 수동 정지, 모션 감소 설정은 유지한다.
- 스킬 기본값보다 사용자 지정이 우선한다. 밝은 CleanShot 테마, Molten Metal 배경, 기존 Lucide 아이콘, React Bits/설명용 조작 컴포넌트를 유지한다. 실물 자산 없이 제품 스크린샷을 꾸며 만들거나 Higgsfield 결과라고 표시하지 않는다. 이미지 생성·다크 모드·hover 등 스킬 일반 권장은 이 작업의 필수 범위로 확대하지 않는다.
- Figma는 OAuth 승인과 정확한 프레임 링크 후 get_design_context → get_screenshot → 코드 반영 → 비교 검수 순서다. 이 근거 없이 Figma 1:1 구현 완료라고 주장하지 않는다.

## 1. 레퍼런스에서 확인한 것

[CleanShot 홈](https://cleanshot.com/)을 2026-09-20 데스크톱 1440×1000 / 모바일 390×844에서 직접 확인했다.

- 흰 바탕과 옅은 청색 히어로, 검은 대형 제목 일부의 파란 강조, 파란 주요 버튼.
- 간결한 상단 메뉴, 가운데 정렬한 가치 제안과 두 행동, 그 아래 큰 제품 시연.
- 기능별 짧은 설명과 대형 화면을 결합하고, 일부 기능은 크기가 다른 파스텔 카드로 묶는다.
- 데스크톱 h1 60px/600, h2 40px/600을 브라우저 computed style로 확인했다.
- 레퍼런스 font-family는 Google Sans Flex / SF Pro Display 계열이다.
- 원본에는 그림자·외곽선·hover가 있다. 사용자 금지 규칙에 따라 이 요소들은 가져오지 않는다.
- 원본의 고객 수·후기·가격·보증·지원 OS·로고·제품 이미지/영상은 GroundRooted에 재사용하지 않는다.

위 관찰과 아래 적용 토큰을 구분한다. 아래 색상/간격은 GroundRooted용 설계값이며 원본 CSS의 완전 복제를 뜻하지 않는다.

## 2. 최우선 금지 규칙

1. **그림자 없음:** box-shadow, text-shadow, filter: drop-shadow, 그림자 역할의 pseudo-element를 사용하지 않는다.
2. **호버 효과 없음:** 색상 변경, 밑줄 출현, 이동/확대, 떠오름, 기울기, pointer-follow glow 및 hover 전용 메뉴/툴팁 금지. 단순 커서 표시는 기능 안내로 유지한다.
3. **장식 외곽선 없음:** '아웃스트로트'는 우선 카드·버튼·텍스트의 장식적 outline/border/stroke로 해석했다. 장식 border/ring/text-stroke를 사용하지 않는다.
4. **접근성 예외:** 키보드 focus-visible 3px 표시와 forced-colors에서 필요한 시스템 컨트롤 경계는 보존한다. 이것은 장식이 아닌 현재 조작 위치/컨트롤 식별이다. 아이콘·도표의 의미를 전달하는 SVG 선까지 지우지 않는다.
5. hover와 별개인 **클릭·선택·완료·오류·메뉴 열림** 상태는 배경색, 아이콘, aria 상태로 드러낸다.
6. 최신 금지 지시가 과거 React Bits SpotlightCard의 pointer 효과 요구보다 우선한다. 정적 카드 껍데기는 유지하고 pointer listener/RAF/glow를 제거한다.

## 3. 색상

| 역할 | 적용값 | 사용 |
| --- | --- | --- |
| Canvas | #ffffff | 페이지 바탕 |
| Ink | #17191e | 제목과 주 텍스트 |
| Muted | #5e6672 | 본문 보조 설명 |
| Primary | #1657e8 | 주요 CTA, 활성 탭, 포커스 |
| Primary text | #ffffff | 파란 배경 위 글자 |
| Hero wash | #ddebff → #ffffff | 밝은 히어로 공간 |
| Surface | #f2f5fa | 체험·FAQ·정보 블록 |
| Blue panel | #eaf3ff | 제품 시연 및 최종 CTA |
| Blue selected | #dce9ff | 이미지 참조/폴더 선택 |
| Peach panel | #f8eee8 | 문서·이미지 구조 소개 카드 |
| Mint panel | #ebf5f0 | AI 자료 활용 카드 |
| Success / Error | #176b44 / #b42335 | 실제 작업 결과 |

경계는 선이 아니라 표면 색과 여백으로 구분한다. 장식용 outline과 그림자로 깊이를 만들지 않는다.

## 4. 서체·크기

- 배포 서체: 자체 제공 Pretendard Variable → macOS/system sans-serif.
- 레퍼런스의 Google Sans Flex 파일은 복사하지 않는다. 한국어 읽기 품질과 설치 재현성을 위해 기존 라이선스가 보존된 Pretendard를 사용한다.
- Hero: desktop 최대 64px / 670 / 1.2, mobile 34–48px / 1.22.
- Section: 40–44px / 650 / 1.25, mobile 32px.
- Card heading: 22–30px / 600–650.
- Hero body: 20px desktop, 17px mobile. 일반 설명: 16–17px / 1.65–1.75.
- 버튼: 15px / 600. 메타/설명용 코드: 11–13px.
- 한글 제목은 keep-all, 좁은 영역은 overflow-wrap으로 가로 넘침을 방지한다.
- 윤곽선 글자, text-shadow, Raycast ss03 강제 규칙은 사용하지 않는다.

## 5. 레이아웃

- 내용 폭 최대 1200px, desktop 양쪽 32px 이상, mobile 20px.
- 하나의 상단 헤더: 브랜드·제품·체험·작동 방식·FAQ·출시 안내.
- mobile 메뉴는 클릭 disclosure, Escape 닫기와 aria-expanded 제공. hover로 열지 않는다.
- 큰 섹션 간격 104px desktop / 72px tablet / 56px mobile.
- 기능 카드 간격 24px desktop / 16px tablet, mobile 한 열.
- 큰 시연 컨테이너 24px radius, 내부 패널 16px, 버튼 14px, 작은 조작면 8–12px.
- 한 히어로에서 핵심 가치와 두 행동을 보여준 뒤 PDF→로컬 OCR→두 결과 개념도를 배치한다.
- EPUB/MD+이미지의 실제 조작 체험을 첫 주요 기능 구간에 둔다.
- 구매 가능한 것처럼 표현하지 않는다. 실제 가격/거래 준비 전에는 체험·출시 안내 CTA를 사용한다.

## 6. 컴포넌트 계약

- PrimaryButton: 파란 solid fill, 흰 글자, 최소 48px, 그림자/테두리/hover 없음.
- SecondaryButton: 연회청색 solid fill, 짙은 글자, 최소 48px, hover 없음.
- FeatureCard: 파스텔 표면 + 큰 설명 그래픽 + 짧은 제목/본문. pointer 반응 없음.
- DemoPanel: 연한 배경 위 흰 내용 패널. 바/여백/색상으로 구분하며 외곽선 없음.
- Tabs: 비활성 텍스트 + 활성 파란 면. 키보드 화살표, aria-selected 제공.
- ImageReference: 선택한 MD 참조와 이미지 폴더 항목을 같은 연파란 면으로 표시한다.
- EPUB reader: 16–28px 크기 조절, 실제 본문 재배치, 원본과 같은 설명용 텍스트.
- FAQ: native details/summary, 연회색 블록, 클릭/Enter 열기. hover 없음.
- MobileMenu: 버튼으로 명시적 열기/닫기, 링크 선택 시 닫기, Escape 시 버튼으로 포커스 복귀.
- StatusMark: 클립보드의 실제 성공/실패에만 완료/오류 상태 표시.

## 7. 모션

- 이전 사용자 지정 Molten Metal은 유지하되 light mode, 파란/흰 금속색, opacity 0.2로 옅게 적용한다. 그림자 효과가 아닌 배경 텍스처다.
- Raycast 붉은 사선은 제거한다.
- 모션 감소, 정지/재생, offscreen/탭 비가시 중단, WebGL 정적 대안 유지.
- SplitText·진입·단계 전환 등 비-hover 모션은 본문 읽기와 기능을 방해하지 않는 범위에서 유지한다.
- Spotlight pointer 추적·카드 lift·hover transform/glow는 구현하지 않는다.

## 8. 제품 근거와 자산

[제품 설명 계약](website/pdf-product-story-20260920.md)을 따른다.
로컬 OCR → 사람의 EPUB / AI의 Markdown+별도 이미지 폴더라는 사용자가 설명한 핵심 특징을 유지한다.
실제 앱 캡처·변환 결과가 없는 예시는 설명용이라고 표시한다.
Higgsfield 생성은 직전 시도에서 크레딧 부족으로 실패했으며 생성 자산은 아직 없다.
이번 디자인 변경에 새 외부 이미지/영상 생성, 사용자 파일 업로드, 원격 DB/거래/배포는 포함하지 않는다.

## 9. 구현과 검수

- 활성 파일: app/pdf-to-md/cleanshot.css.
- marketing.css·reading-experience.css는 기본 구조/조작 geometry다. 현재 화면의 색상/타이포/금지 규칙은 cleanshot.css가 결정한다.
- raycast.css는 활성 import에서 제거하고 보관한다.
- 확인: desktop/mobile 화면, 320–1440px 넘침, EPUB 크기, MD 이미지 선택, 메뉴 키보드, 복사/단계/FAQ, axe, build/typecheck.
- 그림자·decorative border computed style 0, hover 전후 style/위치 동일, Spotlight pointer 추적 부재를 별도 검사한다.
- HQ/auth 경계 유지, 공개 배포와 독립 검수는 별도 승인 단계다.
