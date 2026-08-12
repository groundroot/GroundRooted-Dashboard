-- AI 에이전트 사용량/비용 (Supabase SQL Editor에 1회 실행)
-- 하루 × 도구 × 모델 단위로 집계한다. 수집기가 매번 전체를 다시 계산해 upsert하므로
-- 중복 실행해도 안전하다.

create table if not exists ai_usage (
  id                 bigint generated always as identity primary key,
  tool               text not null,          -- 'claude-code' | 'codex'
  model              text not null,
  usage_date         date not null,
  input_tokens       bigint not null default 0,
  cache_write_tokens bigint not null default 0,
  cache_read_tokens  bigint not null default 0,
  output_tokens      bigint not null default 0,
  cost_usd           numeric(12,4) not null default 0,
  priced             boolean not null default true,  -- false면 단가표에 없는 모델 (비용 0으로 집계됨)
  updated_at         timestamptz not null default now(),
  unique (tool, model, usage_date)
);
create index if not exists ai_usage_date_idx on ai_usage (usage_date desc);

alter table ai_usage enable row level security;
create policy "read for authenticated" on ai_usage for select to authenticated using (true);
alter publication supabase_realtime add table ai_usage;
