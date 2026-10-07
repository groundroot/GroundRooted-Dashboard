# 공개 홈페이지 품질 개선 — 2026-10-04

## 목표와 적용 범위

브랜드 홈과 제품 소개를 일관된 타이포그래피·레이아웃·탐색·상태 안내로 연결한다. 메인은 제품을 선택하는 화면, 상세는 사용 흐름과 제약을 이해하는 화면으로 구성했다. 실제 결제·제품 출시·배포는 이번 구현의 완료 조건이 아니다.

착수 시 dirty worktree와 기존 DESIGN.md 2.8, 공용 Wiki의 프로젝트 기록을 확인했다. 사용자가 지정한 밝은 톤, 그림자·hover 효과·장식 외곽선 금지, ReadyMD 브랜드 문구와 Lightfall/별빛을 유지했다. 앱 순서는 ReadyMD → YouTube to MD → TypeCut Pro다. 내부 HQ와 인증·데이터 모듈은 공개 페이지에서 분리한다.

## 찾고 적용한 스킬·저장소

| 자료 | 확인·선정 근거 | 적용 |
| --- | --- | --- |
| [Vercel agent-skills](https://github.com/vercel-labs/agent-skills) | Vercel 공식 소스. 조회 시 GitHub stars 31,876. revision `063bee94c3f4df8453406c830b0a7df0f2860278` | 기존 React best practices 적용. `web-design-guidelines`를 공식 skill-installer로 추가 설치하고 공개 컴포넌트 검수에 적용 |
| [Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines) | 공식 최신 `command.md` 읽음 | 의미 있는 HTML, 키보드, 포커스, 반응형, 상태 안내. hover 권장은 사용자 금지 지시가 우선 |
| [Anthropic skills](https://github.com/anthropics/skills) | 공개 공식 소스. 조회 시 GitHub stars 179,495 | 기존 설치된 `frontend-design` 적용: 브랜드 고유 구성, 제품별 표면, 한글 타이포그래피 |
| [IBM Carbon](https://github.com/carbon-design-system/carbon) | IBM 공개 디자인 시스템, Apache-2.0. 조회 시 stars 9,517, revision `ab7a96b9247bdab492b99abcd177f8dad930d386` | [2x Grid](https://www.carbondesignsystem.com/building-blocks/foundations/2x-grid/overview)의 정렬·여백·고정/유동 레이아웃 원칙 참고. Carbon 패키지·소스·IBM 자산은 복사하지 않음 |
| [axe-core](https://github.com/dequelabs/axe-core) | Deque 접근성 검사 엔진, MPL-2.0. 기존 설치 4.13.0 사용 | WCAG A/AA 자동 검사, 대체 탭 상태까지 검사 |
| [Playwright](https://github.com/microsoft/playwright) | Microsoft 공식 브라우저 테스트 프레임워크, Apache-2.0 | 후보로 확인. 이 환경에서는 기존 `ego-browser` Chromium으로 검증해 별도 런타임·브라우저 의존성을 추가하지 않음 |

탐색에는 `find-skills`와 `agent-reach`의 GitHub CLI 경로, 구현에는 `frontend-design`·`accessibility`·`vercel-react-best-practices`, 브라우저 검수에는 `ego-browser`를 사용했다. skills.sh도 확인했지만 설치 수만으로 선정하지 않았다. 추가 설치 경로는 `~/.codex/skills/web-design-guidelines`; 기존 스킬을 덮어쓰지 않았다. 새 스킬은 다음 대화 턴에서 자동 발견할 수 있다.

일반 UI·설명용 예시에는 의미 판단 API가 필요하지 않아 TypeSafe 연동을 추가하지 않았다. 새 운영 의존성, 유료 UI 키트, 원격 서비스는 도입하지 않았다.

## 구현

- **공통 브랜드:** `PublicHeader`·`PublicFooter`, `.gr-public` 범위의 색상·레이아웃 토큰, 파비콘, 일관된 제품 링크. 모바일 메뉴는 native details이며 Escape 닫기와 포커스 복귀를 제공한다.
- **메인:** 두 영역의 히어로, 제품 바로가기, ReadyMD 대표 영역과 두 보조 앱, 작업별 제품 선택 가이드, 제작 이야기, FAQ, 마무리 CTA. 설명용 문서·영상·대본 개념도를 직접 작성했다.
- **YouTube to MD:** 자막/Markdown 예시, 방향키·Home/End 탭 전환, 원문 복사 및 권한 거부 안내, 세 단계 워크플로, FAQ, 실제 출시 상태, 관련 제품 링크.
- **ReadyMD:** 공통 브랜드 메뉴와 제품 내 탐색 분리. 사용자가 조작할 수 있는 체험을 히어로 바로 다음으로 옮기고, 제작 이야기를 FAQ 앞에 배치했다. 브랜드 문구·체험·계산기·배경 효과를 유지했다.
- **접근성·로딩:** 한 페이지 한 h1, skip link, focus-visible, 터치 대상, 화면 폭에 맞춘 줄바꿈, 모션 감소 시 GSAP 불필요 로드 방지, 지연 이미지 로딩. 메인 그림은 서버 HTML/CSS로 표현한다.
- **유지보수:** 검수 스크립트, npm scripts, DESIGN.md 3.0, 소스 포맷 정리. 모든 앱 데이터는 기존 catalog를 공통으로 사용한다.

## 검증 결과

Node **24.21.0**, Next **16.3.5**, 기존 의존성을 연결한 임시 소스 복사본에서 실행했다. 기존 작업 트리의 `.next`를 덮어쓰지 않았다.

| 범위 | 결과 |
| --- | --- |
| `next build --webpack` | 통과. 공개 3페이지 정적 생성 |
| TypeScript | 통과 |
| 공개 경로·인증 테스트 | 통과. 공개 allowlist, HQ 비노출, 유효/무효/누락 쿠키, 비밀번호 미설정 fail-closed, preview flag, TypeCut Pro 공식 307 연결 |
| ReadyMD 비용·책 계산 테스트 2개 | 통과 |
| 공개 UI 검수 | 32개 통과. `scripts/verify-public-ui.mjs` |
| 반응형 | 3페이지 × 320/390/768/1024/1440px에서 가로 넘침 없음, h1 1개, 깨진 이미지·누락된 페이지 내 앵커 없음 |
| axe | 각 페이지 390/1440px와 ReadyMD 대체 탭에서 검사 위반 0 |
| 사용자 조작 | 메뉴·Escape·포커스, FAQ, 탭·키보드, EPUB 28px 조절, 연결된 이미지 표시 통과 |
| 복사 | 모의 클립보드에서 성공·권한 거부 분기 검증. 사용자 시스템 클립보드 보존 |
| 모션 감소 | 정적 히어로 확인 |
| JS 없는 메뉴 | JavaScript 비활성화 상태에서 native 메뉴 열림 확인 |
| 강제 색상 | Chromium forced-colors 메뉴 화면 확인 |
| 화면 확인 | 메인·YouTube 전체 페이지, ReadyMD 히어로·체험. ReadyMD 모바일 전체 길이는 도구 캡처 한도를 넘어 구간별 확인 |
| `git diff --check` | 통과 |

화면·기계 판독 결과는 `output/playwright/enterprise-upgrade/`에 저장한다. 로컬 확인 주소는 `http://127.0.0.1:3045`.

로컬 Chromium 단회 관측값은 메인 LCP 약 0.76초, YouTube 0.73초, ReadyMD 1.09초이며 CLS는 0 / 0 / 약 0.00017이다. **루프백 로컬 관측**으로, 명령으로 요청한 CPU/네트워크 제한의 실제 적용은 별도 검증하지 않았다. Lighthouse 점수·실기기 지표·배포된 사이트의 Core Web Vitals·이전 버전 대비 향상 수치로 사용하면 안 된다. 원본은 `performance-observations.json`이다.

## 재현

README의 공개 사이트 품질 검수 절을 따른다. Node 24에서 빌드 후 `pnpm test:calculations`, `pnpm test:storefront`를 실행한다. 미리보기 서버와 ego-browser CLI를 준비한 뒤:

```bash
node scripts/verify-public-ui.mjs http://127.0.0.1:3045
```

전용 브라우저 작업 공간을 생성해 종료한다. 이미 이번 작업에 할당한 공간을 계속 사용할 때만 `--space=N`을 지정한다. 통과 시 `ui-audit.json`과 PNG가 남는다.

## 남은 실제 출시 검증

실제 제품 캡처·PDF 변환/자막 수집 결과, 확정 가격·지원 OS·라이선스·환불 정책, 실제 결제·배포, 실기기 Safari/VoiceOver, 배포 환경 성능은 이번 검증에 포함되지 않았다. 이 자료 없이 고객 수·후기·지원 정책을 만들지 않았다. 제품 소개의 noindex/preview 설정은 현재 공개 준비 상태에 맞게 유지했다.
