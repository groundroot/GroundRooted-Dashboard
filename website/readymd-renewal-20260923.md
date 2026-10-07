# ReadyMD 스토리텔링 리뉴얼 구현·검수

일자: 2026-09-23. 사용자 ‘새로운 것으로 리뉴얼하자’ 요청에 따라 [스토리텔링 계획 1.0](readymd-storytelling-plan-v1.0.md)을 구현했다.

미리보기: <http://127.0.0.1:3028/pdf-to-md>. 기존 3027 서버는 종료하거나 재시작하지 않았다. 이번 작업에서 시작한 3028 서버는 `MARKETING_PREVIEW_ENABLED=true`, Node 24 프로덕션 실행이다.

## 구현한 흐름

1. **첫 화면:** For Your 2nd Brain / 지성 확장의 시작 / ReadyMD 레디엠디. 쉬운 한국어 설명과 ‘달라지는 모습 보기’가 중심이다. 첫 화면에 리더 카드는 다시 넣지 않았다.
2. **공감:** 작은 글씨, 끊어진 문장, 따로 찾아야 하는 그림을 사용자의 상황으로 설명한다.
3. **같은 자료의 변화:** ‘편하게 읽기’와 ‘AI와 활용하기’로 구분한다. 하나의 저작 샘플이 PDF 지면 → 읽기 본문 → MD와 그림 → 사용 순서에 반복되어 차이를 비교할 수 있다.
4. **대상별 쓰임:** 연구·공부, 수업·콘텐츠, 개인 지식의 구체적 사용 장면을 보여준다.
5. **사용법:** PDF 선택 → 로컬 모델로 내용 정리 → 결과 확인·활용의 세 단계다.
6. **질문과 마무리:** 지원·품질·자료 처리·출시 질문을 FAQ로 모았다. 출시 상태는 짧게 안내하고 ‘사람이 읽고, AI와 함께 활용하도록.’ 뒤에 별빛을 유지한다.

헤더 브랜드는 ReadyMD, 푸터 제작사는 GroundRooted다. 중복되던 ScrollStory·ResultComparison·기능 카드 영역은 현재 페이지에서 제외했다. 관련 컴포넌트 파일 자체는 보존했다.

## 실제로 조작할 수 있는 것

- 읽기 본문 16–28px 조절과 화면 폭에 따른 줄바꿈.
- 글과 연결된 그림을 함께 보는 MD 예시, 펼쳐 보는 파일 구조.
- MD 본문 복사, 설명용 MD와 SVG 각각 저장. 그림은 images 폴더에 보관하도록 안내한다.
- 키보드로 이동·선택할 수 있는 탭, 3단계 사용 흐름, FAQ, 모바일 메뉴.

샘플과 도표는 직접 작성한 설명용 자료다. 실제 앱 변환·EPUB 생성·자동 AI 전송을 실행하거나 성능을 증명하는 화면이 아니다. 가격·OS·실제 앱 화면·사용자 후기·처리 시간은 만들지 않았다.

## 주요 파일

- `app/pdf-to-md/page.tsx`: 스토리와 카피, 메타데이터, FAQ.
- `app/pdf-to-md/storytelling.css`: 새 화면 구성과 반응형 규칙. 기존 CSS 뒤에 적용한다.
- `components/marketing/ReadingExperience.tsx`: 동일 자료의 읽기/재사용 체험과 복사·저장.
- `components/marketing/StoryDocument.tsx`, `products/readymd-story.ts`: 공유 문서와 MD.
- `components/marketing/MarketingHeader.tsx`, `WorkflowDemo.tsx`: 제품명 중심 메뉴와 쉬운 사용 순서.
- `public/media/readymd/reading-map.svg`: 읽기 → 메모 → 연결 개념도. 실적/성능 수치가 없다.
- `proxy.ts`: 위 SVG 한 파일을 공개 자산 허용 목록에 추가. HQ 인증 로직은 유지한다.
- `DESIGN.md`: 최신 기준 2.3.

Lightfall, AnimatedContent, Stepper, SplitText, StatusMark를 유지한다. 새로운 hover·그림자·장식 외곽선을 추가하지 않았으며 키보드 포커스와 강제 색상 모드의 선택 표시는 보존한다. 푸터 별빛 정지 버튼은 없다.

## 검증 결과

| 항목 | 이번 작업의 증거 |
| --- | --- |
| 빌드·타입 | Node 24의 `next build` 통과. Next TypeScript 단계와 정적 페이지 생성 통과 |
| 변경 파일 기본 점검 | `git diff --check` 통과. 새로 만든/수정한 소스의 줄 끝 공백 별도 확인 |
| 화면 | Ego Chromium 데스크톱 1440px, 모바일 390px 및 320px 마무리 영역 스크린샷 확인 |
| 가로 넘침 | 읽기 화면 320/390/768/1440px 없음. 파일 구조를 펼친 AI 활용 화면 320/1440px 없음 |
| 접근성 자동 검사 | axe-core 4.13, WCAG 2 A/AA·2.1 AA·2.2 AA 태그. 읽기 화면 위 네 폭과 AI 활용 화면 320/1440px 위반 0건 |
| 대비 보정 | 초기 검사에서 보조 글자 대비 부족을 발견해 수정한 후 재검사 통과 |
| 글자 조절 | 키보드 Home/End로 16/28px 반영 확인. 모바일 28px에서도 본문 가로 넘침 없음 |
| 메뉴·탭·FAQ | 모바일 메뉴 열기, Escape 닫기·포커스 복귀. 탭 방향키 이동 후 Enter 선택. FAQ Enter 열기 확인 |
| 사용법 | 1→2→3단계 전환, 단계별 설명과 EPUB/MD/images 표시 확인 |
| 복사 | 실제 클립보드 내용에 MD 이미지 경로 포함 확인. API 거부를 주입한 경우 오류 안내 확인 |
| 다운로드 | 브라우저로 MD·SVG 저장. MD의 이미지 경로·예시 표기 확인, SVG 원본과 바이트 일치 |
| 리소스·오류 | 최종 데스크톱 검사에서 깨진 이미지 0, 수집한 console.error/페이지 오류 0 |
| 모션 감소 | reduce 설정 후 다시 로드: 히어로 WebGL Canvas 없음, 푸터 Canvas 존재·150ms 간 정지 프레임 동일, 푸터 버튼 0 |
| HTTP | `/pdf-to-md` 200 + `noindex, nofollow`, 새 SVG 200. 이번 미리보기는 HQ 비밀번호 없이 실행하므로 `/`는 기존 fail-closed 규칙에 따라 500으로 차단 |

스크린샷은 `/tmp/readymd-renewal-*.png`, 실제 저장 확인 파일은 `/tmp/readymd-renewal-downloads/`에 있다. 이 경로는 임시 검수 산출물이다.

브라우저 사용자 제어가 감지되어 자동화를 중단했다가, 사용자의 ‘계속해’ 요청 이후 같은 TaskSpace 12에서 재개했다.

## 확인하지 않은 범위

실제 PDF OCR·EPUB 출력, 실제 앱 품질, Safari·실기기, 수동 스크린리더, Lighthouse/실사용 성능 지표, 로그인 성공·결제·라이선스·배포는 이번 작업의 검증 범위가 아니다. 자동 접근성 검사는 모든 접근성 요구의 충족을 보증하지 않는다. 사이트는 로컬 미리보기이며 배포·커밋·푸시는 실행하지 않았다.
