# GroundRooted 웹사이트 구현·운영 계획 1.0

> 2026-09-29 최신 사이트 구조: GroundRooted 메인 `/` → ① ReadyMD `/pdf-to-md` ② YouTube to MD `/youtube-to-md` ③ TypeCut Pro `/typecut-pro`. 내부 HQ는 `/admin/hq`. 이 순서·경로가 아래 과거 계획보다 우선한다. [구현·검수 기록](groundrooted-app-catalog-20260929.md). 현재 미리보기: `http://127.0.0.1:3033/`.

> 최종 시각 결정(2026-09-20): [DESIGN.md 2.0](../DESIGN.md)의 CleanShot 참조로 변경. **그림자·hover 효과·장식 외곽선 금지**가 이전 Raycast 및 Spotlight hover 요구보다 우선한다. 실제 키보드 포커스와 정보성 SVG 선은 유지한다. 아래의 Raycast 변경 기록은 중간 이력이며 활성 테마는 cleanshot.css다.

> 최신 제품 콘텐츠 계약: [로컬 OCR · EPUB · MD+이미지](pdf-product-story-20260920.md). EPUB 읽기 크기/재배치 체험과 MD 이미지 참조/폴더 연결을 첫 제품 페이지의 필수 설명으로 추가한다. 사용자 제공 특징과 실제 실행 검증을 분리하며, 이미지 지원은 AI 도구의 파일 접근/이미지 이해 조건까지 안내한다. Higgsfield 생성은 크레딧 부족으로 미완료다.

작성일: 2026-09-19  
개정일: 2026-09-20 — 모델·추론 수준 및 구현 품질 게이트 규칙 추가  
상태: PDF to MD 첫 페이지 로컬 구현·검수 / 전체 서비스 연결·출시 검증 전

**2026-09-20 최신 사용자 결정:** 설치한 루트 [DESIGN.md](../DESIGN.md)의 Raycast 디자인으로 변경한다. 이전 GRDS 시각 토큰보다 이 문서가 우선한다. Molten Metal은 dark neutral 설정으로 유지하고 React Bits 5개 범주와 앱 소개 인터랙션은 보존한다. B01 첫 페이지를 구현했으며 B02 사용자 확인·B03 독립 검수·B04 확장은 아직 완료하지 않았다. [구현/검증 기록](implementation-progress-20260920.md) 참조. §14 모델 규칙은 변경하지 않는다.

이 문서는 [제품 경험 설계 v1.3](groundrooted-site-spec-v1.3.md)와 [GRDS 1.0](groundrooted-design-system-v1.0.md)을 실제 제작 가능한 계약으로 보완한다. 홈·세 제품·공통 계정·구매·라이선스·기기·운영이라는 원래 범위를 유지한다. 상품 사실과 사업 정책을 임의로 확정하지 않는다.

우선순위는 **데이터 노출 방지 → 실제 제품 근거 → 접근 가능한 공개 웹 → 계정 → 검증된 거래·권한 → 실제 앱 연결 → 운영 검증**이다. 앞 단계의 미정 사항과 무관한 디자인·개발은 병행할 수 있다. 뒤 단계가 미완료인데 전체 사이트를 완성했다고 판정하지 않는다.

## 1. 문서와 결정의 기준

| 대상 | 기준 문서 | 충돌 시 처리 |
|---|---|---|
| 제품 가치, 루트 slug, PDF to MD S01–S10 | 통합 설계 v1.3의 1–18절 | 내용 유지. 실제 제품 확인 결과를 근거로 개정 |
| 색·서체·여백·모션·컴포넌트 상태 | GRDS 1.0 | 본 문서 6절의 누락 상태·접근성 보완을 함께 적용 |
| 이 저장소의 전환, 보안 경계, API, 데이터·운영 계약 | 이 문서 | v1.3의 개괄적인 19–22절보다 구체적인 구현 기준 |
| React Bits 다섯 범주의 필수 적용 | [React Bits 적용 계획](groundrooted-react-bits-plan-v1.0.md) | 사용자의 2026-09-19 추가 요구. 기존 선택사항·엔진 규칙보다 우선 |
| 구현 모델·추론 수준·첫 페이지 품질·독립 검수 | 이 문서 14.1–14.3절 | 사용자의 2026-09-20 지시로 작업 규칙화. 실제 모델 설정과 검수 증거를 별도 기록 |
| 문제의 근거와 보완 위치 | [계획서 리뷰](groundrooted-plan-review-v1.0.md) | 사실 확인과 설계 판단을 구별 |
| 가격·기기 수·환불·지원 환경·판매 국가 | 검증된 상품·정책 기록 | 문서의 예시·제안값으로 판매하지 않음 |

표의 수치 중 별도 근거가 없는 것은 내부 목표 또는 설계 제안이다. 실제 운영 결과나 고객 약속이 아니다. 구현 시 확인된 버전, 설정, 테스트 실행일·결과를 별도 검수 보고서에 남긴다.

## 2. 현재 저장소와 전환 방법

### 2.1 읽기 검사로 확인한 현재 상태

- 저장소는 Next.js 15 계열의 운영 대시보드다. 루트 페이지가 매출·프로젝트·AI 사용량을 읽는다.
- package.json에는 dev/build/start만 있다. Tailwind·Base UI·GSAP·고객 Auth·거래 서비스·검수 도구는 아직 선언되어 있지 않다.
- 로컬 Node는 26.7.0, 수집기 CI는 22다. 설계의 운영 기준 24와 다르다. 실제 설치 버전은 잠금파일·실행 결과로 별도 확인해야 한다.
- middleware.ts는 대부분의 경로를 하나의 대시보드 비밀번호로 잠근다. 로그인 성공은 루트로 돌아간다.
- 운영 SQL에는 authenticated 전체에 USING (true)로 읽기를 허용한 정책이 있다. 실제 원격 DB에 같은 정책이 적용되었는지는 이번에 조회하지 않았다.
- Stripe 경로는 운영 매출·이벤트 기록용이다. 주문·결제 검증·권한 발급 시스템이 아니다.
- 기존 .github/workflows/collect.yml은 수집 예약이며 웹 품질 검사나 출시 게이트가 아니다.
- website의 두 설계 문서는 작업 시작 시 Git 미추적 상태였다. 기존 문서·작업물을 보존한다.

### 2.2 대시보드와 스토어 전환 계약

1. 기존 대시보드 컴포넌트·수집기를 보존하고 운영 화면을 /admin/hq로 이동한다. /admin은 권한 있는 운영자의 진입 화면이다.
2. /와 제품 루트 경로는 공개한다. /login은 고객 이메일 인증으로 전환하고, 이전 HQ 로그인은 /admin/login으로 구분한다.
3. 운영 데이터 조회 함수에 server-only 경계를 두고 조회 진입점에서 운영자 권한을 확인한다. UI 숨김이나 proxy 경로 검사만으로 보호하지 않는다.
4. 공개 페이지 레이아웃은 고객 쿠키를 읽지 않는다. 개인 구매 상태는 별도의 비공유 응답으로 가져온다.
5. 기존 대시보드의 전체 인증사용자 RLS를 고객 Auth와 결합하지 않는다. 고객용 프로젝트 분리를 기본 배치안으로 삼는다.
6. 같은 Supabase 프로젝트를 사용해야 한다면 기존 테이블·view·RPC·Realtime·GRANT 전체를 먼저 조사하고 운영자 전용으로 변경·검증해야 한다. 두 고객 계정과 비로그인 계정으로 운영 데이터 접근이 0건/거부임을 증명한 뒤 가입을 연다.
7. 기존 Stripe 경로와 수집기 secret은 고객 상거래와 분리한다. 사용 여부를 확인하기 전 폐기하거나 Toss 경로로 재해석하지 않는다.
8. 비밀번호 기반 HQ 보호는 이전 중 임시 호환만 허용한다. 상용 운영자는 개별 계정, MFA, 서버 역할 조회, 감사 기록을 사용한다.
9. 이전 주소의 실제 사용·배포 상태를 확인한 뒤 리디렉션과 안내를 정한다. 현재 비공개 HQ URL을 공개 홈으로 바꾸기 전 배포 영향과 복귀 절차를 검토한다.

### 2.3 환경과 런타임

| 환경 | 데이터·인증 | 결제·메일 | 접근·검색 |
|---|---|---|---|
| local | 로컬 Supabase 또는 개발 전용 프로젝트·가상 사용자 | 테스트 PG, 메일 캡처 또는 승인된 테스트 수신자 | localhost, noindex |
| preview | 운영과 분리된 개발 프로젝트·합성 fixture | 테스트 키, 메일 수신자 제한 | 배포 접근 보호 + noindex |
| production | 운영용 프로젝트·백업·승인된 리전 | 계약된 상점·발신 도메인 | 공개 경로만 색인, 개인 경로는 서버 인가 |

Node 24를 .node-version 또는 .nvmrc, package.json engines, CI, Vercel에 함께 지정한다. pnpm은 packageManager로 버전을 고정하고 pnpm-lock.yaml 한 개를 웹 설치 기준으로 삼는다. npm 잠금파일 전환은 별도 변경으로 진행하고 frozen 설치·기존 수집기 회귀를 확인한다. 최신 major를 자동 설치하지 않고 Next 16/React 19 호환 패치를 선택한다. Next 16의 proxy 전환과 기본 빌더 차이는 공식 업그레이드 안내를 기준으로 검수한다. [공식 업그레이드 안내](https://nextjs.org/docs/app/guides/upgrading/version-16)

2026-09-19 npm registry 읽기 조회에서 확인한 후보는 Next 16.3.5, React 19.3.0, Tailwind 4.3.3, Base UI 1.8.0, GSAP 3.15.0, @gsap/react 2.1.2, @supabase/ssr 0.12.7, supabase-js 2.116.0이다. 조회는 이 버전들이 설치되어 있거나 함께 동작한다는 증거가 아니다. 실제 설치 전 peer dependency·보안 공지·빌드 호환을 확인하고 잠금파일로 고정한다.

필수 설정은 서버 시작/배포 검증에서 이름·형식·환경 조합만 확인한다. 값과 secret 원문은 로그에 남기지 않는다.

| 설정 그룹 | 필요한 값·분리 원칙 |
|---|---|
| 공개 사이트 | 승인된 SITE_URL, 공개/검토 모드, 지원 연락 경로 |
| 고객 Auth·DB | 스토어 전용 Supabase URL·publishable key, 서버 secret; 개발/운영 구분 |
| 기존 HQ | 기존 URL·service key·수집기 설정을 별도 이름/모듈로 유지 |
| 결제 | provider, test/live 구분, client/secret, 허용 결제수단 |
| 메일 | 발신 도메인·주소, Resend 서버 키, 테스트 수신 제한 |
| 운영 | CRON_SECRET, 오류 수집 환경, 경보 대상, 배포 식별자 |

환경변수가 없으면 관련 기능을 명시적으로 준비/설정 오류 상태로 둔다. 운영에서 인증·권한·거래 실패를 데모 데이터나 성공으로 대체하지 않는다.

### 2.4 HQ 이관 시 데이터 정확성

기존 lib/data.ts의 Supabase query.error와 전송 예외를 모두 구별한다. 운영 연결이 있는데 조회가 실패한 경우 빈 데이터나 데모 수치 대신 데이터 오류·마지막 성공 갱신 시각을 표시한다. 데모는 명시적인 개발/검토 모드에서만 허용한다.

매출은 통화별로 집계하고 환율 근거 없이 합산·USD 표시하지 않는다. 사업 시간대의 일/월 경계를 정해 조회하며 30일 차트 범위를 당월 전체 합계로 재사용하지 않는다. 31일 말일·월초·UTC/KST 경계를 검수한다. AI 비용 전체 행 조회는 데이터 양과 API 행 상한을 확인하고 DB 집계나 페이지 처리를 사용한다.

### 2.5 구현 파일과 산출물

기존 app 디렉터리를 유지하고 route group을 추가하는 구성을 기본으로 한다. 폴더 이동 자체가 기능 구현으로 집계되지 않게 한다.

~~~text
app/(marketing)/          홈·제품·공개 지원·정책
app/(auth)/              고객 로그인·OTP
app/account/             개인 계정·주문·기기
app/checkout/            견적·결제·처리 결과
app/admin/               개별 운영자 인증·관리·기존 HQ
app/api/                 버전 있는 API와 provider별 수신 경로
components/ui/           Base UI 기초, 생성 정보·접근성 상태
components/marketing/    제품별 hero·story·comparison·pricing
components/account/      보유 앱·주문·기기·계정 상태
lib/server/              인가·주문·결제·권한·작업 서비스
lib/supabase/            요청별 고객 client와 특권 client 분리
products/                ID·slug registry, Zod 검증
content/                 검토된 MDX, 자산·기능 근거 manifest
styles/                  GRDS semantic tokens·Tailwind 매핑
supabase/migrations/     검증된 이력 파일·DB 타입 생성 기준
stories/                 실제 부품 상태, 합성 데이터만
tests/                   로직·DB 권한·브라우저·경쟁 시험
docs/                    OpenAPI, 운영 절차, 정책 결정·검수 증거
~~~

첫 API 구현 전에 docs/openapi.yaml에 요청·응답·오류·보안 scheme·멱등 헤더를 고정한다. 제품 자산은 content/assets의 manifest, 검수 결과는 docs/verification, 배포·복구 절차는 docs/runbooks로 관리한다. 경로들은 계획된 산출물이며 현재 생성되어 있지 않다.

## 3. 전체 구조와 신뢰 경계

~~~mermaid
flowchart LR
  V[방문자] --> PUB[공개 홈·제품·지원]
  U[고객] --> WEB[인증·계정·결제 화면]
  WEB --> API[Next 서버: 세션·소유권·입력 검사]
  APP[실제 제품 앱] --> LIC[버전 있는 License API]
  LIC --> API
  A[운영자 + MFA] --> ADM[운영 API: 역할·재인증·감사]
  API --> AUTH[고객 Supabase Auth]
  API --> DB[주문·정책·권한 DB / RLS]
  ADM --> DB
  API --> PG[결제 사업자]
  PG --> INBOX[내구성 있는 이벤트 수신함]
  INBOX --> WORK[재조회·멱등 반영·복구 작업]
  WORK --> DB
  DB --> OUT[Outbox]
  OUT --> MAIL[메일 / 운영 매출 전달]
  API --> FILES[비공개 설치 파일]
  PUB --> MEDIA[검증된 공개 시연 자산]
  HQ[기존 HQ·수집기] --> HQDB[격리된 운영 데이터]
~~~

서버 내부도 요청별 고객 클라이언트와 특권 클라이언트를 분리한다. 고객 클라이언트는 요청마다 생성한다. 서버 secret은 좁은 서비스 모듈에서만 사용하고, 호출자가 전달한 user_id를 신뢰하지 않는다. 일반 고객 조회에는 자신의 JWT와 RLS를 우선 적용한다.

공개 콘텐츠/구매 정보/운영 통계는 서로 다른 응답 타입을 사용한다. RSC props·에러 본문·분석 이벤트에도 내부 테이블 행 전체를 전달하지 않는다. 외부 PG나 메일 호출 중에는 DB 트랜잭션 잠금을 잡아 두지 않는다.

## 4. 상품과 공개 콘텐츠의 기준 데이터

### 4.1 서로 다른 상태를 분리한다

| 축 | 값·의미 |
|---|---|
| publication | draft / preview / published: 페이지 공개 여부 |
| evidence | unverified / verified: 개별 주장·자산의 검증 여부 |
| availability | unknown / prelaunch / on_sale / suspended / retired: 신규 판매 상태 |
| identity | signed_out / verified / suspended: 계정 상태 |
| order·payment | 주문·결제 상태 전이는 9절 |
| entitlement | active / expired / revoked / suspended: 사용 권리 |
| device | not_applicable / unregistered / active / deactivated: 설치 연결 |

제품 자료가 없다는 이유만으로 실제 제품을 '개발 중'이라고 확정하지 않는다. 확인된 판매 상태를 표시하고 unknown에서는 결제 진입을 막는다. 신규 판매 중지는 기존 사용 권한을 자동 회수하지 않는다.

### 4.2 제품 manifest

필수 필드: product_id, slug, 이름, 검증된 설명, publication, evidence 목록, asset ID 목록, FAQ, 지원문서, 제품별 강조 토큰. 상거래 가격은 이 manifest에서 승인하지 않는다.

Zod 검증은 다음을 빌드 오류로 처리한다.

- 중복 product_id·slug, 예약 경로·대소문자·경로 이탈·잘못된 URL.
- 존재하지 않는 자산, 짝이 맞지 않는 원본/MD, 미검증 자산을 실제 결과로 표시한 경우.
- 게시 상태인데 필수 제품 사실·지원 연락·승인된 정책이 빠진 경우.
- 과거 사용 slug를 다른 product_id에 재할당하는 경우.

예약 경로는 login/account/auth/checkout/support/admin/api/terms/privacy/refund-policy와 robots.txt/sitemap.xml/_next/.well-known 등 시스템 소유 경로를 포함한다. 알려지지 않은 제품은 실제 404 상태를 반환한다.

### 4.3 실제 자산의 증거 기록

asset_id, kind, product_id, app_version, captured_at, source_owner, 공개 사용 권한, 입력 유형·설정, 원본·출력 경로, SHA-256, 크기, MIME, 해상도/재생시간, 언어, 배속/편집 여부, 제한, 검토자·검토일을 기록한다.

실제 앱 캡처, 설명용 그래픽, 내보낸 파일의 외부 활용을 구분한다. 원본 MD를 수정한 경우 수정본을 원래 앱 결과로 등록하지 않는다. 실제 자료 확보 전에는 내부 preview에만 설명용 화면을 둘 수 있다. 가짜 변환 진행률·후기·다운로드·가격은 만들지 않는다.

도입할 PDF.js 뷰어의 파일/페이지 제한은 웹 시연의 자원 예산이다. 이를 제품 자체의 지원 한도로 광고하지 않는다. 실제 제품 한도는 별도 facts에 저장한다.

| 기존 자산 ID | 확보·검수 책임과 연결 |
|---|---|
| A01·A02 | 실제 앱 화면·승인된 이름/아이콘 → 제품 facts, 홈/hero |
| A03·A04 | 요약/자세한 실제 영상 → 앱 version·샘플·배속, 자막·대체 설명 |
| A05·A06 | 공개 허가된 원본 PDF/실제 MD·추가 유형 → checksum·제한·T06 |
| A07 | 외부 활용 화면 → 별도 도구 표시·사용 권한 |
| A08 | 4단계 storyboard → desktop/mobile/reduced-motion·T05 |
| A09·A10 | 지원/처리 범위·구매/권리 정책 → facts·정책 version·주문 snapshot·T17 |
| A11·A12 | 실제 도움말/변경 이력·제품 공유 이미지 → 지원 route·OG·T18 |

## 5. 프런트엔드의 화면·데이터 계약

### 5.1 경로별 책임

| 경로 | 필수 구성 | 렌더링·접근 |
|---|---|---|
| / | 브랜드 가치, 세 앱과 확인된 상태, 대표 제품, 계정·지원 안내 | 공개 서버 HTML |
| /pdf-to-md | S01–S10, 제품 내비, 실제 결과, 조건·구매 패널 | 공개 콘텐츠 + 개인 패널 분리 |
| /typecut | 자막 편집에 맞는 설명·시연·정책 | 제품별 내용, 공개 허용 자료만 |
| /transcribe-grabber | 스크립트 확보·저장에 맞는 설명·시연·정책 | 위와 동일 |
| /:slug/help, /:slug/changelog | 검증된 사용법·실제 변경 이력 | 콘텐츠 확보 후 공개 |
| /login, /auth/verify | 이메일·동의·OTP·재전송·안전한 복귀 | 비공유, noindex |
| /checkout, /checkout/result | 서버 견적, 약관, PG, 실제 주문 처리 상태 | 인증·소유권, no-store |
| /account | 보유 제품·진행 주문 요약 | 인증, no-store |
| /account/library, /account/library/:slug | 권한, 설치·다운로드, 지원 버전 | 본인 소유권 |
| /account/orders, /account/orders/:id | 상태·금액·구매 당시 조건·영수증·문의 | 본인 소유권 |
| /account/licenses, /account/settings | 기기, 세션, 이메일 변경, 탈퇴 | 민감 작업 재인증 |
| /support | 안내·문의 접수·접수 결과 | 공개 안내, 접수는 남용 방어 |
| /terms, /privacy, /refund-policy | 승인 버전·시행일·운영자 정보 | 공개 HTML, 과거 버전 보존 |
| /admin, /admin/hq, /admin/* | 운영 현황·주문·환불·권한·재처리·콘텐츠 | 운영자+MFA, no-store |
| unknown, error, unavailable | 404·복구·재시도·지원 | 올바른 HTTP 상태 |

도움말·업데이트 파일이 없으면 링크를 노출하지 않는다. 정책 미확정 상태를 정식 약관처럼 게시하거나 빈 문서에 동의시키지 않는다.

### 5.2 렌더링과 캐시

- 공개 페이지는 Server Component와 정적 생성/공개 캐시를 사용한다. root layout에서 cookies/getUser를 호출하지 않는다.
- 제품 이름·가격·판매 상태의 공개 캐시는 게시/가격 변경 시 갱신한다. 긴급 판매 중지는 주문 API에서 즉시 재확인하므로 오래된 HTML로 결제할 수 없어야 한다.
- 고객·주문·권한·다운로드·세션 갱신 응답은 private, no-store. ISR 및 CDN 공유 캐시 대상에서 제외한다.
- 개인 PurchasePanel은 공개 페이지와 분리된 API로 확인한다. 미완료·네트워크 오류를 not_owned로 변환하지 않는다.
- 로그인/로그아웃/계정 변경 후 개인 상태를 폐기하고 재조회한다. 두 사용자·두 탭·뒤로 가기·prefetch·쿠키 갱신을 교차 검수한다.
- GSAP, PDF.js, MD 렌더러, PG SDK는 필요한 경로/시점에 분리한다. 공개 페이지에서 PG SDK·개인 전체 주문·대형 PDF를 미리 로드하지 않는다.

Supabase SSR의 setAll에서 쿠키와 SDK가 전달하는 캐시 헤더를 함께 반영한다. 공유 클라이언트·Set-Cookie 캐시 혼합이 세션 누출로 이어질 수 있으므로 실제 배포 응답을 검사한다. [SSR 캐시·세션 지침](https://supabase.com/docs/guides/auth/server-side/advanced-guide)

### 5.3 구매 상태 합성

PurchasePanel 입력은 product_id, availability, 서버가 확인한 계정·주문·권한의 좁은 DTO다. 상태 판정 순서:

1. 아직 조회 중/조회 실패이면 확인·재시도 상태를 유지한다.
2. 유효 권한이 있으면 판매 중지 여부와 무관하게 이용·관리 경로를 제공한다.
3. 진행 중인 주문/승인 불확실/권한 반영 지연이면 해당 주문으로 연결하고 재결제를 제한한다.
4. 환불·만료·차단은 사유와 이력을 표시하고, 정책이 허용하는 다음 행동만 제공한다.
5. 계정·기존 구매 확인 후 신규 구매 자격이 있고 상품도 판매 가능할 때만 구매 동작을 연다.

미로그인 고객의 '구매 조건 확인'은 허용하되 결제 주문 생성은 로그인 후 서버에서 수행한다. 헤더·가격·마지막 CTA는 같은 판정 결과를 공유한다. entitlement의 active와 기기 등록 필요 상태는 동시에 표현할 수 있다.

## 6. 디자인 시스템·접근성 보완

기존 Pretendard·뉴트럴/녹색·크기·radius 토큰은 유지한다. 다음을 GRDS의 구현 계약에 추가한다.

| 항목 | 보완 규칙 |
|---|---|
| 공통 구조 | 본문 바로가기, 하나의 의미 있는 h1, header/nav/main/footer, 명확한 제목 순서 |
| 내비게이션 | 모바일 메뉴 열기/닫기/Escape/포커스 복귀; 경로 이동 후 메뉴 닫기 |
| 링크와 버튼 | 이동은 링크, 상태 변경은 버튼; 본문 링크 비색상 단서; 아이콘 이름 |
| 키보드 | 자연스러운 DOM 순서, sticky에 가리지 않는 focus, 강제 포커스 점프 금지 |
| 탭 | 방향키/Home/End·탭 패널 연결; 대형 PDF 로딩은 수동 활성화 우선 |
| 비교 화면 | 320px에서 원본/MD/읽기 탭, 데스크톱 좌우; 확대·복사 실패 대체 |
| 폼·OTP | label/오류 연결, 붙여넣기·자동완성, 논리 입력 하나, 재전송·만료·메일 지연 |
| 중요 동작 | 환불·기기 해제 dialog에 대상·영향·확인·취소; 완료 결과 본문 유지 |
| 장기 대기 | 크기 유지, 설명·재시도·지원; 영구 spinner 금지 |
| 구매 상태 | checking/error/empty/long text/suspended/refund pending을 기본 상태와 함께 구현 |
| 반응형 | 320·390·768·1024·1440px, 200% 확대·400% reflow, 긴 한글/영문/금액 |
| 사용 환경 | 키보드, VoiceOver, Safari 실기기, forced-colors, reduced-motion |
| 오류 경계 | 페이지·개인 패널·시연의 오류를 분리해 핵심 설명과 지원 경로 보존 |

터치 목표 44×44px은 내부 사용성 기준이다. WCAG 2.2 AA의 최소 타깃 기준 24px 및 예외와 혼동하지 않는다. 큰 글자 대비 기준은 18pt(약 24 CSS px) 또는 굵은 14pt(약 18.7px)이며, 일반 18px 본문을 큰 글자로 간주하지 않는다. 실제 상태·투명도·배경에서 대비를 재측정한다. [WCAG 크기·예외](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [텍스트 대비](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)

GSAP은 desktop의 충분한 높이·정밀 포인터·모션 허용 환경에만 pin을 적용한다. 모바일·짧은 화면·모션 감소·로드 실패에서는 네 단계가 일반 흐름으로 모두 읽힌다. 단계 버튼은 기본 앵커로도 동작하게 하고 강화된 모션은 점진적으로 적용한다. 해시 직접 진입·역방향 스크롤·resize·라우트 왕복 시 중복 pin/트리거가 없어야 한다.

영상은 poster와 설명을 먼저 제공한다. 자동 재생 실패·저전력·데이터 절약·background 탭·화면 이탈 시 정지/수동 재생을 지원한다. 소리가 있으면 자막·텍스트 설명을 추가한다.

Figma의 여섯 영역과 Storybook 상태 카탈로그는 원 설계대로 산출물에 포함한다. 연결되지 않은 Figma 파일이나 실행하지 않은 Storybook을 생성 완료라고 표기하지 않는다. Dialog/Tabs/Accordion 같은 접근성 기초는 Base UI 계열로 통일하고 shadcn 생성 도구·소스 revision을 기록한다. React Bits의 시각 부품은 이 동작 기초와 결합한다.

### 6.1 React Bits 필수 도입

사용자 요구에 따라 Backgrounds=Molten Metal, Animations=AnimatedContent, Micro=StatusMark, Components=SpotlightCard·Stepper, Text Animations=SplitText를 실제 페이지에 적용한다. 다섯 범주·여섯 부품이며 [별도 적용 계획](groundrooted-react-bits-plan-v1.0.md)에 공식 소스·위치·의존성·접근성/성능 수정·고지·검수 기준을 확정했다.

대표 모션은 GSAP을 유지하고 motion/react는 StatusMark·Stepper에, OGL/WebGL 2는 Molten Metal에 한정한다. 같은 DOM 속성을 두 엔진이 제어하지 않는다. 원본 AnimatedContent의 초기 invisible, Molten Metal의 lightMode uniform 미반영·정적 실패 대안 부재, Stepper의 비버튼 단계 선택·초기 높이 0·마지막 결과 소실, StatusMark의 기본 취소선/영문/모션 감소 상태 등을 수정한다. 다섯 범주 적용의 완료는 T25의 실제 렌더링 증거로 판정한다.

### 6.2 앱 소개 컴포넌트와 이해 검수

앱 소개는 카드 나열을 넘어 입력→과정→결과→제한을 직접 탐색하게 한다. React Bits 계획 AC01–AC03를 기준으로 각 앱에 WorkflowDemo(Stepper adapter)와 실제 결과 확인 영역을 배치한다. PDF는 원본/MD/읽기 비교, Typecut은 자막 편집 과정·같은 구간의 전후 비교, 그랩퍼는 스크립트 확인·저장 결과를 보여준다. 제품별 확인되지 않은 기능은 공개 시연으로 만들지 않는다.

제품 manifest에 실제 demo의 입력·출력 형식, 샘플·앱 버전, 단계별 화면/녹화/결과·출처/권리/checksum·제한을 연결한다. 단계 선택과 실제 앱 처리 상태는 분리하며 첫 구현은 공개 샘플 탐색이다. 새로운 업로드/변환/수집 API는 이 설명용 컴포넌트 때문에 추가하지 않는다. 탭·복사·공개 샘플 다운로드만 웹에서 실제 수행하고 상태를 사실대로 표시한다.

본문 요약과 첫 화면은 SSR에서 읽히고, 무거운 뷰어·모션은 조작/가시성에 따라 분리 로드한다. 전환 시 크기 예약·초점·현재 단계·모션 감소·실패 대안을 갖추고 마지막 결과를 숨기지 않는다. 앱별 입력과 결과의 관계를 설명할 수 있는지, 키보드로 전 과정을 탐색하고 실제 결과를 확인할 수 있는지를 T26으로 검수한다.

## 7. 백엔드·API 계약

### 7.1 공통 계약

- API와 Server Action 모두 경계에서 Zod 검증 → 서버 인증 → 객체 소유권/역할 → 상태 전이 순으로 검사한다.
- 쿠키 기반 쓰기는 허용 Origin/Host와 CSRF 방어를 적용한다. 외부 앱 Bearer 요청은 별도 경로이며 CORS 허용목록을 사용한다. wildcard CORS와 인증 쿠키를 결합하지 않는다.
- 사용자 ID는 검증된 세션에서 얻는다. 클라이언트 금액·통화·권한 상태·스토리지 경로를 인가 근거로 사용하지 않는다.
- POST/PATCH는 목적별 request ID, timeout, 입력 크기 제한, 지속성 있는 속도 제한을 가진다. serverless 인스턴스 메모리만으로 제한하지 않는다.
- 금액은 통화별 정수 최소 단위, 날짜는 UTC timestamptz, 표시는 명시적인 사용자/사업 시간대를 사용한다. USD식 100 나누기를 KRW에 공통 적용하지 않는다.
- 요청에는 Idempotency-Key와 서버에 저장한 actor·operation·payload hash를 연결한다. 동일 키+다른 본문은 409, 동일 재시도는 기존 처리 결과/진행 상태다.
- 표준 오류: code, 사용자용 message, request_id, retryable, 필요 시 retry_after. 내부 SQL·PG raw error·stack·토큰은 응답하지 않는다.
- 401/403/404/409/422/429/503을 구분한다. 다른 사용자의 주문 존재를 누출하지 않도록 소유권 위반은 일관된 404로 처리한다.
- 페이지 목록은 상한이 있는 cursor pagination이다. 계정의 전체 이력을 초기 payload로 보내지 않는다.

### 7.2 엔드포인트와 권한

| 메서드·경로 | 인증·검증 | 결과·실패 처리 |
|---|---|---|
| POST /api/auth/otp/request | 이메일 형식, 동의 경로, Origin, 속도 제한 | 중립 응답·재전송 시각; 자동 신규 가입 통제 |
| POST /api/auth/otp/verify | 도전·OTP·만료·시도 제한 | 세션, 가입 완료/복귀; 코드는 로그 금지 |
| POST /api/auth/logout | 현재 세션, Origin | 선택한 세션 종료; 상태 폐기 |
| GET /api/me | 검증된 세션 | 최소 계정 DTO, no-store |
| GET /api/products/:id/purchase-state | 세션 또는 signed_out | checking 실패는 503; 미구매로 대체 금지 |
| POST /api/checkout/quote | 사용자, product ID, 현재 정책 | 만료 있는 서버 견적·가격/조건 version |
| POST /api/checkout/orders | 사용자·동의·견적·기존 소유·멱등 | 대기 주문 또는 기존 주문/가격 변경 409 |
| POST /api/payments/toss/confirm | 주문 소유, 저장 금액·통화·상점·paymentKey 결합 | 최종 반영 또는 processing; 새 결제 금지 |
| POST /api/webhooks/toss | provider 검증 규칙, 크기·재전송·남용 방어 | durable inbox 후 ACK; payload만으로 발급 금지 |
| GET /api/orders, /api/orders/:id | 본인 user_id 및 항목 관계 | 상태·구매 snapshot·허용된 영수증 링크 |
| POST /api/orders/:id/refund-request | 본인 주문·재인증·멱등 | 문의/심사 상태; 즉시 환불 완료로 표시 금지 |
| GET /api/library | 본인 권한과 공개 release | 사용/업데이트 권리와 기기 상태 분리 |
| POST /api/downloads | 본인 권한, 제품·OS·버전·배포 상태 | 짧은 서명 URL, 없으면 명확한 오류 |
| POST /api/v1/licenses/check | 앱 Bearer, 제품·계정·권한·설치 검사 | valid/invalid/unavailable를 분리 |
| POST /api/v1/activations | 앱 Bearer·등록 정책·원자적 한도 검사 | 재등록 멱등, 한도 초과 409 |
| POST /api/activations/:id/deactivate | 본인 소유·재인증·멱등 | 해당 기기만 해제, 주문·권한 유지 |
| POST /api/support/tickets | 입력 제한·남용 방어; 주문 연결은 본인 | 실제 접수번호, 내구성 있는 저장·메일 재시도 |
| POST /api/admin/* | 현재 운영 역할+MFA+재인증+사유 | 변경별 감사 기록, 고객 endpoint와 분리 |
| GET /api/cron/reconcile | CRON_SECRET·작업 lease | bounded batch, 겹침·중단 복구 |

쓰기 GET은 Cron provider의 트리거 제약처럼 명시된 내부 경로에만 허용하며, 고객 GET으로 결제·환불·기기 해제를 실행하지 않는다. checkout/result의 query string만으로 승인하거나 사용 권한을 부여하지 않는다.

## 8. 데이터 모델·권한·마이그레이션

### 8.1 최소 핵심 테이블

| 테이블 | 핵심 필드·제약 |
|---|---|
| profiles | auth user UUID, 계정 상태, enrollment 상태; 이메일은 소유권 PK가 아님 |
| consent_records | user_id, 문서 종류·불변 version, 시점·경로; 필수/선택 분리 |
| products | 고유 UUID, 유일한 slug, 공개/판매 상태; 시스템 예약어 금지 |
| product_slug_history | 과거 slug UNIQUE, product_id; 다른 제품에 재사용 금지 |
| prices | product_id, 정수 amount, currency, 활성 기간, version; 음수·중복 활성 방지 |
| policy_versions | 기간·업데이트·기기·환불·추가 비용·지원 조건; 게시 후 불변 |
| checkout_intents | user_id+product_id UNIQUE, 현재 order, 처리 상태·lease; 동시 주문 조정점 |
| orders | user_id, 상태, 합계·통화, 공개 참조번호, 생성·만료·완료 시각 |
| order_items | order_id, product_id, 수량, 금액·이름·정책 snapshot; 과거 주문 보존 |
| payments | provider+상점+환경+payment_key UNIQUE, order_id, 상태·금액·대사 시각 |
| payment_events | provider event ID 또는 검증된 중복 키 UNIQUE, inbox 상태·해시·처리 시각 |
| refunds | 원천 payment/item, 금액, 승인·PG·DB 반영 상태, 멱등키 UNIQUE |
| entitlements | user/product, 원천 order_item 또는 감사된 grant, 상태·기간·정책; 원천 중복 발급 금지 |
| license_accounts | user_id+product_id UNIQUE, 잠금·권한 version; 등록 경쟁 조정점 |
| activations | license_account_id, 근거 entitlement, installation_id, 이름·OS·상태·시각 |
| releases | product/version/OS/architecture UNIQUE, path·sha256·서명 상태·게시 상태 |
| outbox_jobs | 종류·업무 중복키 UNIQUE, 상태·시도·실행시각·lease·실패 사유 |
| idempotency_requests | actor+operation+key UNIQUE, payload hash·결과 참조·보존 시각 |
| support_tickets | 작성자·검증된 주문 참조, 제목·본문, 상태·접수번호 |
| operator_roles / audit_logs | 서버 관리 역할·작업자·사유·대상·전후 변경·request_id |

주문 항목·가격·권한·기기 한도는 CHECK/외래 키/고유 제약과 트랜잭션으로 보장한다. (user_id, product_id) 하나의 영구 UNIQUE entitlement로 모든 구매 이력을 합치지 않는다. 환불 후 재구매·다른 정상 권한을 구별해야 한다.

기기 등록 중복은 최소 (license_account_id, installation_id)로 방지한다. 중복 클릭/동일 설치 재시도는 새 자리를 소비하지 않는다. 유효 grant가 여럿이면 접근 가능 여부는 정상 grant 전체로 판단하고, 기기 한도·업데이트 범위의 합산 규칙은 상품 정책으로 명시한다. 첫 판매는 단일 제품·수량 1 구매를 기본 구현 단위로 하고 번들·선물·팀·구독을 자동 추가하지 않는다. 향후 범위를 삭제한 것이 아니며 도입 시 별도 상태 계약을 만든다.

### 8.2 권한 매트릭스

| 주체 | 공개 상품 | 본인 주문·권한 | 중요 쓰기 | 운영 데이터 |
|---|---|---|---|---|
| anon | 게시된 안전한 필드만 | 불가 | 불가 | 불가 |
| customer | 공개 상품 | 본인만 SELECT | 검증된 서버 API 경유 | 불가 |
| verified operator | 공개 상품 | 업무 권한 범위의 서버 조회 | MFA·감사·사유 있는 API | 허용된 운영 범위 |
| service job | 작업에 필요한 범위 | 업무 처리 범위 | 제한된 RPC/서비스 모듈 | 지정된 수집기만 |

노출 테이블에는 RLS와 명시적인 최소 GRANT를 함께 둔다. 주문 항목·기기는 부모 객체를 따라 소유자를 검사한다. UPDATE에는 USING와 WITH CHECK, 고객 SELECT에는 (select auth.uid()) = user_id 조건과 인덱스를 적용한다. client에서 paid/role/entitlement를 쓰는 권한은 없다. [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)

view는 필요 시 security_invoker로 정의하고 원 테이블 권한을 우회하지 않게 한다. SECURITY DEFINER는 일반 오류 해결책으로 사용하지 않는다. 필요한 함수는 비노출 schema, 고정 search_path, 명시적 인가·호출 역할, PUBLIC 실행 철회와 함께 검수한다. Auth 없는 서버 전용 함수와 auth.uid()가 필요한 고객 함수의 인가 모델을 섞지 않는다.

### 8.3 인덱스·이력·운영

- 고객 목록: orders(user_id, created_at DESC, id), entitlements(user_id, product_id, status).
- 기기·release: activations(license_account_id, status), releases(product_id, published_at, platform).
- 작업 큐: 처리 가능한 상태+next_attempt_at, lease 만료 조회. 부분 인덱스는 실제 쿼리 predicate와 일치시킨다.
- 참조 키·RLS 필터·정렬 인덱스를 실제 실행 계획으로 확인한다. 0건 데이터의 빠른 쿼리만으로 성능을 판정하지 않는다.
- 금액·권리 만료는 서버/DB 시간으로 판정한다. 브라우저 시간은 표시용이다.
- 계정 삭제가 주문·환불·감사 기록을 CASCADE 삭제하지 않게 한다. 필요한 보존·비식별화 정책과 연동한다.
- 운영 대시보드에는 고객 상거래의 검증된 집계를 별도 전달한다. 원본 고객 테이블을 기존 수집기 RLS에 노출하지 않는다.

마이그레이션은 개발 DB에서 작성·검증한 뒤 이력 파일로 고정한다. 새 빈 DB와 기존 데이터가 있는 DB에 모두 적용하고 생성 타입을 갱신한다. 운영에는 리뷰한 migration만 적용한다. 확장→전환→정리 순서로 이전 웹 버전과 공존하며 파괴적 변경 전 복구 가능성을 검증한다.

## 9. 결제·환불·복구 계약

### 9.1 견적과 중복 결제

견적은 서버 상품·price version·policy version·유효시간을 묶는다. 주문 생성 시 판매 상태·지원 정책·소유권·진행 주문을 다시 확인한다. 가격 변경은 409/PRICE_CHANGED와 새 조건을 반환하고 재확인을 받는다.

checkout_intents의 고객+제품 행을 잠그고 대기 주문을 만들거나 기존 주문을 반환한다. 같은 사용자의 두 탭·다른 멱등키 요청도 직렬화한다. lease 시간 만료만으로 기존 결제를 실패 처리하고 새 주문을 열지 않는다. PG 거래 상태를 대사한 뒤 재시도를 허용한다.

국내 KRW 가정의 Toss v2는 조건부 선택이다. 판매 국가·계약·통화 확정 전 테스트 어댑터만 만든다. PG client/secret·상점·환경을 검증하고 성공 URL 값을 서버 저장 주문과 비교한다. [Toss 주문서형 연동](https://docs.tosspayments.com/guides/v2/payment-widget/integration)

### 9.2 주문·결제·권한은 각각 전이한다

| 현재 → 다음 | 전이 조건 | 고객 화면 |
|---|---|---|
| created → pending | 서버 주문 저장, PG 진행 | 결제 진행 |
| pending → processing | 승인 요청 또는 결과 불확실 | 확인 중, 중복 결제 차단 |
| processing → paid | PG 최종 성공과 주문·금액·통화·상점 일치, 원자 DB 반영 | 구매 완료/제품 준비 |
| pending/processing → failed 또는 canceled | PG의 확정 실패/취소 확인 | 실제 사유와 안전한 재시도 |
| pending → expired | 미결제·PG 미승인을 확인한 만료 처리 | 새 조건 확인 후 재시도 |
| paid → refund_pending | 유효한 환불 업무 시작 | 환불 확인 중 |
| refund_pending → refunded | PG 취소 확인 + 해당 권한 회수·감사 기록 원자 반영 | 환불 완료, 주문 이력 유지 |
| refund_pending → paid | 확정된 취소 실패/철회 | 사용권 유지, 처리 결과 |

확정 refunded/revoked를 늦은 paid 이벤트만으로 되살리지 않는다. disputed/chargeback·부분취소 등 지원 범위 밖의 PG 상태는 무시하지 않고 판매/자동 발급을 보류해 운영 검토로 보낸다. 내부 만료 뒤 PG에서 결제가 발견되면 일반 failed가 아니라 reconcile_required로 처리하고 승인 사실을 보존한다.

가상계좌·비동기 결제는 입금 대기와 실제 완료를 구분해야 한다. 첫 출시에서 제외할 경우 PG 상점/공식 설정에서도 막고 테스트한다. PG 화면에서 선택 가능한 수단을 프런트 CSS로만 숨기지 않는다.

### 9.3 승인과 원자 반영

1. 인증된 요청의 주문·구매자·견적·멱등키를 검증하고 시도 상태를 저장한다.
2. DB 잠금 밖에서 PG 승인/조회를 수행한다. timeout이면 불확실 상태를 저장하고 조회 복구를 예약한다.
3. PG의 최종 상태·상점·환경·orderId·paymentKey·금액·통화를 검증한다.
4. DB 함수의 짧은 트랜잭션에서 주문/결제 갱신, 원천별 entitlement, outbox, 감사 기록을 함께 반영한다.
5. 응답이 끊겨도 재시도는 같은 주문·권한·결과를 반환한다. 메일 실패는 결제나 권한을 취소하지 않는다.

PG의 요청 멱등 기능은 사용하는 API별 지원 범위와 보존 기간을 확인해 적용한다. 우리 DB의 업무 멱등성은 별도로 필수다. [Toss API 레퍼런스](https://docs.tosspayments.com/reference)

### 9.4 웹훅·inbox·outbox

- provider가 실제 제공하는 인증/서명/secret 방식을 확인한다. 모든 Toss 이벤트에 Stripe식 서명 헤더가 있다고 가정하지 않는다.
- 검증된 최소 이벤트를 durable inbox에 저장한 뒤 ACK한다. 저장 실패는 성공 ACK하지 않는다.
- 외부 알림 자체를 최종 결제 사실로 신뢰하지 않는다. 필요 시 secret으로 PG 거래를 재조회해 알려진 주문과 대조한다.
- 동일 전송뿐 아니라 의미가 같은 다른 event ID도 원천 결제/주문 제약으로 중복 발급을 막는다.
- PG가 제시한 응답 시간 내 수신을 끝내고 무거운 후처리는 worker로 수행한다. Toss 문서는 10초 이내 ACK 및 재전송을 안내하므로 장기 작업을 웹훅 요청에 묶지 않는다. [Toss 웹훅 규칙](https://docs.tosspayments.com/guides/v2/webhook)
- queue claim은 FOR UPDATE SKIP LOCKED 후 lease를 기록하고 commit한다. 네트워크 호출은 그 뒤에 수행한다.
- 완료/재시도 갱신은 lease 소유 토큰을 대조한다. 만료된 worker가 새 worker의 결과를 덮어쓰지 못하게 한다.
- 지수 backoff+jitter·재시도 상한·dead letter·경보·수동 재처리를 둔다. 중단 worker의 lease를 회수한다.
- Cron 겹침·누락을 전제로 주기적으로 pending/processing/PG 성공-DB 미반영/취소 불일치를 대사한다. 외부 호출 없이 보유 상태만 다시 읽는 것은 복구가 아니다.

### 9.5 환불

고객 요청과 운영자의 PG 취소 실행을 분리한다. 요청자는 자기 주문만 지정할 수 있고, 운영자는 최신 역할·MFA·대상 금액·정책·사유를 확인한다. 취소 요청도 멱등키를 가진다. PG 응답 불확실 시 자동으로 '실패'나 '환불 완료'로 확정하지 않는다.

환불 확인 후 해당 원천 주문 항목의 grant만 회수한다. 다른 정상 grant가 있으면 접근 권리가 남는다. 기존 서명 URL·오프라인 증명은 만료 전 접근 가능할 수 있으므로 10절의 철회 반영 지연과 일치시킨다.

## 10. 계정·앱 인증·다운로드

### 10.1 가입·로그인·동의

이메일 OTP 요청은 기존 로그인과 신규 가입 경로를 구별한다. 로그인은 shouldCreateUser:false를 기본으로 하고, 신규 가입은 유효한 필수 동의 후에만 자동 생성을 허용한다. OTP 메일 템플릿·자릿수·유효시간·재전송 간격을 실제 Auth 설정과 맞춘다. signInWithOtp라는 메서드명만으로 숫자 OTP가 발송되는 것은 아니므로 템플릿까지 확인한다. [Supabase 이메일 인증](https://supabase.com/docs/guides/auth/auth-email-passwordless)

가입 동의는 서버가 서명한 만료 있는 enrollment 상태와 연결한다. OTP 검증 후 실제 user UUID에 정책 version·시각을 원자 기록하고 enrollment를 완료한다. 동의 저장 실패 상태에서는 결제·민감 작업을 열지 않는다. 클라이언트 체크박스나 수정 가능한 user_metadata만으로 동의를 증명하지 않는다.

중립적인 요청 응답, 계정별/IP별 지속성 있는 요청·검증 제한, OTP 재사용·만료 검사, 메일 지연·반송 안내를 제공한다. 마케팅 동의는 선택이며 인증·구매 메일과 구분한다. 이메일을 URL·분석 이벤트에 넣지 않는다.

세션은 공식 SSR SDK를 따른다. getSession의 객체만으로 서버 권한을 승인하지 않는다. 일반 검증과 최신 계정/세션 확인이 필요한 민감 작업을 분리하고 로그아웃·계정 정지·역할 철회 시 효과를 시험한다. 인증된 브라우저 SDK를 사용하는 구조에서 모든 토큰이 HttpOnly라고 약속하지 않는다.

복귀 경로는 같은 origin의 허용 경로만 사용한다. protocol-relative·외부 URL·인코딩된 우회·역슬래시를 거부한다. 인증 후 자동 결제는 실행하지 않는다. 현재 세션 종료와 전체 기기 로그아웃을 UI·API에서 구분한다.

### 10.2 운영자

운영 권한은 서버 관리 role 레코드로 판정하고 각 중요 요청에서 최신 상태를 확인한다. 일반 고객 가입으로 역할을 얻을 수 없다. MFA 미완료·권한 철회·최근 재인증 만료 시 환불/권한 수동 발급/가격·release 게시를 거부한다. [Supabase MFA](https://supabase.com/docs/guides/auth/auth-mfa)

최초 운영자 bootstrap과 잠금 해제는 배포 비밀 또는 관리 콘솔의 제한된 절차로 기록한다. 웹에 공개된 '첫 사용자 관리자'나 공유 비밀번호 자동 승격은 만들지 않는다.

### 10.3 제품 앱과 기기

실제 앱의 언어·배포 방식은 유지한다. 앱은 공통 계정의 Bearer 토큰으로 버전 있는 API를 호출하고 Keychain 등 해당 OS의 자격증명 저장소에 보관한다. 웹 쿠키를 복사하거나 서버 키를 앱에 넣지 않는다.

기기 등록은 user+product의 license_accounts 행을 잠그고 최신 grant·계정 상태·활성 개수를 검사한 뒤 하나의 트랜잭션으로 기록한다. 두 기기가 마지막 한 자리를 동시에 얻지 못하게 한다. 환불/해제/등록 역시 같은 잠금 순서를 따른다.

installation UUID는 개인정보 최소화와 중복 인식을 위한 식별자이며 그 자체가 복제 방지 증명은 아니다. 더 강한 기기 결합이 필요하면 설치별 키쌍·challenge 서명을 별도로 검수한다. 이를 구현하지 않고 DRM/복제 불가를 주장하지 않는다.

온라인 확인 주기, 통신 장애 시 처리, 오프라인 허용·유예, 최대 철회 지연, 기기 이전 한도는 상품 정책 결정 항목이다. 통신 오류를 invalid 라이선스로 오인하지 않고 unavailable로 반환한다. 오프라인을 선택하면 서명·만료·제품/기기 binding·키 교체·시계 조작·철회 지연 시험을 출시 게이트에 추가한다.

### 10.4 다운로드·업데이트

공개 시연과 설치 파일은 버킷을 분리한다. 다운로드 요청은 제품·본인 권한·지원 OS·architecture·사용/업데이트 권리·release 게시 상태를 검사한다. 서버가 DB의 경로를 선택하며 클라이언트의 임의 storage path를 사용하지 않는다.

서명 URL은 짧은 TTL(초기 제안 120초), no-store 응답, query 로그 마스킹을 적용한다. 이미 발급된 링크의 만료 전 재사용 가능성과 파일 다운로드 후 복제 가능성을 설명한다. 환불의 즉시 철회 가능 범위를 과장하지 않는다.

release에는 버전·checksum·서명/공증 검증·파일 크기·지원 환경·변경 이력·롤백 버전을 기록한다. 버전 게시 전 실제 설치→로그인→등록→실행→해제→환불 후 확인까지 수행한다. 평생 사용권과 업데이트 기간이 다르면 다운로드 가능한 마지막 버전도 구별한다.

## 11. 보안·개인정보·고객지원

| 영역 | 필요한 구현·검증 |
|---|---|
| 인증·인가 | 계정 열거·OTP 남용·IDOR·관리자 권한 상승·세션 철회 시험 |
| 요청 | Origin/CSRF, Zod, body 크기, timeout, idempotency, 지속 속도 제한 |
| 브라우저 | CSP report-only 검수 후 enforce, 허용 script/frame/connect/image origin 최소화 |
| 헤더 | HTTPS, nosniff, Referrer-Policy, frame-ancestors, 필요한 Permissions-Policy |
| MD·PDF | raw HTML/iframe 실행 금지, URL allowlist, 외부 이미지 기본 차단, 스크립트 없는 검증 샘플 |
| 서버 URL | 임의 원격 PDF fetch API 금지; SSRF 위험 경로 만들지 않음 |
| 키 | 서버 모듈 경계, 환경 분리, 번들/소스맵 secret 검사, 회전·폐기 절차 |
| 공급망 | 고정 버전·lockfile, 의존성/라이선스 검사, 사용하지 않는 패키지 제거 |
| 로그 | 이메일·OTP·token·문서 내용·서명 URL·카드정보 제거; request/order의 안전한 참조 |
| 계정 수명 | 이메일 변경 재인증, 탈퇴·세션 철회, 보존 대상과 삭제 대상 분리 |
| 문의 | 실제 지원 주소/접수함, 접수번호, 제품·버전·오류 식별자, 운영 처리 상태 |
| 문서 | 약관·개인정보·환불·판매자 정보·지원 범위·추가 비용·시행일·변경 이력 |

CSP는 정적 HTML/캐시 방식과 조정한다. nonce가 필요한 곳만 동적화하거나 검증된 hash 방식과 호환성을 평가한다. 정책을 넣었다는 이유로 Next hydration·Toss iframe·Supabase 호출이 작동한다고 가정하지 않는다.

최초 지원 문의에는 고객 PDF/민감 원문 업로드를 요구하지 않는다. 첨부가 필요해지면 비공개 저장·검사·기한 삭제·지원자 권한을 별도로 설계한다. 문의 접수는 DB 저장 성공 후에만 완료라고 표시하고 메일은 outbox로 전달한다.

판매 국가와 사업자에 맞는 고지·청약철회·세금/영수증·개인정보 위탁/국외 이전·보존 기간을 확정한다. 법정 기간·환불 일수·국외 이전 적합성을 이 설계에서 추정하지 않는다. 승인되지 않은 약관이 공개 판매를 통과하지 못하도록 체크한다.

## 12. SEO·성능·계측

### 12.1 검색·공유

제품별 title/description/canonical/OG, 아이콘·한국어 lang, 실제 공개 경로만 sitemap에 포함한다. 정책·지원도 읽을 수 있는 HTML로 제공한다. 가격/평점/판매 상태가 검증되기 전 Offer·aggregateRating 구조화 데이터를 만들지 않는다.

도메인 미확정 시 가짜 canonical을 운영에 내보내지 않는다. preview는 noindex와 접근 보호를 함께 적용한다. robots.txt/noindex는 인증의 대체물이 아니다. 삭제된 제품은 기존 사용자 지원을 유지하며 404/410/리디렉션 정책을 결정한다. 초기 언어는 한국어이며 번역본이 없으면 hreflang·언어 스위치를 만들지 않는다.

### 12.2 성능 예산과 실험 조건

| 항목 | 내부 목표·방법 |
|---|---|
| 초기 JS | 제품 경로 gzip 전송 250KB 이내; 실제 요청 합산, 지연 chunk 구분 |
| 초기 전체 | HTML/CSS/JS/첫 화면 이미지/폰트 합계 1MB 이내 |
| poster | desktop 250KB, mobile 150KB 이내를 출발 예산으로 사용 |
| 폰트 | 자체 WOFF2 subset, 필요한 범위만 preload, fallback/라이선스 포함 |
| 뷰어 | PDF.js worker 버전 일치, 사용자 요청/근접 시 로드, 취소·메모리 해제 |
| 영상 | desktop 5MB/mobile 3MB 편집 목표, 가시 영상 1개, 사용자 시작 대안 |
| Molten Metal | 활성 WebGL canvas 1개, 가시성/사용자 정지·모션 감소 반영, OGL 분리 로드·정적 실패 대안; 초기 30fps 목표 실측 |
| 서버 | 초기 제안 내부 DB/API p95 500ms, PG·메일 외부 지연은 별도 보고 |
| 레이아웃 | 미디어·개인 패널 크기 예약, CLS ≤0.1 |
| 현장 목표 | mobile/desktop 각각 p75 LCP ≤2.5s, INP ≤200ms |

Lighthouse는 production build에서 대표 경로·mobile/desktop·고정 버전·cold cache 조건으로 최소 3회 측정하고 중앙값·편차·장비·throttle을 기록한다. 점수와 자원 예산을 함께 검토한다. Lighthouse/TBT를 실제 사용자 INP라고 보고하지 않는다. 실제 방문 데이터가 충분하기 전 RUM 목표는 미검증이다. [Web Vitals 측정 기준](https://web.dev/articles/vitals)

MD 복사·탭·FAQ·상품 탐색의 지연, Android 저사양/실제 iPhone Safari, viewport 회전·백그라운드 복귀도 검수한다. 최적화 전후 동일 조건의 보고서를 보존한다. 예산 초과를 숨기지 않고 원인·개선 또는 근거 있는 예외를 기록한다.

### 12.3 오류·이벤트·비용

Sentry 등 오류 수집은 환경·release·request_id 중심이며 본문·이메일·OTP·token을 제거한다. Session Replay는 초기 비활성이다. web-vitals 수집 endpoint도 입력 크기·속도 제한·허용 필드를 검사한다.

마케팅 이벤트는 제품 ID·행동·비식별 세션 범위로 최소화한다. 구매 완료 집계는 PG 검증 후 서버 주문을 기준으로 한다. 동의 필요 범위와 수집 목적이 정해지기 전 추적을 자동 활성화하지 않는다.

트래픽·시연 전송량·설치 파일 다운로드·메일 수·DB/백업·함수 호출·PG 수수료를 비용 표로 산정한다. 실제 과금 계약은 별도 확인하며 경보·상한·남용 차단 정책을 둔다.

## 13. 배포·운영·복구

### 13.1 CI/CD

PR 단계: frozen install → typecheck/lint → manifest 검증 → 로직/DB 권한 시험 → Storybook build·상태 검사 → production build → 핵심 브라우저/axe → 성능 예산 → 접근 보호 preview.

구현 시 등록할 명령 계약은 pnpm typecheck, lint, verify:content, test:unit, test:db, test:e2e, build-storybook, test:a11y, build, test:perf다. 아직 package.json에 없는 계획 명령이며 이번 문서 검토에서 실행한 검사가 아니다. API 스키마와 생성 타입의 drift도 CI에서 검사한다.

운영 전환: 동일 commit의 검수 통과 → DB migration 호환 확인 → artifact/환경·키/도메인 검증 → 승인된 릴리스 전환 → smoke → 관측. Vercel의 자동 Git 배포가 검수 전 운영을 먼저 바꾸지 않는지 실제 설정을 확인한다.

fork PR과 preview에 운영 secret을 주지 않는다. workflow token 권한은 최소화하고 의존 action/version을 고정한다. 기존 수집 예약 workflow는 웹 배포 검수와 별도로 유지한다.

### 13.2 운영 화면과 경보

필수 운영 기능: 주문/결제 조회, 금액·권한 불일치, pending·dead letter 재처리, 환불 요청, 권한 변경 사유, 제품 신규 판매 중지, release 게시/회수, 지원 접수, 감사 이력.

경보 우선순위: 결제 확인-권한 미발급·중복 결제·고객 데이터 노출(P0), 재처리 지연·메일 지속 실패·다운로드 장애(P1), 성능·비용 추세(P2). 담당자·연락 경로·업무시간/비상 대응 기준은 출시 전에 실제 운영자에게 배정한다.

운영 목표 초안: 결제/권한 장애 5분 내 탐지, DB RPO 15분·RTO 4시간. 계약한 백업/PITR로 가능하고 복원 연습으로 증명할 때만 채택한다. 충족하지 못하면 비용/구조/목표를 명시적으로 조정하며 고객 SLA로 먼저 게시하지 않는다.

### 13.3 복구 절차

| 장애 | 초동 조치 | 복구·증거 |
|---|---|---|
| PG 승인 후 DB 장애 | 신규 승인 제한, processing 유지, 고객에 상태 안내 | PG 대사→같은 원천 멱등 반영→권한 1개 확인 |
| 메일 실패 | 구매·권한 유지, 메일 outbox 재시도 | 전달/반송 상태, 중복 안내 방지 |
| Auth 장애 | 공개 설명 유지, 개인 작업 재시도 | 세션 복구, 다른 계정 데이터 혼합 여부 확인 |
| DB 장애 | 신규 거래·권한 변경 중지 | 별도 환경 복원, 무결성·RLS·결제 대사 |
| Storage 파일 손실 | 해당 버전 다운로드 중지 | 파일 백업 복원, checksum·실제 설치 |
| 웹 배포 장애 | 이전 검증 artifact로 롤백 | 이전 코드와 현재 schema 호환·공개/계정 smoke |
| 키 유출 의심 | 해당 키·세션 회전, 영향을 받는 기능 제한 | 로그 조사·기록, 재인증·정책에 맞는 안내 |

DB 백업만으로 Storage 파일을 복원할 수 있다고 가정하지 않는다. 파일과 manifest/checksum의 별도 사본을 보존하고 복원을 연습한다. [Supabase 백업 범위](https://supabase.com/docs/guides/platform/backups)

Cron은 실제 호출·중복·timeout·인증·lease 만료를 검수한다. 작업 파일과 예약 선언만으로 살아 있는 복구 체계라고 판정하지 않는다. [Vercel Cron 운영 지침](https://vercel.com/docs/cron-jobs/manage-cron-jobs)

## 14. 단계별 작업과 완료 게이트

| 단계 | 실행할 작업·산출물 | 완료 증거·선행 조건 |
|---|---|---|
| M0 계획·현황 | 이 리뷰/실행 계획, 사실·정책 결정표, 기존 경로/데이터 보호안 | 문서·코드 대조. 이번 단계의 산출물 |
| M1 제품 근거·기반 | 앱/샘플 조사, manifest, 토큰, Node/pnpm/Next 전환, DB 격리 설계 | 실제 자산 provenance, 재현 빌드, 기존 HQ 회귀 |
| M2 공개 웹·부품 | PDF 상세 S01–S10, 홈·다른 제품, 지원·정책, React Bits 소스/adapter·AC01–AC03 소개·Figma/Storybook | 실제 사실/자산, 모바일·키보드·직접 주소·404 |
| M3 모션·성능 | React Bits 다섯 범주·GSAP story, 실제 영상, 앱별 과정·결과 비교, no-JS/모션 감소, SEO | T25 적용·T26 앱 이해 증거, 접근성 수동/자동, 자원 예산·production 측정 |
| M4 계정·데이터 | 별도 Auth, 동의·OTP·세션·본인 조회, schema/RLS/GRANT | 실제 테스트 이메일, 두 고객+비로그인+운영자 격리 |
| M5 거래·운영 | 견적·결제·환불·inbox/outbox·대사·문의·관리 | 테스트 PG 승인/취소, 장애·경쟁·중복/역순 재현 |
| M6 실제 앱 연결 | 다운로드·기기·권한·release·지원 문서 | 실제 OS 설치·앱 인증·해제·환불 E2E |
| M7 출시 | 계약·정책·판매자/리전·도메인·메일·경보·백업·복구 | 미정 판매 조건 해소, 전체 인수 결과·배포 smoke |

M1–M3의 정적·설명용 preview 제작은 실제 상품 정책 결정과 병행할 수 있다. 그러나 preview의 설명 그래픽은 M1 실제 제품 근거 완료를 대신하지 않는다. M4 테스트 계정·M5 PG 어댑터 개발도 판매 계약 완료 전 가능하지만 live 승인은 M7 통과 전 차단한다.

공개 소개만 출시하려면 해당 상품의 설명/자산/지원/공개 정보 게이트를 통과하고 가입·결제를 닫는다. 회원 기능 공개에는 M4, 판매 시작에는 M5–M7이 추가로 필요하다. 이 단계적 공개는 전체 프로젝트 범위를 축소하거나 나머지를 완료 처리하는 근거가 아니다.

### 14.1 구현 모델·추론 수준 규칙

**기본 작업 규칙은 Astra High로 구현 → 실제 브라우저 화면 비교·수정 → 중요 영역을 Astra xHigh로 검수다.** README·계획서·디자인 시스템이 Astra로 작성되었다는 사용자 설명을 인계 기준에 남긴다. 기존 문서를 매번 다시 기획하지 않고 구현 기준으로 사용하되, 충돌·검증 실패·미정 제품 사실만 근거와 함께 보완한다.

| 작업 | 지정 모델·추론 수준 | 적용 규칙 |
|---|---|---|
| PDF to MD 첫 상세 페이지, 공통 컴포넌트, React Bits·GSAP 모션, 일반 프런트엔드 구현 | GPT-6 Astra / High (high) | 기본 구현 모델. GRDS·RB01–RB06·AC01–AC03를 실제 화면과 연결 |
| 인증·결제·RLS/고객 데이터 격리·권한·동시성, 원인 파악이 어려운 버그 | GPT-6 Astra / xHigh (xhigh) | 고위험 구현·설계 판단과 검수에 사용. 추론 수준을 올리는 것으로 실제 테스트를 대체하지 않음 |
| 승인된 패턴의 반복 페이지, 단순 문구·스타일·테스트 보강 | 기본은 Astra / High; 비용 절감이 필요할 때만 GPT-5.6 Terra 허용 | Terra는 기준 화면·컴포넌트가 확정된 좁은 작업에 한정. 새 디자인 방향·인증·결제·권한 설계를 넘기지 않음 |
| 첫 페이지 기준 확정 전 및 출시 전 독립 검수 | 새 대화의 GPT-6 Astra; 일반 화면은 High, 보안·거래·어려운 오류는 xHigh | 작성자의 설명만 읽지 않고 실제 변경 코드·실행 결과·브라우저 화면을 확인 |

운영 조건:

1. 착수 기록에 작업 범위, 요구 모델/추론 수준, 확인 가능한 실제 모델/설정, 기준 문서, 완료 조건을 남긴다. 확인할 수 없는 실제 모델은 미확인으로 표시한다.
2. 계획서에 모델 이름을 쓰는 것과 실행 모델을 전환하는 것은 다르다. UI/실행 설정에서 선택을 확인한다. 해당 모델·추론 수준을 사용할 수 없으면 조용히 대체하지 않고 제한과 대안을 사용자에게 알린다.
3. Terra 사용은 비용 절감 선택사항이지 기본 위임 규칙이 아니다. 사용자가 비용 절감 모드를 선택한 경우에 적용하고 변경 범위·모델·검수 결과를 기록한다. 품질 최우선 모드에서는 Astra를 유지한다.
4. 독립 검수는 새 대화/검수 세션으로 분리한다. 이 규칙이 다중 에이전트 자동 생성·동시 파일 편집·추가 유료 서비스 사용을 자동 승인하지는 않는다.
5. Max 등 더 높은 설정을 일괄 적용하지 않는다. High/xHigh 배치는 프로젝트의 작업 규칙이며 모델별 디자인 성능 실측 순위나 성공 보장이 아니다.

모델 선택 근거는 2026-09-20 확인한 [공식 OpenAI 모델 안내](https://developers.openai.com/api/docs/models)와 [Astra 모델 문서](https://developers.openai.com/api/docs/models/gpt-6-astra)다. 공식 안내는 Astra의 복잡한 코딩 적합성과 지원 추론 수준을 설명한다. 이 프로젝트의 화면 품질은 아래 게이트에서 별도로 입증한다. 모델 변경이 필요해지면 사용자 선택과 현재 지원 여부를 확인한 뒤 이 규칙을 개정한다.

### 14.2 첫 페이지 완성 → 기준 고정 → 제품 확장

M1의 기반·데이터 보호 작업 이후, M2와 M3를 **PDF to MD 한 페이지에서 먼저 반복**한다. M2에서 모든 제품 화면을 거칠게 만든 뒤 M3에서 한꺼번에 다듬는 방식으로 진행하지 않는다. 범위가 독립적인 기반·백엔드 작업은 기존 선행 조건을 지키면서 진행할 수 있다.

| 순서 | 필수 작업 | 다음 단계 진입 조건 |
|---|---|---|
| B01 기준 페이지 구현 | PDF to MD S01–S10, GRDS, Molten Metal, Stepper, 실제 화면·원본/결과 비교, CTA·모바일·실패 상태 연결 | 실행 가능한 페이지와 확보된 실제 자산. 미확보 자료는 fixture/미검증으로 명시 |
| B02 시각·조작 반복 검수 | 브라우저에서 desktop/mobile 캡처와 실제 조작을 확인하고 수정 후 재검수 | 아래 화면 체크리스트와 관련 T 항목의 결과·수정 전후 증거 |
| B03 기준 고정 | 사용자에게 대표 화면·동작을 제시해 시각 방향 확인. 토큰·컴포넌트 variant·모션·실패 상태·기준 캡처를 버전 관리 | 사용자 확인과 Astra 독립 검수 기록. 기준이 확정되기 전 다른 제품으로 시각 패턴을 대량 복제하지 않음 |
| B04 다른 제품 확장 | 승인된 공통 품질을 홈·Typecut·그랩퍼에 적용하되 앱별 실제 입력·과정·결과는 별도 구성 | AC01–AC03/T26, 각 경로의 시각·기능·접근성·성능 회귀 검사 |

필수 화면 체크리스트:

- 한글 타이포그래피: 제목 줄바꿈·행간·읽기 폭·계층, 실제 화면의 글자가 읽히는 크기.
- 레이아웃: 구간별 여백·정렬·화면 밀도, 320px부터 기존 다섯 폭·확대에서 잘림/가로 넘침 없는 구성.
- Molten Metal: 금속 유동감, 제목/CTA 대비, 수동 정지·모션 감소·WebGL 실패 대안, 다른 미디어와 동시 실행 비용.
- 앱 소개: Stepper의 단계와 화면·설명이 일치하고 실제 결과를 비교할 수 있음. 마지막 결과·복사 상태·키보드 초점 유지.
- 모션: 순서·속도·스크롤 복귀·resize·라우트 왕복, 긴 대기/과도한 움직임 없이 정보와 CTA에 접근 가능.
- 상태: hover/focus/disabled/loading/empty/error 및 JS·영상·폰트 실패 상태. 정적 캡처 외에 실제 조작도 검수.

**빌드 성공은 디자인 검수 통과가 아니다.** 시각 검수, 기능 테스트, 접근성, 성능, 보안, 실제 외부 서비스/앱 검증은 따로 기록한다. 실제 자산이 없는 내부 fixture 화면은 레이아웃 기준으로만 확인할 수 있으며 제품 증거·출시 게이트를 통과시키지 않는다. 사용자 시각 확인도 보안·거래·성능 검사 실패를 면제하지 않는다.

### 14.3 독립 검수·수정·인계 계약

검수자는 README → 구현·운영 계획 → 통합 설계/GRDS → React Bits 계획 순으로 필요한 기준을 읽고, 구현 요약과 별도로 실제 코드·실행 화면·테스트 증거를 확인한다. 확인 전에는 파일을 수정하지 않는 읽기 검수로 시작하고, 지적 사항은 근거·영향·심각도·재현 절차와 함께 구현자에게 전달한다. 수정 후 영향 범위를 다시 시험한다.

한 작업 묶음의 인계 기록에는 다음을 남긴다.

- 작업/경로·대상 commit 또는 미커밋 변경 목록, 요구 모델/추론 수준과 확인된 실제 실행 설정.
- 적용 문서·규칙 ID, 바꾼 파일·의도·기존 작업 보존 여부.
- 실행 URL·환경, desktop/mobile viewport·브라우저, 캡처·모션/조작 기록과 테스트 명령/결과.
- 실제 자산과 fixture의 구분, 통과/실패/미실행 항목, 남은 결함·차단 사유.
- 독립 검수 세션과 판단, 수정 후 재검증 결과, B03의 사용자 화면 확인 여부.

모델이 '완료'라고 답했다는 사실은 증거가 아니다. 실행하지 못한 검사는 미실행으로 남기고 해당 게이트를 완료하지 않는다. 구현 단계가 끝나면 계획 문서를 다시 늘리는 대신 검수에서 발견된 구체적 결함을 수정한다.

## 15. 인수 검사와 증거 추적

현재 아래 항목은 모두 구현 후 검증 예정이다. 행의 존재는 테스트 통과가 아니다.

| ID | 검사·기존 기준 대응 | 필요한 증거 |
|---|---|---|
| T01 | 세 제품 직접 접근/새로고침/예약어/404 — Q01, V09 | 실제 HTTP 상태·브라우저·빌드 manifest |
| T02 | 5개 폭·확대·핵심 카피 — Q02, V01, V05 | 스크린샷·overflow 검사·수동 읽기 |
| T03 | JS/영상/모션 실패 — Q03, V04 | JS off·요청 차단 상태의 사용 동선 |
| T04 | 키보드·탭·dialog·VoiceOver — Q04, V06 | axe+수동 순서·focus 복귀 기록 |
| T05 | GSAP 4단계·모션 감소·짧은 화면 — Q05, V03 | 순/역방향·resize·경로 왕복, 정적 대체 |
| T06 | 실제 PDF/MD/앱 대응·XSS·자산 권리 — Q06, V02, V07, V08, V12 | 앱 version/샘플 hash·수동 대조·악성 MD fixture |
| T07 | 로그인·상품·주문·내 계정 일치 — Q07, V10, V13 | 계정별 상태·복귀·기존 구매 재구매 방지 |
| T08 | 타인 주문·기기·파일 차단 — Q08 | 두 고객 API/DB/RLS 401/403/404 시나리오 |
| T09 | 가격 변조·두 탭·중복/역순·PG 후 DB 실패 — Q09 | 실제 테스트 PG+장애 주입·원천별 권한 1개 |
| T10 | 메일 장애·재시도·worker 중단 — Q10 | PG 성공 유지, outbox lease·재처리 결과 |
| T11 | 마지막 기기 자리 경쟁·재등록·제품 격리 — Q11 | 동시 요청 결과·DB 행·실제 앱 |
| T12 | 환불 이력·권한 회수·늦은 이벤트 — Q12 | PG 취소·다른 grant 유지·앱 재확인 |
| T13 | 현재 세션·MFA·역할 철회·키·RLS/GRANT — Q13 | 비로그인/고객/운영자·권한 변경 직후 시험 |
| T14 | 실제 배포 파일·서명·checksum — Q14 | 다운로드→설치→실행, 버전 대응 |
| T15 | 성능·실험실/RUM 구분 — Q15, V14 | 장비·조건·3회 결과·자원 크기, 현장 데이터 별도 |
| T16 | DB/파일 복원·판매 중지 — Q16 | 별도 환경 복원, checksum, 기존 고객 접근 |
| T17 | 가격·OS·권리·추가 비용·환불·지원 — V11 | 승인된 정책과 화면/주문 snapshot 대조 |
| T18 | SEO·OG·sitemap·preview 차단 | 공개 URL만 색인, canonical·정책 버전 검수 |
| T19 | 쿠키 갱신·cache·prefetch·계정 전환 | 두 사용자 동시 요청, Set-Cookie/no-store 실응답 |
| T20 | 기존 HQ/수집기 보호 | 기존 기능 회귀, 신규 고객의 운영 테이블 접근 거부 |
| T21 | 가입 동의·이메일 변경·탈퇴 | 실제 사용자 UUID 결합, 주문 보존·세션 철회 |
| T22 | OTP/메일 환경·반송 | 실제 테스트 수신·template·재전송/만료·테스트 수신 제한 |
| T23 | Auth/DB/PG/Storage 장애 | 불가와 미보유 구분, 공개 정보 유지·복구 동선 |
| T24 | 환경 누락·상품 미확정·거래 모드 | 설정 실패 시 구매/가짜 성공 불가, live key 오용 방지 |
| T25 | React Bits Backgrounds/Animations/Micro/Components/Text Animations 실제 적용 | RB01–RB06의 source SHA·route·화면·키보드·정적 대안·성능·라이선스, Molten Metal 밝은 모드·WebGL 실패/정지 |
| T26 | 세 앱 소개의 입력→과정→결과→제한 이해·실제 자산 대응 | AC01–AC03 각 샘플/단계 선택→결과 확인·비교→복사/공개 파일 확인, 마지막 결과·모바일/키보드/JS off·실패 상태, 검수자가 앱의 역할과 한계를 화면으로 설명한 기록 |

Vitest는 가격·상태·멱등·권한 합성·URL 허용 로직을 다룬다. DB 통합 검사는 실제 RLS/GRANT와 트랜잭션 경쟁을 시험한다. Playwright/axe는 브라우저 흐름을, Lighthouse는 실험실 성능을 검사한다. mock provider 성공만으로 PG·메일·앱 통합을 통과 처리하지 않는다.

증거 파일에는 commit, 일시, 환경, 실제/mock 구분, 입력·예상·결과, 미검증 항목을 남긴다. 브라우저 자동화가 통과해도 VoiceOver·Safari 실기기·실제 앱 검증은 별도다.

## 16. 남은 결정과 진행 가능한 작업

| ID | 확인할 결정·자료 | 필요한 시점 | 그 전에 할 수 있는 작업 |
|---|---|---|---|
| D01 | PDF to MD 실제 앱/코드 경로, 정식 이름·OS·기능·처리 위치 | 실제 제품 주장·시연 공개 전 | 구조·토큰·내부 설명형 preview |
| D02 | 공개 허가된 PDF/MD·캡처/영상, 버전·조건 | 실제 결과·영상 공개 전 | 뷰어·접근성·지연 로딩 fixture 검수 |
| D03 | Typecut·그랩퍼 실제 기능/상태/자산 | 해당 제품 공개 전 | 공통 shell·제품별 레이아웃 설계 |
| D04 | 판매 국가·주체·PG 계약·통화·세금/영수증 | live PG 연결·판매 전 | 테스트 어댑터·주문/복구 구현 |
| D05 | 가격·기간·업데이트·기기·오프라인·환불·추가 비용 | 견적·정책·앱 인증 공개 전 | 버전 있는 정책 스키마·상태 fixture |
| D06 | 고객용 Supabase 환경/리전·예산·도메인·Vercel·메일 | 외부 계정·검토/운영 연결 전 | 로컬 DB·환경 검증·migration·CI |
| D07 | 지원 연락·담당자·판매자 정보·약관/개인정보 승인 | 문의/가입/공개 판매의 각 게이트 | 문의 DB·화면·승인된 수신처 fixture |
| D08 | 운영 역할·복구 목표·보존·경보 수신·비상 대응 | 운영 전 | runbook·복원 리허설 구성 |

이미 사용자 지시나 현재 프로젝트의 승인된 자료로 확인 가능한 것은 다시 질문하지 않고 반영한다. 확인되지 않은 상업 정책만 사용자/운영 담당 결정으로 남긴다. 이 문서 작성으로 서비스 가입·요금 변경·발송·실제 결제·운영 DB 수정·배포를 수행한 것은 아니다.
