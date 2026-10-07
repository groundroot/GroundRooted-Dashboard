# GroundRooted — 앱 소개 사이트와 HQ

앱 제작(Orca) · Suno 앨범 파이프라인 · 판매/매출 · PrayerWire 운영 현황을 한 화면에서 보는
GroundRooted의 운영 대시보드입니다.

- **Supabase 키가 없으면 데모 데이터로 동작**합니다 (화면 확인용).
- 키를 넣으면 HQ 요청 시 실제 DB를 읽습니다.
- 대시보드는 **읽기 전용** — 데이터 쓰기는 수집기(cron/웹훅/Claude)가 담당합니다.

## 1. 로컬 실행

```bash
# Node 24 (see .node-version), pnpm 11.20.0
pnpm install --frozen-lockfile
pnpm dev   # http://localhost:3000
```

메인 `/`에서 ReadyMD(`/pdf-to-md`), YouTube to MD(`/youtube-to-md`), TypeCut Pro(`/typecut-pro`) 순서로 앱을 확인합니다. [제작 문서](website/README.md)와 구현 기록을 함께 읽습니다. 설명용 샘플로 구성한 내부 preview이며 실제 앱 변환·판매는 아직 연결하지 않았습니다. 개발 서버에서는 바로 접근할 수 있고 production build의 로컬 검수에는 `MARKETING_PREVIEW_ENABLED=true`를 명시합니다. 내부 HQ는 `/admin/hq`로 분리했으며 비밀번호 보호를 유지합니다. 로그인 후 HQ로 이동합니다.

```bash
pnpm typecheck
pnpm build
MARKETING_PREVIEW_ENABLED=true pnpm start
```

### 지속 실행되는 로컬 미리보기 (macOS)

```bash
# Node 24: 별도 소스 복사본에서 빌드 후 launchd로 실행
pnpm preview:local
# Node 24가 기본 버전이 아니면
npx --yes --package=node@24 node scripts/preview-local.mjs
```

주소는 `http://127.0.0.1:3045`. 실행 파일과 로그는 `~/Library/Caches/GroundRooted/website-preview/`에 둔다. 터미널 종료 후에도 현재 로그인 세션에서 계속 실행되며, 프로세스가 종료되면 launchd가 다시 시작한다. 재로그인 후에는 위 명령을 다시 실행한다. 실행 중인 미리보기가 있으면 확인만 하며 임의로 교체하지 않는다. 소스를 갱신할 때는 `--refresh`로 새 복사본을 먼저 빌드한 뒤 해당 미리보기만 교체한다. 빌드 실패 시 기존 서버를 유지하며, 새 서버 시작 실패 시 이전 설정으로 복귀한다.

```bash
npx --yes --package=node@24 node scripts/preview-local.mjs --refresh
# 미리보기 종료
launchctl bootout gui/$(id -u)/com.groundrooted.website-preview
```

작업 트리의 `.next`와 다른 서버는 보존한다. `.env*`를 복사하지 않는 공개 페이지 전용 미리보기라 HQ는 비밀번호 미설정으로 차단된다.

### 공개 사이트 품질 검수

2026-10-04 개편의 스킬·공개 저장소 선정, 변경 범위와 검증은 [업그레이드 기록](website/enterprise-upgrade-20261004.md)에 정리했다.

```bash
# Node 24. 인증 경계 테스트는 production build가 먼저 필요하다.
pnpm typecheck
pnpm build --webpack
pnpm test:calculations
pnpm test:storefront
# 별도 터미널에 localhost:3045 미리보기 서버 실행
MARKETING_PREVIEW_ENABLED=true pnpm start --hostname 127.0.0.1 --port 3045
# ego-browser CLI가 설치된 환경에서 실행. 전용 브라우저 작업 공간을 사용한다.
node scripts/verify-public-ui.mjs http://127.0.0.1:3045
```

UI 검수 결과·화면은 `output/playwright/enterprise-upgrade/`에 저장된다. 실행 중인 서버를 보존하려면 소스 복사본에서 빌드와 검수를 실행한다. TypeCut Pro는 기존 공식 사이트로 연결한다. 실제 제품 출시나 공개 배포 완료를 의미하지 않는다.

## 2. Supabase 연결

1. [supabase.com](https://supabase.com)에서 무료 프로젝트 생성
2. **SQL Editor**에 `sql/schema.sql` 내용을 붙여넣어 실행
3. **Settings → API**에서 URL과 service_role key 복사
4. `.env.example`을 `.env.local`로 복사하고 값 입력:

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

스키마의 RLS 정책이 `to authenticated`라 anon key로는 아무것도 읽히지 않습니다.
대시보드는 서버 컴포넌트에서만 DB를 읽고, HQ와 비공개 경로는 아래 비밀번호로 막습니다. 위의 미리보기 설정은 명시된 공개 페이지에만 적용됩니다.

## 3. Vercel 배포

1. 이 폴더를 GitHub 저장소로 푸시 (예: `groundrooted/hq-dashboard`)
2. [vercel.com](https://vercel.com)에서 저장소 Import
3. Environment Variables에 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   그리고 접속 비밀번호 `DASHBOARD_PASSWORD` 추가 → Deploy
   (`proxy.ts`가 로그인 쿠키를 검사하고 비로그인 사용자는 `/login`으로 보냅니다.
   Stripe 웹훅 경로 `/api/webhooks/*`는 인증에서 제외됩니다.)
4. 도메인: `groundrooted.com`(www → apex 308). DNS는 Cloudflare에서 A `@`·CNAME `www`·TXT `_vercel`을
   **DNS 전용(회색 구름)**으로 둔다. 공개 페이지는 production의 `MARKETING_PREVIEW_ENABLED=true`로 열린다.

## 4. 수집기 (GitHub Actions — 서버 불필요)

`.github/workflows/collect.yml`이 **6시간마다** 자동 실행됩니다 (Actions 탭에서 수동 실행도 가능).
수집기는 의존성이 없어서 npm install 없이 바로 돕니다.

### Actions Secrets 설정 (저장소 Settings → Secrets and variables → Actions)

| Secret | 용도 | 필수 |
|---|---|---|
| `SUPABASE_URL` | Supabase 프로젝트 URL | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API의 service_role 키 (쓰기 전용 키) | ✅ |
| `GH_PAT` | 다른 저장소를 읽을 Personal Access Token (repo 읽기 권한) | 다른 repo 추적 시 |
| `YOUTUBE_API_KEY` | Google Cloud → YouTube Data API v3 키 | 유튜브 수집 시 |
| `YT_CHANNEL_ID` | 유튜브 채널 ID (UC…) | 유튜브 수집 시 |

### 수집기별 사용법

**① GitHub 프로젝트 수집** — `collectors/repos.json`에 추적할 저장소를 등록하세요.
각 저장소 루트에 `project.yaml`을 두면 단계가 보드에 반영됩니다:

```yaml
# project.yaml (저장소 루트)
stage: 스토어 심사
```

**② Suno 파이프라인 보고** — 기존 자동화 스크립트에서 단계 완료 시 호출:

```bash
node collectors/report-suno.mjs --title "Hymns of Dawn Vol.1" --stage generated
node collectors/report-suno.mjs --title "..." --stage uploaded --url https://youtu.be/xxx
node collectors/report-suno.mjs --title "..." --stage distributed --distributor distrokid
# stage: planned | generated | downloaded | uploaded | distributed
```

**③ Elgato 판매 CSV** — Maker Console에서 내려받은 CSV를 반영:

```bash
node collectors/parse-elgato.mjs sales.csv
# 컬럼명이 다르면 파일 상단 COLS 매핑 수정 (중복 실행해도 안전 — 자동 dedupe)
```

**④ 사이트 판매 (Stripe 웹훅)** — 자동 수신: Stripe 대시보드 → Webhooks →
엔드포인트 `https://<도메인>/api/webhooks/stripe`, 이벤트 `checkout.session.completed`.
Vercel 환경변수에 `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` 추가.

**⑤ AI 에이전트 사용량·비용** — 이 맥의 로컬 로그를 읽어 집계합니다.
로그가 맥에만 있어서 **GitHub Actions에서는 못 돌고, 맥에서 실행**해야 합니다:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node collectors/collect-ai-usage.mjs
```

읽는 곳: Claude Code(`~/.claude/projects`), Codex(`~/.codex/sessions`),
Cline CLI(`~/.cline/data/sessions`), Command Code(`~/.commandcode/projects`).
Antigravity는 사용량을 로컬에 저장하지 않아 집계에서 빠집니다.
금액은 **공식 정가 환산액**이며 구독 실결제액과 다릅니다.

모든 수집기는 `DRY_RUN=1`로 실행하면 DB에 쓰지 않고 동작만 확인할 수 있습니다.

### 남은 데이터 소스 (이후 단계)

| 소스 | 방식 | 쓰는 테이블 |
|---|---|---|
| App Store / Play | 리포트 API cron (앱 출시 후) | revenue |
| PrayerWire | 자체 DB → 일 스냅샷 | platform_metrics |
| Claude 예약 작업 | 매일 아침 브리핑 작성 | briefings |

## 구조

```
app/            페이지 (Next.js App Router)
components/     RevenueChart 등 UI 컴포넌트
lib/data.ts     Supabase 조회 + 데모 데이터 폴백
sql/schema.sql  DB 스키마 (Supabase에 1회 실행)
```

네이버페이 판매 준비: [가맹 경로·구현 순서·확인 대기 항목](website/naverpay-sales-plan-20261004.md).

섹션별 GPT Image·Higgsfield 자산과 인터랙션: [생성 프롬프트·구현·검증 기록](website/interactive-art-direction-20261004.md).

최신 디자인: [Flexibits 레퍼런스 개편 기록](website/flexibits-redesign-20261004.md), `DESIGN.md` 5.0.
