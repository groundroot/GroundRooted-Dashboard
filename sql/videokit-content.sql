-- 클로드 비디오 키트 1.4.2: 판매자 콘텐츠 온라인 제공 · 구매자 표식 (Supabase SQL Editor에 붙여넣어 한 번 실행, 다시 실행해도 안전)
-- 약속: FCP 키트 저장소 docs/update_server_contract_v3.md §4. 먼저 sql/videokit-licenses.sql · sql/videokit-devices.sql 이 적용되어 있어야 한다.
-- 표 · 함수를 더하기만 한다(기존 표는 바꾸지 않음, videokit_licenses에 열을 더하지 않음). 서버 코드보다 먼저 적용한다.
--
-- videokit_content_leases: 기기별로 받은 묶음 · 버전 · 임대 기간 · 받은 횟수. 문의 대응 기록이며 판단에는 쓰지 않는다(판단은 videokit_devices).
-- videokit_content_personal: 구매자별 개인 사본의 버킷 위치(content/personal/<subject>/<pack>-<version>.vkp) · sha256 · 크기.
--   같은 구매자는 기기가 달라도 같은 사본을 받는다. 옛 버전 사본은 새 버전 사본이 생긴 지 30일 뒤 서버가 지운다.
-- 표식 값 자체는 저장하지 않는다(검출은 서버 비밀로 다시 계산).

create table if not exists videokit_content_leases (
  id          bigint generated always as identity primary key,
  license_key text not null references videokit_licenses(key) on delete cascade,
  device_hash char(64) not null check (device_hash ~ '^[0-9a-f]{64}$'),
  pack        text not null check (pack ~ '^[a-z0-9-]{1,32}$'),
  version     text not null,
  issued_at   timestamptz not null,
  expires_at  timestamptz not null,
  downloads   int not null default 0,
  unique (license_key, device_hash, pack)
);

create table if not exists videokit_content_personal (
  id          bigint generated always as identity primary key,
  license_key text not null references videokit_licenses(key) on delete cascade,
  pack        text not null check (pack ~ '^[a-z0-9-]{1,32}$'),
  version     text not null,
  path        text not null check (path like 'content/personal/%'),
  sha256      char(64) not null check (sha256 ~ '^[0-9a-f]{64}$'),
  size        int not null check (size > 0),
  created_at  timestamptz not null default now(),
  unique (license_key, pack, version)
);

-- 공개(anon) · 로그인(authenticated) 사용자는 읽지도 쓰지도 못한다. 서버의 service_role만 접근한다(licenses · devices와 같은 방식).
alter table videokit_content_leases enable row level security;
alter table videokit_content_personal enable row level security;
revoke all on table videokit_content_leases, videokit_content_personal from anon, authenticated;
grant select, insert, update, delete on table videokit_content_leases to service_role;
grant select, insert, delete on table videokit_content_personal to service_role;

-- 임대 기록 (GET /api/videokit/content 200일 때). 받은 횟수는 서명 링크를 준 때만 +1, 원자적으로 더한다.
create or replace function videokit_content_lease(p_key text, p_device text, p_pack text, p_version text, p_issued_at timestamptz, p_expires_at timestamptz, p_download boolean)
returns void language sql set search_path = public as $$
  insert into videokit_content_leases (license_key, device_hash, pack, version, issued_at, expires_at, downloads)
  values (p_key, p_device, p_pack, p_version, p_issued_at, p_expires_at, case when p_download then 1 else 0 end)
  on conflict (license_key, device_hash, pack) do update
    set version = excluded.version, issued_at = excluded.issued_at, expires_at = excluded.expires_at,
        downloads = videokit_content_leases.downloads + excluded.downloads
$$;
revoke execute on function videokit_content_lease(text, text, text, text, timestamptz, timestamptz, boolean) from public, anon, authenticated;
grant execute on function videokit_content_lease(text, text, text, text, timestamptz, timestamptz, boolean) to service_role;
