-- 클로드 비디오 키트: 짧은 다운로드 링크 https://groundrooted.com/d/<코드> (Supabase SQL Editor에 붙여넣어 한 번 실행, 다시 실행해도 안전)
-- 키트 메일 · 수동 발송에 첨부 대신 이 링크를 보낸다. 링크는 expires_at(기본 7일 뒤, 서버는 그날 23:59 KST로 정함)에 무효가 되고,
-- 만료된 행은 새 링크를 발급할 때와 만료된 링크로 요청이 올 때 지운다(products/videokit-link.ts).
-- 코드 형식: 대문자 · 숫자 8자 고정 (0/O · 1/I 제외, 소문자가 없으니 l도 없음), 서버가 crypto 랜덤으로 만든다(40비트).
-- 주문번호 하나에 링크가 여러 개일 수 있다(재발송 · 시험 링크) → order_id는 unique가 아니다.
create table if not exists videokit_download_links (
  code             text primary key check (code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  email            text not null,
  name             text,
  order_id         text,
  created_at       timestamptz not null default now(),
  expires_at       timestamptz not null default now() + interval '7 days',
  revoked          boolean not null default false,  -- true면 바로 막힌다 (환불 · 공유됨, scripts/videokit-make-link.mjs --revoke)
  download_count   integer not null default 0,      -- 맥 · 윈도우 버튼을 누른 횟수 (페이지 열람은 세지 않음)
  max_downloads    integer not null default 10 check (max_downloads between 1 and 100),  -- 이 횟수를 넘으면 막힌다
  last_download_at timestamptz
);
create index if not exists videokit_download_links_order_idx on videokit_download_links (order_id);
create index if not exists videokit_download_links_expires_idx on videokit_download_links (expires_at);

-- 공개(anon) · 로그인(authenticated) 사용자는 읽지도 쓰지도 못한다. 정책을 만들지 않으므로 서버의 service_role 키만 접근한다.
alter table videokit_download_links enable row level security;
revoke all on table videokit_download_links from anon, authenticated;
grant select, insert, update, delete on table videokit_download_links to service_role;
