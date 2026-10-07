# GroundRooted 웹사이트 제작 기준

> 2026-09-30: TypeCut Pro는 기존 사이트 `https://groundroot.github.io/typecut-pro/`를 사용한다. 메인·공통 앱 메뉴는 직접 연결하고 `/typecut-pro`는 그 주소로 307 이동한다. 아래 로컬 상세 페이지 설명보다 이 결정이 우선한다.

> 2026-09-29 최신 사이트 구조: GroundRooted 메인 `/` → ① ReadyMD `/pdf-to-md` ② YouTube to MD `/youtube-to-md` ③ TypeCut Pro `/typecut-pro`. 내부 HQ는 `/admin/hq`. 이 순서·경로가 아래 과거 계획보다 우선한다. [구현·검수 기록](groundrooted-app-catalog-20260929.md). 현재 미리보기: `http://127.0.0.1:3033/`.

2026-09-26 제작 스토리 추가: [Nexus 약 4만 권 경험과 Obsidian 서재 흐름](readymd-origin-story-20260926.md). 최신 미리보기는 `http://127.0.0.1:3032/pdf-to-md#origin-story`다.

2026-09-26 결과 가독성 개선: 비용·권수 비교를 먼저 보여주고, 계산 설정·근거를 접기 영역으로 정리했다. 입력/출력 한도와 분할 흐름을 시각화했다. 최신 미리보기는 `http://127.0.0.1:3031/pdf-to-md#local-cost`다.

2026-09-26 200쪽 책·Astra 비용 분석: [공식 근거·계산 데이터·실측 계획](readymd-astra-book-budget-20260926.md). Plus 구독과 API 예산을 구분하고 입력·출력 한도, 해상도, 분할·캐시 조건을 시각화했다. 최신 미리보기 `http://127.0.0.1:3030/pdf-to-md#book-budget`.

2026-09-26 로컬 AI 비교 보강: [공식 자료·비용 산식·검수 기록](readymd-local-ai-comparison-20260926.md). 자료 이동 경로, API 비용 계산기, NotebookLM 파일·소스 수 비교를 추가했다. 최신 로컬 미리보기는 `http://127.0.0.1:3029/pdf-to-md#why-local`이다.

2026-09-23 리뉴얼 구현: [변경·검증 기록](readymd-renewal-20260923.md). 새 로컬 미리보기는 `http://127.0.0.1:3028/pdf-to-md`다. 공감 → 동일 자료 체험 → 활용 장면 → 사용법으로 재구성했으며, 아래 과거 구성 설명보다 최신 리뉴얼 기준이 우선한다.

2026-09-23 콘텐츠 재기획: [ReadyMD 스토리텔링 계획서 1.0](readymd-storytelling-plan-v1.0.md)과 [네이버·와디즈 조사 기록](readymd-storytelling-research-20260923.md). 사용자 요청에 따라 구현 전 계획을 다시 작성했다. 중심은 ‘모아 둔 PDF를 읽고 다시 쓰는 나의 지식으로’이며, 고객 상황에서 시작하는 8개 장면과 카피·시연·검증 기준을 제안한다. 네이버 소프트웨어 주간 구매 TOP 10 목록은 확인했으나 상세 본문은 보안 확인으로 미검증이다. 이후 사용자 리뉴얼 요청에 따라 새 구성을 구현했다.

2026-09-23 현재 구현 문구: ReadyMD 레디엠디 / For Your 2nd Brain / 지성 확장의 시작. 별빛은 마무리 문구 뒤 배경으로 이동했고 푸터 별빛 정지 버튼은 삭제했다. [변경·검증 기록](readymd-update-20260923.md). 아래 9월 22일의 ‘푸터 마지막 별도 영역’ 설명보다 최신 지시가 우선한다.

2026-09-22 최신 배경 변경: [디자인 시스템 2.2](../DESIGN.md). 첫 화면 EPUB 카드를 제거하고 Molten Metal을 Lightfall로 교체했다. 푸터 마지막 별빛은 구매 없이 만든 자체 Canvas 2D 구현이며 React Bits Pro 원본이 아니다. 아래 이전 배경 관련 설명보다 이 규칙이 우선한다.

최종 검토: 2026-09-20. 현재 단계는 **PDF to MD 첫 페이지 로컬 구현·검수**다. 외부 연동·전체 사이트·출시는 미완료다. [구현 기록](implementation-progress-20260920.md)을 먼저 확인한다.

2026-09-22 업데이트: [Emil·Taste 스킬 기반 재구성 및 Figma 연결 상태](skill-redesign-20260922.md), [디자인 시스템 2.1](../DESIGN.md). 최신 로컬 미리보기는 `http://127.0.0.1:3027/pdf-to-md`다. Figma OAuth·프레임 대조는 아직 미완료다.

**최신 시각 기준:** [DESIGN.md 2.0](../DESIGN.md)의 **CleanShot 참조**가 이전 Raycast/GRDS 시각 규칙보다 우선한다. 밝은 바탕·청색 CTA·넉넉한 여백·대형 기능 시연을 적용하되 **그림자·호버 효과·장식 외곽선 금지**다. 키보드 포커스와 의미 전달용 아이콘/그래프의 선은 유지한다. [레퍼런스 분석](cleanshot-reference-review-20260920.md) 참조. Molten Metal은 밝은 파란 톤으로 유지하고 Spotlight pointer 효과는 제거했다.

PDF to MD 홈페이지의 변환 파이프라인 애니메이션과 Higgsfield 프롬프트는 [pdf-pipeline-animation-higgsfield.md](pdf-pipeline-animation-higgsfield.md)에 기록한다.

## 읽는 순서

**최신 제품 설명:** [로컬 OCR · EPUB · Markdown + 이미지](pdf-product-story-20260920.md). 2026-09-20 사용자가 제공한 특징이며 기존 Markdown 중심 소개보다 우선한다. 실제 앱 품질 검증과 사용자 설명을 구분한다. Higgsfield 이미지는 크레딧 부족으로 미생성 상태다.

1. [계획서 종합 리뷰 1.0](groundrooted-plan-review-v1.0.md): 현재 코드와 설계에서 발견한 27개 보완 항목.
2. [구현·운영 계획 1.0](groundrooted-implementation-plan-v1.0.md): 프런트엔드·백엔드·API·DB·인증·거래·앱·배포·운영의 실행 기준.
3. [통합 설계 v1.3](groundrooted-site-spec-v1.3.md): 브랜드·제품 경험, PDF to MD 상세 페이지 S01–S10의 기준.
4. [디자인 시스템 2.0](groundrooted-design-system-v2.0.md): CleanShot 참조와 사용자 금지 규칙, 적용 토큰. GRDS 1.0은 이전 기록이다.
5. [React Bits 적용 계획 1.0](groundrooted-react-bits-plan-v1.0.md): 다섯 범주·여섯 부품, Molten Metal 배경, 세 앱의 과정 탐색·결과 비교 및 수정/검수 기준.

구현·운영 계획은 기존 문서의 제품 경험을 유지하면서 기술 구현 계약을 구체화한다. 중복되는 내용의 우선순위는 해당 계획 1절을 따른다.

## 구현 착수 기준

**모델·품질 규칙:** [구현·운영 계획 14.1–14.3절](groundrooted-implementation-plan-v1.0.md)을 따른다. 기본 구현은 Astra High, 인증·결제·데이터 격리·어려운 버그는 Astra xHigh다. 비용 절감을 사용자가 선택한 경우에만 승인된 반복 작업에 Terra를 허용한다. PDF to MD 한 페이지를 먼저 구현·실제 화면 검수·사용자 확인·독립 검수하고 기준을 고정한 뒤 홈과 다른 제품으로 확장한다. 모델 설정은 실제 실행 환경에서 확인하며 문서 작성만으로 전환된 것으로 간주하지 않는다.

먼저 현재 HQ/고객 데이터의 격리, 런타임·설치 재현성, 제품 manifest와 실제 자산을 확인한다. 이어 공개 웹과 접근성/성능을 구현하고 계정·거래·실제 앱 통합으로 확장한다.

미정 정책과 자산은 구현·운영 계획 D01–D08, 단계별 완료 조건은 M0–M7, 검수 항목은 T01–T26에 있다. 원래 V01–V14 및 Q01–Q16의 요구는 모두 T 항목에 연결되어 있다. React Bits 필수 적용은 RB01–RB06/T25, 앱 소개의 이해·조작·실제 결과 대응은 AC01–AC03/T26으로 검사한다.

문서 검수 통과, 소스 구현, 자동 테스트, 실제 서비스/앱 실행, 배포 완료는 각각 별도의 증거로 기록한다.

## 2026-10-04 공개 사이트 개편

[스킬·저장소 선정과 구현·검수 기록](enterprise-upgrade-20261004.md). 공통 헤더·푸터, 메인/제품 선택 가이드, YouTube 자막 예시, ReadyMD 체험 배치와 브라우저 검수 스크립트를 포함한다.

## 네이버페이 판매 준비

[네이버페이 연동 경로와 주문·권한 발급 계획](naverpay-sales-plan-20261004.md). 가맹 상태와 첫 판매 상품 조건 확인 후 연동한다.
