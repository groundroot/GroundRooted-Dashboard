-- 프로젝트별 AI 투입 비용 (Supabase SQL Editor에 1회 실행)
create table if not exists ai_project_cost (
  id         bigint generated always as identity primary key,
  project    text not null,
  tool       text not null,
  cost_usd   numeric(12,4) not null default 0,
  tokens     bigint not null default 0,
  updated_at timestamptz not null default now(),
  unique (project, tool)
);
create index if not exists ai_project_cost_cost_idx on ai_project_cost (cost_usd desc);

alter table ai_project_cost enable row level security;
create policy "read for authenticated" on ai_project_cost for select to authenticated using (true);
alter publication supabase_realtime add table ai_project_cost;
