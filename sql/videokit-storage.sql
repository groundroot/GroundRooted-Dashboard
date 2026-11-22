-- 클로드 비디오 키트: 판매용 키트 zip을 둘 비공개 Storage 버킷 (Supabase SQL Editor에 붙여넣어 한 번 실행)
-- 주문·구매자 정보는 저장하지 않는다. 이 버킷에는 키트 zip 파일 하나만 둔다.
-- 공개(public)로 만들지 않는다. 서버가 7일짜리 서명 링크를 만들어 구매자에게 보낸다.
insert into storage.buckets (id, name, public) values ('videokit', 'videokit', false)
on conflict (id) do update set public = false;
