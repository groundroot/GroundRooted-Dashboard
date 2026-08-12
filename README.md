# GroundRooted HQ — 운영 대시보드

앱 제작(Orca) · Suno 앨범 파이프라인 · 판매/매출 · PrayerWire 운영 현황을 한 화면에서 보는
GroundRooted의 운영 대시보드입니다.

- **Supabase 키가 없으면 데모 데이터로 동작**합니다 (화면 확인용).
- 키를 넣으면 실제 DB를 읽고, 1분마다 서버 데이터가 갱신됩니다.
- 대시보드는 **읽기 전용** — 데이터 쓰기는 수집기(cron/웹훅/Claude)가 담당합니다.

## 1. 로컬 실행

```bash
npm install
npm run dev   # http://localhost:3000
```

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
대시보드는 서버 컴포넌트에서만 DB를 읽고, 사이트 전체는 아래 비밀번호로 막습니다.

## 3. Vercel 배포

1. 이 폴더를 GitHub 저장소로 푸시 (예: `groundrooted/hq-dashboard`)
2. [vercel.com](https://vercel.com)에서 저장소 Import
3. Environment Variables에 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   그리고 접속 비밀번호 `DASHBOARD_PASSWORD` 추가 → Deploy
   (`middleware.ts`가 사이트 전체를 Basic 인증으로 막습니다. 아이디는 아무거나, 비밀번호만 맞으면 됩니다.
   Stripe 웹훅 경로 `/api/webhooks/*`는 인증에서 제외됩니다.)
4. 도메인 연결: Vercel 프로젝트 → Domains → `hq.groundrooted.com` 추가 후
   안내되는 CNAME 레코드를 DNS에 등록

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
