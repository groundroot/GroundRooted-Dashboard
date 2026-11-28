-- 클로드 비디오 키트: 업데이트 기기 등록 · 키당 허용 대수 (Supabase SQL Editor에 붙여넣어 한 번 실행, 다시 실행해도 안전)
-- 약속: FCP 키트 저장소 docs/update_server_contract_v2.md (§2.4). 먼저 sql/videokit-licenses.sql 이 적용되어 있어야 한다.
-- 이 파일은 열 · 테이블 · 함수를 더하기만 한다. 지금 배포된 서버 코드와 함께 돌아가도 아무것도 바뀌지 않으므로, 서버 코드보다 먼저 적용한다.
--
-- 허용 대수 = videokit_licenses.device_limit + videokit_device_addons.devices 합계.
--   device_limit 이 NULL이면 무제한(대수 검사 안 함). 기존 키는 모두 NULL로 남는다(종전 약관: 대수 제한 없음).
--   새 키의 2는 서버가 발급할 때 넣는다(환경변수 VIDEOKIT_DEVICE_LIMIT_FROM 이후 발급분만, products/videokit-license.ts issueLicense).
--   그래서 device_limit 에는 default를 두지 않는다 — default 2를 두면 기존 구매자 전원이 2로 채워진다.
-- 기기 값(device_hash)은 키트가 HMAC-SHA256(구매자 키, 하드웨어ID)로 만든 64자 hex다. 하드웨어 원본값은 받지도 저장하지도 않는다.

alter table videokit_licenses add column if not exists device_limit  int check (device_limit is null or device_limit >= 0);
alter table videokit_licenses add column if not exists reset_count   int not null default 0;
alter table videokit_licenses add column if not exists last_reset_at timestamptz;

create table if not exists videokit_devices (
  id            bigint generated always as identity primary key,
  license_key   text not null references videokit_licenses(key) on delete cascade,
  device_hash   text not null check (device_hash ~ '^[0-9a-f]{64}$'),
  platform      text not null check (platform in ('mac', 'windows')),
  label         text check (label is null or char_length(label) <= 40),  -- 기본값은 모델 식별자. 호스트명은 넣지 않는다.
  kit_version   text,
  registered_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  unique (license_key, device_hash)
);
create index if not exists videokit_devices_key_order on videokit_devices (license_key, registered_at, id);

-- 추가 기기(1대 5만원 등). id가 PK라서 결제 완료 화면 새로고침 · 웹훅 재시도에도 두 번 들어가지 않는다.
--   카드 · 가상계좌: id = 토스 주문번호(vk-device-r-…), source 'card'
--   계좌이체 · 수동: scripts/videokit-devices.mjs add 가 넣는다(id = 주문번호 또는 manual-<uuid>), source 'transfer' | 'manual'
create table if not exists videokit_device_addons (
  id          text primary key,
  license_key text not null references videokit_licenses(key) on delete cascade,
  devices     int not null check (devices between 1 and 100),
  source      text not null check (source in ('card', 'transfer', 'manual')),
  amount      int,
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists videokit_device_addons_key on videokit_device_addons (license_key);

-- 공개(anon) · 로그인(authenticated) 사용자는 읽지도 쓰지도 못한다. 서버의 service_role만 접근한다(licenses와 같은 방식).
alter table videokit_devices enable row level security;
alter table videokit_device_addons enable row level security;
revoke all on table videokit_devices, videokit_device_addons from anon, authenticated;
grant select, insert, update, delete on table videokit_devices to service_role;
grant select, insert, delete on table videokit_device_addons to service_role;

-- 허용 대수(NULL = 무제한)
create or replace function videokit_device_allowance(p_key text) returns int
language sql stable set search_path = public as $$
  select case when l.device_limit is null then null
              else l.device_limit + coalesce((select sum(a.devices) from videokit_device_addons a where a.license_key = l.key), 0)::int end
  from videokit_licenses l where l.key = p_key
$$;

-- 등록 (POST /api/videokit/devices/register). 키 행을 잠가 개수 확인과 삽입 사이에 다른 등록이 끼지 못하게 한다.
-- p_enforce = false(환경변수 VIDEOKIT_DEVICE_ENFORCE 꺼짐)면 한도를 넘어도 등록한다(기록만).
-- 돌려주는 값: {"status":"registered"|"already_registered"|"device_limit"|"invalid_key","used":n,"limit":n|null}
create or replace function videokit_register_device(p_key text, p_device text, p_platform text, p_label text, p_kit_version text, p_enforce boolean)
returns jsonb language plpgsql set search_path = public as $$
declare
  v_revoked boolean;
  v_limit int;
  v_used int;
  v_id bigint;
begin
  select revoked into v_revoked from videokit_licenses where key = p_key for update;
  if not found or v_revoked then return jsonb_build_object('status', 'invalid_key'); end if;
  v_limit := videokit_device_allowance(p_key);
  update videokit_devices set label = coalesce(p_label, label), kit_version = coalesce(p_kit_version, kit_version), last_seen_at = now()
    where license_key = p_key and device_hash = p_device returning id into v_id;
  select count(*) into v_used from videokit_devices where license_key = p_key;
  if v_id is not null then return jsonb_build_object('status', 'already_registered', 'used', v_used, 'limit', v_limit); end if;
  if p_enforce and v_limit is not null and v_used >= v_limit then
    return jsonb_build_object('status', 'device_limit', 'used', v_used, 'limit', v_limit);
  end if;
  insert into videokit_devices (license_key, device_hash, platform, label, kit_version) values (p_key, p_device, p_platform, p_label, p_kit_version);
  return jsonb_build_object('status', 'registered', 'used', v_used + 1, 'limit', v_limit);
end $$;

-- 확인 (GET /api/videokit/latest). rank = registered_at 오름차순 순번(없으면 null). p_device가 null이면 개수만.
-- 돌려주는 값: {"rank":n|null,"used":n,"limit":n|null}
create or replace function videokit_check_device(p_key text, p_device text)
returns jsonb language sql stable set search_path = public as $$
  select jsonb_build_object(
    'rank', (select r.rn from (select device_hash, row_number() over (order by registered_at, id) as rn from videokit_devices where license_key = p_key) r where r.device_hash = p_device),
    'used', (select count(*) from videokit_devices where license_key = p_key),
    'limit', videokit_device_allowance(p_key))
$$;

-- 리셋 (운영봇 scripts/videokit-devices.mjs reset). 그 키의 기기를 모두 지우고 reset_count + 1, last_reset_at 기록. device_limit은 그대로.
-- 키가 없으면 null.
create or replace function videokit_reset_devices(p_key text)
returns jsonb language plpgsql set search_path = public as $$
declare
  v_devices jsonb;
  v_count int;
  v_reset_count int;
  v_reset_at timestamptz;
begin
  perform 1 from videokit_licenses where key = p_key for update;
  if not found then return null; end if;
  with d as (delete from videokit_devices where license_key = p_key returning platform, label, registered_at)
  select count(*), coalesce(jsonb_agg(jsonb_build_object('platform', platform, 'label', label, 'registered_at', registered_at) order by registered_at), '[]'::jsonb)
    into v_count, v_devices from d;
  update videokit_licenses set reset_count = reset_count + 1, last_reset_at = now() where key = p_key
    returning reset_count, last_reset_at into v_reset_count, v_reset_at;
  return jsonb_build_object('deleted', v_count, 'devices', v_devices, 'reset_count', v_reset_count, 'reset_at', v_reset_at);
end $$;

-- 함수는 public 스키마에 만들면 누구나 실행할 수 있으므로(Data API의 /rpc) 서버만 부르게 한다.
revoke execute on function videokit_device_allowance(text) from public, anon, authenticated;
revoke execute on function videokit_register_device(text, text, text, text, text, boolean) from public, anon, authenticated;
revoke execute on function videokit_check_device(text, text) from public, anon, authenticated;
revoke execute on function videokit_reset_devices(text) from public, anon, authenticated;
grant execute on function videokit_device_allowance(text) to service_role;
grant execute on function videokit_register_device(text, text, text, text, text, boolean) to service_role;
grant execute on function videokit_check_device(text, text) to service_role;
grant execute on function videokit_reset_devices(text) to service_role;
