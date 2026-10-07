# Lightfall와 무료 푸터 별빛 — 2026-09-22

## 적용

- 첨부 이미지의 첫 화면 HeroReader 카드 제거. 하단 ReadingExperience의 EPUB·MD 조작은 유지.
- 메인 MoltenMetal을 React Bits Lightfall로 교체하고 중앙 정렬한 제목·CTA 구성.
- Lightfall 원본 셰이더는 공식 저장소 revision `9481af758aae6cfb34c3652ec40a1c099360331f` 사용. 원본 사본·수정 이력·라이선스 보존. LICENSE.md blob SHA가 기존 보존본과 동일함을 확인.
- 푸터 마지막은 Canvas 2D로 직접 제작한 방사형 별 입자. 유료 React Bits Pro 소스·번들·프리뷰 자산을 가져오지 않았으며 공식 Star Burst나 1:1 복제라고 주장하지 않는다.
- 패키지 추가·구매 없음. 푸터는 80개(모바일)/150개(데스크톱) 별, 30fps 상한, DPR 1.5 상한. Lightfall은 30fps/DPR 1 상한과 모바일 수동 시작.
- 두 효과 모두 정지·모션 감소·숨김 탭·화면 밖 중단과 자원 정리. hover·그림자·장식 외곽선 없음.

## 검증

- Node 24 환경 typecheck 및 production build 통과.
- Playwright Chromium 실제 화면: 1440×1000 히어로/푸터, 390×844 모바일 정적/재생 히어로/푸터 확인.
- 320/390/768/1440px 가로 넘침 없음.
- 데스크톱·모바일 EPUB 기본 상태 axe 위반 0.
- 데스크톱 MD 탭 axe 위반 0. WebGL context-loss 이벤트를 모의해 정적 fallback 전환 확인.
- 히어로 제거/하단 체험 유지, 배경 수동 정지·재생, 화면 밖 히어로 중단 확인.
- 푸터 정지 후 캔버스 픽셀 불변 확인. 모션 감소 시 Lightfall 제거·푸터 정적 상태 확인.
- 모바일 초기 WebGL 미실행, 재생 버튼 후 실행 확인.
- 브라우저 console error/warning 0, 기존 HQ `/`는 307 로그인 리디렉션 유지.
- `git diff --check` 통과. 신규 성능 점수 측정·Safari/실기기·수동 스크린리더·배포는 수행하지 않음.

검수 이미지: `output/playwright/lightfall-hero-desktop.png`, `lightfall-hero-mobile.png`, `lightfall-mobile-playing.png`, `starfield-footer-desktop.png`, `starfield-footer-mobile.png`.

로컬 미리보기: http://127.0.0.1:3027/pdf-to-md

## 참고

- [React Bits Lightfall](https://reactbits.dev/c/backgrounds/lightfall)
- [React Bits Pro Star Burst 공개 설명](https://pro.reactbits.dev/docs/components/star-burst): 시각적 방향만 참고
- [MDN Canvas 애니메이션](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Basic_animations): 표준 Canvas 2D + requestAnimationFrame 접근
