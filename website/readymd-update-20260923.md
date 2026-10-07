# ReadyMD 문구와 마무리 배경 변경

- 히어로: For Your 2nd Brain / 지성 확장의 시작.
- 제품 표기: ReadyMD 레디엠디. 헤더·히어로·출시 안내·푸터·페이지 메타데이터 반영.
- 별빛을 마무리 문구 뒤의 absolute 배경으로 이동. 별도 하단 영역과 정지 버튼 제거.
- 제작사 GroundRooted, /pdf-to-md 경로 유지.

## 검증

- TypeScript 검사 통과. Node 24 프로덕션 빌드 통과.
- ego-browser 실제 Chromium: 1440px 데스크톱, 390px 모바일의 히어로·마무리 영역 스크린샷 검수.
- 320/390/1440px 가로 넘침 없음. 이전 제품명·푸터 별빛 버튼 부재, 배경 위치 확인.
- 일반 모드 별빛 running, 모션 감소 설정 후 새로 로드한 상태 paused 확인.
- 실행 중 모션 설정 전환은 ego CDP 에뮬레이션에서 change 이벤트 반영이 확인되지 않아 미검증. 기존 matchMedia change 구독 유지.
- git diff --check 통과. 배포·실기기 검수는 수행하지 않음.

미리보기: http://127.0.0.1:3027/pdf-to-md
