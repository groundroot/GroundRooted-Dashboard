# CleanShot 레퍼런스 분석 및 적용

참조: https://cleanshot.com/ · 확인: 2026-09-20 · [적용 디자인 시스템](../DESIGN.md)

## 확인 방법과 관찰

공식 사이트 본문, agent-reach/Jina 웹 읽기, Chromium의 desktop 1440×1000 / mobile 390×844 화면을 확인했다. 로컬 참조 캡처는 `output/playwright/cleanshot-reference-{desktop,features,mobile}.png`다.

CleanShot은 밝은 배경·푸른 히어로·큰 가치 제안·주요/보조 행동을 앞에 배치한다. 기능 섹션에서는 짧은 설명과 대형 제품 시연을 결합하고, 일부 기능은 파스텔 카드로 묶는다. 실제 computed style은 h1 60px/600, h2 40px/600, Google Sans Flex와 시스템 폰트 fallback이다. 모바일은 클릭 메뉴와 세로 CTA다.

원본에서 보이는 그림자·테두리·hover는 사용자 금지로 채택하지 않았다. 사용자 수·후기·가격·보증·제품 기능은 다른 제품의 사실이므로 재사용하지 않았다. 원본 이미지/영상/폰트 파일을 복사하거나 우리 앱으로 오인시키지 않는다.

## 적용 결정

- 원본의 정보 위계와 시연 중심 구성을 GroundRooted 제품에 맞게 적용했다. EPUB과 MD+이미지 체험은 그대로 작동한다.
- 파란 CTA/큰 제목/옅은 시연 배경/파스텔 기능 카드/단일 헤더로 전환했다. 읽기 좋은 한국어를 위해 자체 제공 Pretendard를 사용한다. 색상·간격은 정본의 GroundRooted 적용값이며 원본 CSS 완전 복제값이 아니다.
- 그림자와 hover CSS를 활성 스타일에서 제거했다. SpotlightCard의 pointer handler와 RAF/glow DOM도 제거했다. 시연 패널과 버튼은 배경색으로 경계를 드러낸다.
- '아웃스트로트'는 장식용 외곽선/스트로크로 해석해 사용자에게 알렸다. 키보드 포커스 표시와 아이콘/도표의 정보성 선은 남긴다.
- 루트 DESIGN.md를 교체하고 사용자 설치 Raycast 원문·이전 테마는 archive에 보존했다. 기존 HQ/DB/거래 동작은 변경하지 않았다.

## 검수 상태

구현 후 typecheck/production build 통과. 첫 실제 화면 검사에서 모든 일반 DOM의 box/text shadow, drop-shadow, 장식 border가 없음을 확인했다. Story 작은 레이블의 대비 부족 1종을 발견해 더 어둡게 보완했다. 최종 브라우저 검사 결과는 아래 후속 기록을 따른다.

이번 작업은 로컬 첫 페이지 변경이며 배포·결제·외부 계정 변경·Higgsfield 재생성은 하지 않았다. 실제 앱 자산/독립 검수 등 제품 출시 게이트는 계속 미완료다.

### 최종 확인

- 대비 보완 후 production build와 TypeScript 검사 통과. 데스크톱·모바일 각각 EPUB/MD 탭 axe 자동 검사 위반 0 (WCAG 2 A/AA, 2.1 AA, best-practice 태그). 수동 보조기술 검수 완료를 뜻하지 않는다.
- 대표 CTA와 기능 카드의 hover 전후 배경색·글자색·transform·shadow·border·밑줄 값이 동일했다. SpotlightCard는 `data-effects="disabled"`이며 포인터 이벤트 로직이 없다.
- 모바일 메뉴의 aria-expanded 전환, Escape 닫기와 버튼 포커스 복귀, 링크 선택 시 닫힘을 확인했다. 키보드 포커스는 3px 파란 실선이다.
- MD 탭에서 320/390/768/1024/1440px 문서 가로 넘침 없음. 모바일 EPUB 글자 크기 End 키로 28px 전환, 본문 scrollWidth/clientWidth 각각 288px 확인. 사진·양식 파일 선택 시 해당 이미지 경로로 연동됨을 확인했다.
- 미리보기 HTTP 200 및 noindex/nofollow, HQ와 유사 경로 307/login, 설명용 그래프 SVG 200을 재확인했다.
- 최종 데스크톱 MD와 모바일 히어로 캡처를 직접 확인했다. `output/playwright/cleanshot-final-md-desktop.png`, `cleanshot-final-mobile.png` (Git 제외).
