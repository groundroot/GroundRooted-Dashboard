# PDF 제품 소개 — 로컬 OCR · EPUB · Markdown + 이미지

기준: 2026-09-20 사용자가 직접 설명한 제품 특징. 실제 앱 실행/성능 검증과 구분한다.

## 핵심 메시지

**사람에게는 읽기 편하게. AI에게는 이해하기 쉽게.**

하나의 PDF를 로컬 모델 OCR로 읽고 재구성해 사람이 편하게 읽는 EPUB과 AI가 활용하기 좋은 Markdown으로 만든다. Markdown에는 본문의 구조와 그래프·사진·양식의 이미지 참조를 남기고, 이미지는 별도 폴더에 보관한다.

## 전달할 세 가지 차이

1. 고정 지면 PDF가 작아서 읽기 불편하다면 EPUB으로 재구성한다. 리플로우와 뷰어의 글자 크기·줄 간격 설정으로 읽는 환경을 조절한다. '파일 사이즈'는 용량 압축이 아닌 읽기 크기/배치로 표현한다. 잘 읽히는 PDF까지 반드시 변환해야 한다고 주장하지 않는다.
2. 로컬 모델 OCR로 제목·문단·표와 그래프·사진·양식의 관계를 정리한다. 문서 구조 보존은 읽기 순서·본문·시각 자료의 관계이며 Markdown이 PDF의 픽셀 단위 지면 복제라는 뜻은 아니다. 모든 원본에서 완벽하다는 무검증 보장은 금지한다.
3. Markdown의 상대 경로와 실제 이미지 파일을 함께 보관한다. AI 도구가 관련 글과 이미지를 함께 활용하려면 이미지 파일에 접근하고 이미지를 이해할 수 있어야 한다. MD만 보내면 이미지도 자동 전달된다는 표현은 금지한다.

## 구현 반영

- 히어로: PDF → 로컬 OCR → EPUB / Markdown + images 개념도.
- `ReadingExperience.tsx`: EPUB 16–28px 글자 크기 조절과 실제 줄바꿈, MD 이미지 참조 ↔ 이미지 폴더/미리보기 선택 연동. 그래프·사진 영역·양식의 3개 설명 SVG는 `public/media/pdf-explainer/`.
- ScrollStory·Stepper·활용 카드·metadata·FAQ·지원 안내를 동일한 제품 서사로 수정.
- 기존 Markdown 본문 복사/다운로드는 보존. 이 다운로드에는 본문만 포함하며 실제 EPUB·이미지 패키지 다운로드는 제공하지 않는다.
- 제품명/URL은 사용자의 별도 변경 요청이 없어 PDF to MD / `/pdf-to-md` 유지.
- 실제 파일 업로드, 로컬 OCR 엔진 실행, 실제 EPUB 파일 생성은 이번 웹사이트 작업 범위가 아니다.

## Higgsfield 제작 상태

홈페이지 변환 파이프라인 애니메이션의 역할과 영상 프롬프트는 [pdf-pipeline-animation-higgsfield.md](pdf-pipeline-animation-higgsfield.md)에 별도로 기록한다. 아래 상태는 기존 제품 개념 이미지 생성 작업에 대한 기록이다.

`higgsfield-generate` 스킬로 계정·전체 모델 목록·GPT Image 2 입력을 확인하고 16:9/2k 설명 이미지 1건을 요청했다. 서비스가 `not_enough_credits`를 반환하여 **생성되지 않았다**. 생성 결과 URL/이미지/영상은 없고 웹사이트에 Higgsfield 생성물로 표시한 자산도 없다. 사용자에게 충전 또는 사용 가능한 계정 전환을 요청했다. 자동 구매나 임의 계정 전환은 하지 않았다.

크레딧 확보 후 아래 프롬프트로 생성하고 시각 검수·최적화한 뒤 개념도와 함께 연결한다. 기존 사용자 PDF/앱 화면을 외부로 업로드하지 않았다.

### 준비한 이미지 프롬프트 (GPT Image 2, 16:9, 2k)

Premium editorial 3D technical illustration, landscape 16:9, near-black #07080a background. A dense paper PDF document on the left flows through a compact local processing chip in the center, branching into TWO equally prominent outcomes on the right: an elegant e-reader with large comfortable reflowed text, and an organized Markdown document beside a separate image folder. The SAME emerald chart and small landscape photograph recur in the source page and the extracted image thumbnails, visibly linked to matching paragraphs by thin silver connector lines. Restrained brushed graphite materials, crisp hairline edges, soft studio lighting, tiny emerald and pale blue category accents. Calm, precise, spacious, premium developer-tool aesthetic. Only minimal labels PDF, OCR, EPUB, MD, images. No logos, no people, no decorative gibberish. Conceptual explanatory artwork, not an application screenshot.

생성물에는 'Higgsfield로 제작한 제품 개념 이미지 · 실제 변환 화면 아님'을 표시한다. 사용자 요청은 이미지 또는 영상이므로 우선 이 이미지로 설명을 보강하며, 영상은 생성하지 않았다.
