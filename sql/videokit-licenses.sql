-- 클로드 비디오 키트: 구매자 키 (Supabase SQL Editor에 붙여넣어 한 번 실행, 다시 실행해도 안전)
-- 키트의 /videokit update가 이 키로 GET /api/videokit/latest를 부른다. 키는 결제 후 키트 메일에 들어간다.
-- 키 형식: VK-XXXX-XXXX-XXXX (대문자 · 숫자, 0/O · 1/I 제외). 키는 서버(products/videokit-license.ts)가 만든다.
-- 주문번호 하나에 키 하나(order_id unique). 이름 · 전화번호는 저장하지 않는다.
create table if not exists videokit_licenses (
  key          text primary key check (key ~ '^VK-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$'),
  email        text not null,
  order_id     text unique,
  created_at   timestamptz not null default now(),
  revoked      boolean not null default false,  -- true면 업데이트를 받지 못한다 (환불 등)
  last_seen_at timestamptz,                     -- 마지막으로 업데이트를 확인한 시각
  last_version text                             -- 그때 키트가 알려 준 설치 버전
);

-- 공개(anon) · 로그인(authenticated) 사용자는 읽지도 쓰지도 못한다. 정책을 만들지 않으므로
-- 서버의 service_role 키만 접근한다(service_role은 RLS를 우회). 대시보드의 'read for authenticated' 정책에 넣지 않는다.
alter table videokit_licenses enable row level security;
revoke all on table videokit_licenses from anon, authenticated;
-- 새 테이블은 Data API 권한을 명시해야 한다(없으면 42501). 서버가 쓰는 만큼만 준다.
grant select, insert, update on table videokit_licenses to service_role;
