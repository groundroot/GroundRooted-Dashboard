# GroundRooted 메인과 앱별 상세 페이지

> 2026-09-30: TypeCut Pro는 기존 사이트 `https://groundroot.github.io/typecut-pro/`를 사용한다. 메인·공통 앱 메뉴는 직접 연결하고 `/typecut-pro`는 그 주소로 307 이동한다. 아래 로컬 상세 페이지 설명보다 이 결정이 우선한다.

2026-09-29 사용자 지정 구조를 반영했다. GroundRooted가 브랜드 메인이고, 각각의 앱은 별도 소개·판매 페이지를 갖는다. 이번 구현은 소개 페이지와 탐색 구조까지다. 구매·결제·라이선스와 실제 배포는 연결하지 않았다.

| 순서 | 제품 | 상세 경로 | 로컬 근거 프로젝트 |
|---|---|---|---|
| 01 | ReadyMD 레디엠디 | `/pdf-to-md` | `nexus/Doc-to-Md-ePub-converter` |
| 02 | YouTube to MD | `/youtube-to-md` | `YouTube-Script-MD` |
| 03 | TypeCut Pro | `/typecut-pro` | `fcpcli` |

이 순서와 경로가 이전 계획의 `/typecut`, `/transcribe-grabber` 표기보다 우선한다. 메인 미리보기는 `http://127.0.0.1:3033/`다.

## 화면과 근거

- 메인은 사용 상황 → 앱별 쓰임 → 상세 페이지로 이어진다. 입력과 결과 도식은 개념도라고 표시한다.
- ReadyMD의 제작 이야기, 로컬 AI 비교, 비용 계산과 브랜드 문구는 유지한다. 푸터의 GroundRooted와 모든 앱 보기로 메인에 돌아온다.
- YouTube to MD는 `YouTube-Script-MD/README.md`, `macos/README.md`의 채널·영상 선택과 원문 자막 Markdown 저장을 설명한다. 없는 자막 생성이나 영상 다운로드를 약속하지 않는다. 개인용 Mac 빌드와 공개 배포를 구분한다.
- TypeCut Pro는 `fcpcli/README.md`의 Final Cut Pro 프로젝트 → 대본·자막 편집 → 편집 결과 확인 흐름을 설명한다. 베타 상태이며 가격·지원 버전·라이선스는 확정하지 않았다.
- 새 기능을 실제 실행한 결과나 앱 화면으로 도식을 제시하지 않는다.

## 내부 운영 화면 분리

기존 루트 HQ는 `/admin/hq`로 옮겼고 로그인 성공 후 그 경로로 이동한다. HQ는 요청 시 렌더링하며 검색 제외와 private/no-store 응답을 사용한다. 데이터 조회와 기존 인증 방식은 유지한다.

개발 환경 또는 `MARKETING_PREVIEW_ENABLED=true`일 때만 정확한 네 경로(`/`, `/pdf-to-md`, `/youtube-to-md`, `/typecut-pro`)를 공개 미리보기로 허용한다. 모든 소개 페이지는 noindex/nofollow다. production에서 비밀번호가 없으면 HQ 접근은 500으로 차단한다. 기존 개발 환경의 비밀번호 미설정 예외는 그대로다.

## 검증

- Node 24 production build 및 TypeScript 검사 통과.
- `scripts/test-storefront-routes.mjs`: 공개 네 경로·검색 제외·HQ 내용 미포함, 하위/미등록 경로 인증, 잘못된/없는/유효한 인증 쿠키, 비밀번호 미설정 차단, 미리보기 비활성 차단 통과. 유효 쿠키 검사는 존재하지 않는 관리자 경로를 이용해 실제 HQ 데이터 조회 없이 수행했다.
- Chromium: 세 신규 페이지의 320/390/768/1440px 가로 넘침 없음. 작은 개념도 설명의 대비를 수정한 최종본은 390/1440px에서 axe WCAG 2/2.1/2.2 A·AA 위반 0건. 세 앱 메뉴 이동과 메인 복귀, ReadyMD 푸터의 메인 링크를 확인했다.
- 화면 캡처는 브라우저의 CDP 응답 시간 초과로 미완료. DOM 확인과 자동 검사를 시각 검수로 간주하지 않는다.
- 실제 로그인 폼 제출·인증 후 HQ 데이터 화면, Safari/실기기, 제품 실행, 결제, 외부 배포는 미검증.

주요 파일: `products/catalog.ts`, `components/storefront/`, `app/page.tsx`, `app/admin/hq/page.tsx`, 각 제품 경로, `proxy.ts`.
