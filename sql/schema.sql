-- GroundRooted 운영 대시보드 스키마 (Supabase SQL Editor에 붙여넣어 실행)
-- 원칙: 모든 상태 변화는 events 로 쌓이고, 현재 상태 테이블들은 수집기가 갱신한다.

-- 1) 프로젝트 (앱, 음악, 플랫폼 전부 하나의 테이블로)
create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,            -- 예: 'prayerwire', 'suno-album-hymns-vol1'
  name        text not null,
  kind        text not null check (kind in ('app','music','platform','plugin','site')),
  stage       text not null default 'planning' -- 기획/개발/테스트/심사/출시 등 자유 정의
              ,
  repo        text,                            -- GitHub owner/repo (앱 프로젝트)
  status      text not null default 'active' check (status in ('active','paused','done','archived')),
  meta        jsonb not null default '{}',
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

-- 2) 이벤트 (모든 상태 변화의 로그 — 대시보드 타임라인의 원천)
create table if not exists events (
  id          bigint generated always as identity primary key,
  project_id  uuid references projects(id) on delete set null,
  source      text not null,                   -- 'github' | 'suno' | 'youtube' | 'stripe' | 'appstore' | 'elgato' | 'prayerwire' | 'manual'
  type        text not null,                   -- 'commit' | 'stage_change' | 'upload_done' | 'sale' | ...
  title       text not null,
  detail      jsonb not null default '{}',
  external_id text,                            -- 소스별 고유 ID (커밋 SHA, 영상 ID 등) — 중복 방지
  occurred_at timestamptz not null default now()
);
create unique index if not exists events_dedupe_idx on events (source, external_id) where external_id is not null;
create index if not exists events_occurred_idx on events (occurred_at desc);
create index if not exists events_project_idx on events (project_id, occurred_at desc);

-- 3) Suno 앨범 파이프라인 (앨범 1개 = 1행, 단계별 타임스탬프)
create table if not exists albums (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid references projects(id) on delete cascade,
  title         text not null,
  planned_at    timestamptz default now(),
  generated_at  timestamptz,                   -- Suno 생성 완료
  downloaded_at timestamptz,
  uploaded_at   timestamptz,                   -- 유튜브 업로드 완료
  youtube_url   text,
  distributed_at timestamptz,                  -- 음원 유통 등록 완료
  distributor   text,                          -- 'distrokid' 등
  meta          jsonb not null default '{}',
  updated_at    timestamptz not null default now()
);

-- 4) 매출 (채널 불문 공통 스키마)
create table if not exists revenue (
  id          bigint generated always as identity primary key,
  channel     text not null,                   -- 'site' | 'appstore' | 'googleplay' | 'elgato' | 'youtube' | 'music'
  product     text not null,
  amount      numeric(12,2) not null,          -- 정산 통화 기준 금액
  currency    text not null default 'USD',
  qty         int not null default 1,
  occurred_at timestamptz not null,
  external_id text,                            -- 결제사/스토어 거래 ID (중복 방지)
  meta        jsonb not null default '{}',
  unique (channel, external_id)
);
create index if not exists revenue_occurred_idx on revenue (occurred_at desc);

-- 5) 데일리 브리핑 (Claude 예약 작업이 기록)
create table if not exists briefings (
  id          bigint generated always as identity primary key,
  brief_date  date not null unique,
  summary_md  text not null,
  highlights  jsonb not null default '[]',
  created_at  timestamptz not null default now()
);

-- 6) PrayerWire 지표 (일 단위 스냅샷)
create table if not exists platform_metrics (
  id          bigint generated always as identity primary key,
  platform    text not null default 'prayerwire',
  metric_date date not null,
  users_total int,
  users_new   int,
  requests_total int,                          -- 기도 요청 수
  dau         int,
  meta        jsonb not null default '{}',
  unique (platform, metric_date)
);

-- RLS: 본인(서비스 키/로그인 사용자)만 접근
alter table projects enable row level security;
alter table events enable row level security;
alter table albums enable row level security;
alter table revenue enable row level security;
alter table briefings enable row level security;
alter table platform_metrics enable row level security;

-- 로그인한 사용자(사장님 계정)에게 읽기 허용, 쓰기는 service_role 키(수집기)만
do $$
declare t text;
begin
  foreach t in array array['projects','events','albums','revenue','briefings','platform_metrics'] loop
    execute format('create policy "read for authenticated" on %I for select to authenticated using (true)', t);
  end loop;
end $$;

-- Realtime 활성화 (대시보드 실시간 갱신)
alter publication supabase_realtime add table events, revenue, albums, projects;
