# GroundRooted 계획서 종합 리뷰 1.0

검토일: 2026-09-19  
검토 대상: 통합 설계 v1.3, GRDS 1.0, 현재 웹사이트 작업 트리의 코드·SQL·CI  
산출물: [보완된 구현·운영 계획](groundrooted-implementation-plan-v1.0.md)

## 판단

기존 문서는 브랜드 경험과 디자인 방향을 구체적으로 정했고, 계정·주문·권한 분리 및 실제 증거를 중시하는 방향도 적절하다. 다만 현재 저장소에서 그 서비스로 전환하는 방법, API·DB의 강제 조건, 결제 장애 복구, 출시 전제 조건을 구현자가 결정해야 하는 부분이 남아 있다.

따라서 **화면 설계의 기준으로는 사용할 수 있지만, 그대로 개발·판매 완료를 판정하는 실행 계획으로는 부족하다.** 보완 계획에 전환·보안·상태·API·운영·인수 계약을 추가했다. 아래 '보완'은 계획에 반영했다는 뜻이며, 코드나 원격 서비스를 수정·검증했다는 뜻이 아니다.

P0는 고객 데이터/결제 또는 공개 전환의 선행 조건, P1은 해당 기능 출시 전에 필요한 계약, P2는 유지보수·문서 일관성 개선이다.

## 1. 근거 있는 핵심 발견

### R01 · P0 · 고객 Auth와 기존 운영 DB를 바로 연결하면 안 된다

근거: sql/schema.sql 89–104행, sql/ai-usage.sql 21–23행, sql/ai-project-cost.sql 13–15행은 authenticated 역할에 USING (true)로 읽기를 허용한다. 여기에는 매출·운영 프로젝트·AI 사용 비용이 포함된다.

기존 운영자 전용 계정이라는 가정에서 고객 가입을 열면 새로운 고객도 authenticated가 된다. 웹 /admin을 잠가도 Data API·Realtime의 접근 경계가 자동으로 바뀌지 않는다. 실제 원격의 GRANT·RLS·노출 설정은 조회하지 않았으므로 현재 정보 유출이 발생했다고 단정하지 않는다.

보완: 실행 계획 2.2·3·8.2·T08/T13/T20. 고객용 프로젝트 분리를 기본 배치안으로 두고, 같은 프로젝트를 사용할 때는 운영 테이블·view·RPC·Realtime의 접근을 먼저 차단·검증한다.

### R02 · P0 · 공개 웹으로 바꿀 때 현재 전체 인증 matcher와 경로가 충돌한다

근거: app/page.tsx의 루트가 HQ이며 middleware.ts 8–24행은 대부분의 페이지에 공통 비밀번호를 요구한다. app/login/page.tsx 24행은 인증 뒤 루트로 복귀한다.

루트만 랜딩 페이지로 바꾸면 공개 제품이 잠기거나 기존 HQ 진입을 잃을 수 있다. 반대로 전역 잠금을 제거하면 운영 데이터의 별도 보호가 필요하다.

보완: 2.2·5.1·T01/T20. 공개 홈·제품, 고객 /login, 운영 /admin/hq·/admin/login을 구분하고 데이터 조회/각 서버 action에서도 인가한다. 실제 배포 주소·기존 사용 동선 확인을 이전 게이트로 추가했다.

### R03 · P0 · 공유 비밀번호는 고객/운영자 권한 모델이 아니다

근거: lib/auth.ts는 비밀번호로부터 결정적인 SHA-256 토큰을 만들고, app/login/page.tsx는 이를 30일 쿠키로 설정한다. 코드에 운영자 개인 식별·MFA·서버 세션 철회·역할별 감사가 없다.

쿠키의 브라우저 보관기간만으로 복사된 bearer 값의 서버 만료나 사용자별 철회를 제공하지 않는다. 새 회원 계정이나 환불 관리 권한으로 확장할 수 없다.

보완: 7·10.1–10.2·T13. 이전 중 HQ 호환용 범위로 제한하고 운영자는 개별 계정·MFA·최신 role·재인증·감사 기록으로 설계했다.

### R04 · P0 · 기존 Stripe 기록기를 상거래 승인 로직으로 재사용할 수 없다

근거: app/api/webhooks/stripe/route.ts 35–75행은 checkout.session.completed를 매출/이벤트로 기록한다. fetch 응답의 성공 여부를 검사하지 않고 마지막에 ok를 반환한다. 두 저장은 별개의 호출이다.

같은 코드에는 결제 상태·저장 주문과 금액/통화의 대응·권한 발급이 없다. 43행의 일괄 100 나누기는 통화별 최소 단위 처리가 아니다. 일부 기록 실패를 ACK하면 해당 누락에 대한 provider 재전송을 기대할 수 없다.

보완: 2.2·7·9. 신규 주문/결제/권한 경로를 따로 만들고 durable inbox, 서버 PG 확인, 원천별 멱등 반영, outbox, 대사를 정의했다. 기존 Stripe의 사용 여부는 확인 후 별도로 이전한다.

### R05 · P0 · 결제 중복·시간 초과·환불 역순의 처리 단위가 부족하다

근거: v1.3 19.8은 멱등·복구 원칙은 갖췄지만, 두 탭에서 서로 다른 요청키로 주문을 만드는 경우와 PG 성공/DB 실패, lease 만료 시 재주문 조건을 정하지 않았다.

보완: 8.1·9.1–9.5·T09/T10/T12. 고객+제품의 checkout intent, payload 결합 멱등키, 짧은 DB 트랜잭션, 불확실/대사 상태, worker lease, 원천별 환불을 추가했다. 결제창 성공 URL과 구매 권한을 분리했다.

### R06 · P0 · 공개 캐시와 인증 갱신을 코드 경계까지 분리해야 한다

근거: v1.3 19.4에는 공개/개인 분리 원칙이 있지만 경로·SDK 쿠키 갱신·prefetch·계정 전환 검수 방식이 없다. 기존 app/page.tsx는 60초 revalidate를 사용한다.

인증 갱신의 Set-Cookie나 개인 DTO가 공용 ISR/CDN 응답에 섞이지 않아야 한다. Supabase 공식 문서도 이 캐시 경계를 구체적으로 다룬다. [SSR 캐시와 세션](https://supabase.com/docs/guides/auth/server-side/advanced-guide)

보완: 5.2·T19. 공개 root layout의 쿠키 의존 제거, 개인 패널 no-store, 요청별 Auth client, setAll 헤더 반영, 두 사용자·prefetch·로그아웃 후 상태 폐기를 명시했다.

## 2. 분야별 누락과 반영 위치

| ID·우선순위 | 발견한 부족함·근거 | 실행 계획의 보완 |
|---|---|---|
| R07 · P1 | v1.3 11·20.11의 화면 상태에 판매 여부·증거 확보·계정·결제·기기가 섞일 가능성 | 4.1·5.3: 독립 상태 축과 우선순위. 판매 중지해도 기존 권한 유지 |
| R08 · P1 | 19.7은 가입 동의를 요구하지만 실제 사용자 UUID에 귀속하는 시점·실패 처리가 없음 | 10.1: enrollment·정책 version·OTP 검증 후 원자 기록·미완료 거래 차단 |
| R09 · P1 | 19.9의 기기 한도에 어떤 행을 잠그는지·동일 설치 재시도·복수 grant 정책이 없음 | 8.1·10.3: user+product 잠금, 등록 UNIQUE, 재등록 멱등·정책 결정 |
| R10 · P1 | 파일 URL 발급과 실제 설치/업데이트/철회 지연의 구체 계약 부족 | 10.4: 비공개 버킷, 버전·OS·권한·checksum, 서명 TTL, 실제 앱 E2E |
| R11 · P1 | 서버 기술 선정은 있으나 API 목록·입력·인가·오류·재시도 계약 없음 | 7: 20여 API 책임, 401/403/404/409/422/429/503, 크기·속도·Origin 제한 |
| R12 · P1 | 19.6 테이블 목록에 주문 경쟁·환불 원천·작업 lease·FK/인덱스가 빠짐 | 8·9: intent/refund/idempotency/license account, 제약·RLS·GRANT·migration |
| R13 · P1 | package.json은 Next 15, 현재 Node 26, 수집 CI 22; 설계의 Next 16/Node 24와 차이 | 2.3: 도구·lockfile·runtime 전환, local/preview/prod·secret 분리 |
| R14 · P1 | collect.yml은 수집 예약만 수행. 웹 검사·배포 gate·rollback 경로 없음 | 13.1: 검수된 동일 commit 배포, preview 보호, DB 호환·수집기 회귀 |
| R15 · P1 | A01–A12 확보 요구는 있지만 manifest·파일 hash·검증 상태 강제가 없음 | 4.2–4.3: provenance, 원본/MD 짝, 증거·공개·판매 상태, 빌드 검증 |
| R16 · P1 | 제작 순서는 있으나 미정 상품 상태에서 어떤 기능을 공개할지 불명확 | 14·16: 소개/계정/판매 게이트, 병행 작업, 전체 완료 기준 유지 |
| R17 · P1 | 지원·정책 페이지 이름만으로 접수·처리·메일 실패·계정 탈퇴를 구현할 수 없음 | 7·10.1·11: 접수번호·outbox·보존/삭제·동의·운영 담당·사업 정책 |
| R18 · P1 | 19.12의 백업 검토에 복원 순서·담당·DB와 파일의 별도 증거 없음 | 13.2–13.3: RPO/RTO 제안, 장애별 runbook, 실제 복원·PG 대사 |
| R19 · P1 | GRDS의 대비/키보드 원칙에 skip link·확대·focus 복귀·강제 색상·폼 오류 등 세부 상태 부족 | 6·T02/T04/T05: 컴포넌트 상태·VoiceOver·실기기·동작 실패 대안 |
| R20 · P1 | 19.4의 SEO 항목에 미정 도메인·미출시 상품 structured data·preview 색인 정책 없음 | 12.1·T18: canonical·sitemap·한국어·실제 Offer만·noindex와 인가 분리 |
| R21 · P1 | 22.2의 예산에 기준 build·측정 횟수·장비·서버/뷰어 자원 검수 방법 부족 | 12.2·T15: production 3회·중앙값/편차·초기/지연 전송 분리·RUM |
| R22 · P1 | Sentry/web-vitals/outbox 기술명만으로 운영 실패 탐지·대응을 증명하기 어려움 | 12.3·13.2: 비밀 제거·계측 입력 검증·경보 우선순위·담당·비용 |
| R23 · P2 | '채택 기술'이 실제 설치·동작 증거와 혼동될 여지, Figma/Storybook도 미생성 | 1·2.3·6·15: 명세/구현/외부 검증 분리, 설치·소스 revision·증거 기록 |
| R24 · P2 | 통합 설계와 발췌 디자인 문서에 같은 내용이 반복되어 우선순위 불명확 | 문서 안내와 1절: UX/토큰/실행 계약의 기준을 명시, 원본은 링크로 보존 |
| R25 · P1 | lib/data.ts 255–306행은 query.error를 처리하지 않고 일부 실패를 빈 값/데모로 바꿀 수 있음. 매출 query에 currency가 없고 합계는 USD 표시 | 2.4·8.3·T20: 준비·오류·실제 값 구별, 통화별 집계, 시간대/월 경계 검수 |
| R26 · P1 | 사용자 추가 요구인 React Bits 다섯 범주가 기존 설계에서는 선택사항. 공식 소스의 invisible·Molten Metal 밝은 모드 미반영/실패 대안 부재·Micro 기본 상태를 검토 없이 도입하면 기준 위반 | 6.1·T25·별도 React Bits 계획: Molten Metal 포함 RB01–RB06 실제 적용, adapter·엔진 분리·실패 대안·소스/라이선스 추적 |
| R27 · P1 | 사용자는 앱 이해를 돕는 컴포넌트를 요구. 기존 Components 매핑의 제품 카드만으로는 각 앱의 입력·과정·결과를 조작하며 확인할 수 없음 | 6.2·T26·AC01–AC03: Stepper 기반 과정 탐색·앱별 실제 결과 비교, 마지막 결과/키보드/정적 설명 유지, 시연과 실제 처리 구분 |

## 3. 유지할 설계와 선택

- /는 전체 앱 홈, 제품은 /pdf-to-md·/typecut·/transcribe-grabber. PDF to MD의 10개 구간과 실제 결과 중심의 서사를 유지한다.
- Next App Router/React/TypeScript, Tailwind 4, Base UI, 대표 모션 GSAP, Supabase Auth/DB/Storage를 기본으로 유지한다. React Bits Micro·Stepper에 필요한 Motion과 Molten Metal의 OGL은 해당 부품 단위로 허용한다.
- 기존 PDF 변환 엔진을 웹사이트 안에 다시 만들거나 방문자 파일 업로드를 추가하지 않는다.
- 상품 설명은 정적 HTML 우선, 무거운 모션·PDF·결제는 지연 로드한다. 개인 데이터 캐시와는 분리한다.
- 미확정 가격·OCR·로컬 처리·무제한·평생 업데이트·후기·성능을 만들지 않는다.
- 큰 팀 전용 CMS·마이크로서비스·Redis·별도 백엔드 프레임워크를 자동으로 추가하지 않는다. 주문 DB의 inbox/outbox로 첫 운영 범위를 구성한다.
- Toss는 국내 원화 판매의 조건부 기본안이다. 판매 국가와 계약이 확인되기 전 확정된 상점처럼 취급하지 않는다.

## 4. 검토 방법과 한계

수행:

1. 두 설계 문서의 제품/기술/디자인/검수 요구를 읽고 현재 app·lib·SQL·workflow·package와 대조했다.
2. Next 업그레이드, Supabase Auth/SSR/RLS/MFA/백업, Toss 승인/웹훅, W3C, Web Vitals의 공식 자료를 확인했다.
3. 문서 링크·식별자와 원래 V01–V14/Q01–Q16의 인수 항목을 보완 계획 T01–T24에 대응시켰다.
   React Bits 추가 요구는 현재 선정한 공식 소스 여섯 개를 읽고 별도 적용 계획과 T25에 반영했다. 배경을 Molten Metal로 교체하고 앱 소개용 Stepper·AC01–AC03·T26을 추가했다.
4. 변경은 website 계획 문서와 프로젝트 Wiki의 메모로 한정했다.

미수행: 앱 코드 변경·의존성 설치·웹 빌드/화면 검수·실제 원격 RLS 조회·테스트 결제·OTP 메일 발송·앱 인증·DB/Storage 복원·운영 배포. 따라서 '계획의 보완'을 '웹사이트 구현/검증 완료'로 해석하지 않는다.

미정인 제품 자산·가격·라이선스·판매 국가·지원 연락·도메인·운영 환경은 실행 계획 D01–D08에 남겼다. 이 정보가 없어도 진행 가능한 작업과, 해당 정보가 있어야 공개할 수 있는 작업을 함께 적었다.

## 5. 이번 보완에 사용한 주요 공식 근거

설계 판단은 GroundRooted를 위한 제안이며 공식 문서가 사이트의 안전성이나 성능을 보증하는 것은 아니다.

| 자료 | 적용한 근거 |
|---|---|
| [Next 16 업그레이드](https://nextjs.org/docs/app/guides/upgrading/version-16) | 실제 Next 15 저장소의 proxy·런타임·빌드 전환 검수 |
| [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) | authenticated와 본인 소유권의 차이·행 접근 제어 |
| [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/advanced-guide) | 쿠키 갱신·공용 캐시·요청별 client |
| [이메일 OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless) | 자동 가입 옵션·OTP 메일 구성 |
| [Toss 결제 연동](https://docs.tosspayments.com/guides/v2/payment-widget/integration) | 성공 리디렉션 이후 서버 검증·승인 |
| [Toss 웹훅](https://docs.tosspayments.com/guides/v2/webhook) | ACK 제한과 재전송, durable inbox 필요성 |
| [Supabase 백업](https://supabase.com/docs/guides/platform/backups) | DB와 Storage 파일 복원 분리 |
| [WCAG 타깃 크기](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | AA 최소 기준과 내부 44px 목표 구분 |
| [WCAG 텍스트 대비](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) | pt와 CSS px, 실제 컴포넌트 대비 |
| [Web Vitals](https://web.dev/articles/vitals) | 현장 p75·INP와 실험실 결과 분리 |
| [OWASP CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) | 쿠키 쓰기 요청의 Origin/CSRF 검증 |
