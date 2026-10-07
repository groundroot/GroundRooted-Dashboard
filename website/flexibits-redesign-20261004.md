# Flexibits 레퍼런스 디자인 개편

날짜: 2026-10-04. 사용자 지정 레퍼런스: [Flexibits 홈페이지](https://flexibits.com/).

## 실제 관찰

Ego Browser의 동일 작업 공간에서 홈페이지를 1440×1000과 390×844로 열어 전체 캡처했다. [Fantastical 상세](https://flexibits.com/fantastical)도 데스크톱 첫 화면과 제목 스타일을 확인했다. `agent-reach` 웹 읽기와 `frontend-design`을 적용했다.

- 데스크톱: 상단 간결한 브랜드/제품 탐색과 둥근 CTA, 청색에서 녹색으로 연결되는 두 제품 패널, 세 번째 가로 배너.
- 제품 패널: 큰 제품명, 짧은 설명, 큰 앱 아이콘, 알약 모양 버튼. 모바일은 제품을 세로로 쌓는다.
- 이후 중앙 브랜드 가치 제안, 컬러 아이콘, 넓은 여백, 세 개의 글 카드, 어두운 푸터가 이어진다.
- 실제 홈페이지 제품 링크 영역은 데스크톱에서 각각 512×408px, 반경 32px였다. 컴퓨티드 서체는 Effra 계열이다. 상세 페이지는 중앙 제품명/문구/행동/시연 구조였다.
- 원본 그림자·장식 경계·hover는 기존 사용자 제약에 따라 가져오지 않는다. 원본 브랜드 자산·CSS·유료 서체·카피는 사용하지 않는다.

관찰 캡처: `output/playwright/flexibits-redesign/reference-{desktop,mobile,product}.png`. 외부 웹페이지 캡처는 검수 자료이며 서비스 자산으로 배포하지 않는다.

## 적용

| 영역 | 구현 |
|---|---|
| 메인 첫 화면 | ReadyMD·YouTube to MD의 2열 제품 패널과 색상별 CTA, 모바일 세로 배치 |
| TypeCut Pro | 보라색 가로 배너와 자체 컬러 도형, 기존 공식 외부 사이트 연결 |
| 브랜드 소개 | 중앙 제목·주황색 강조·자체 앱 기호 조합 |
| 시연 | 작업 선택 탭과 GPT Image·Higgsfield 장면 |
| 사용 장면 | 생성 이미지·자료/쓰임 선택을 담은 3열 카드 |
| 제품 선택 | 기존 작업별 가이드 재배치·둥근 컨트롤 |
| 공통 헤더 | 제품 기호·간결한 탐색·앱 둘러보기 CTA·모바일 메뉴 |
| 공통 푸터 | 검은 바탕·밝은 링크·제품/안내 목록 |
| YouTube 상세 | 중앙 제품명/제목/행동, 넓은 설명 이미지, 녹색 제품 강조 |
| ReadyMD 상세 | 둥근 히어로·파란 알약 버튼·통일된 제목/푸터, 기존 Lightfall·문서 체험 유지 |

`AppMark.tsx`는 기존 Lucide 조합의 자체 웹사이트 기호다. 실제 배포 앱 아이콘임을 주장하지 않는다. 새 이미지 생성이나 유료 패키지 추가는 없다. 기존 생성 자산의 [출처·프롬프트](interactive-art-direction-20261004.md)는 그대로 적용된다.

핵심 변경 파일: `app/page.tsx`, `components/storefront/AppMark.tsx`, `PublicHeader.tsx`, `ProductPage.tsx`, `StorefrontShell.tsx`, `flexibits-theme.css`, `app/pdf-to-md/layout.tsx`. 활성 디자인 명세는 `DESIGN.md` 5.0이다.

## 검증

완료 시 최종 실행 결과를 아래에 기록한다. 운영 배포가 아닌 localhost:3045 미리보기 작업이다.

- Node 24.21.0의 `next build --webpack`: 빌드 및 TypeScript 통과. 활성 미리보기의 소스 복사본에서 실행했다.
- `test-storefront-routes.mjs`: 공개 경로·자산 MIME·HQ 비노출·인증 실패/성공·환경 미설정 차단·preview flag 통과.
- 공개 UI 검사 **32개 통과**: 세 페이지의 320/390/768/1024/1440px 가로 넘침 없음, 390/1440px axe WCAG 위반 0, 모바일 메뉴/Escape, 자막 탭/복사 성공·실패, FAQ, EPUB 크기 조절, 연결 이미지, 모션 감소.
- 인터랙션 검사 **23개 통과**: 미디어 초기 요청 없음·실제 재생/정지·화면 밖 정지·오류 재시도, 탭 키보드, 자료/다음 쓰임, 제품 가이드, 320px 각 선택 상태, 이미지 로딩, 스크롤 진행, ReadyMD 영상.
- 모바일 탭 검사에서 Ego가 버튼 내부 span을 '가로채는 요소'로 판단했다. DOM 위치 확인 결과 버튼 자체의 자식이었다. 보이는 라벨 span을 정상 클릭해 선택과 링크 변경을 검증했다. 헤더가 실제 버튼을 가리는 문제는 확인되지 않았다.
- 데스크톱·모바일 전체 화면과 상세 페이지를 실제 렌더링해 시각 검수했다. 로컬 미리보기는 `http://127.0.0.1:3045`에서 최신 빌드로 실행 중이다.
- 검사 출력은 `output/playwright/flexibits-redesign/public/` 및 `interactions/`에 보관한다. 두 검수 스크립트에 `--output=` 옵션을 추가해 이전 디자인의 검사 자료를 덮어쓰지 않는다.
- 실제 운영 배포·네이버페이 결제는 수행하지 않았다. 이번 변경은 공개 소개 화면의 디자인이다.

재검수:

```sh
# 기존 Ego 작업 공간 번호를 지정한다.
npx --yes --package=node@24 node scripts/verify-public-ui.mjs http://127.0.0.1:3045 --space=1 --output=output/playwright/flexibits-redesign/public
npx --yes --package=node@24 node scripts/verify-editorial-ui.mjs 1 http://127.0.0.1:3045 --output=output/playwright/flexibits-redesign/interactions
```
