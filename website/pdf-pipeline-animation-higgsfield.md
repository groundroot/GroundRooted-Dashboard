# PDF to MD 홈페이지 변환 파이프라인 애니메이션

작성일: 2026-09-20

## 목적

홈페이지 중간 영역에서 다음의 실제 변환 흐름을 짧고 명확하게 보여 준다.

`PDF 스캔 → OCR → EPUB 재조립 → Markdown 재구성`

애니메이션은 실제 앱 화면이나 변환 엔진을 대체하지 않는다. 실제 OCR, EPUB 패키징, Markdown 생성은 제품 파이프라인이 담당하고, 영상은 처리 순서를 이해시키는 시각 설명으로 사용한다.

## 힉스필드의 역할

- **Seedance 2.0 image-to-video**: 기준 이미지나 스토리보드 프레임에 종이, 문자, 책, 문서 카드의 변환 모션과 카메라 이동을 준다.
- **멀티모달 레퍼런스**: PDF 스캔 이미지, OCR 문자 레이어, EPUB 책 구조, Markdown 문서 카드를 레퍼런스로 사용해 시각 언어를 유지한다.
- **장면 전환**: overhead 스캔, 문자 정렬, 책장 조립, 문서 카드 재배열을 단계별 동작으로 표현한다.
- **Draw To Video**: 생성 후 특정 프레임의 모션이나 오브젝트를 보정할 때만 사용한다. 첫 버전의 필수 도구는 아니다.

힉스필드가 수행하지 않는 작업은 실제 스캔 PDF OCR, EPUB 재조립, Markdown 생성, 변환 정확성 검증이다. 이 작업들은 제품의 실제 파이프라인에서 처리한다.

## 홈페이지 산출물 기준

- 비율 `16:9`, 길이 8~10초, 무음, 무한 반복
- 미색 종이, 짙은 네이비 문자, 청록색 OCR 신호, 보라색 EPUB 구조, 검은 Markdown 카드
- 모바일은 정지 이미지 또는 CSS 모션으로 대체
- 긴 문장과 단계명은 생성 영상에 넣지 않고 HTML 오버레이로 표시

## 기준 이미지용 프롬프트

```text
Wide 16:9 editorial technology illustration for a Korean document conversion service, a clean uninhabited desk with four connected stages arranged left to right: a scanned book page, a precise OCR text layer made of aligned glyph blocks, a reassembled EPUB book with chapters and a cover, and a structured Markdown document card. Warm ivory paper, deep navy ink, cyan scanning light, restrained violet EPUB accents, black document cards, soft studio lighting, minimal premium SaaS visual language, generous negative space in the center for webpage labels, crisp edges, calm and trustworthy, no people, no logos, no readable long text.
```

## Seedance 2.0 image-to-video 프롬프트

```text
One continuous 9-second 16:9 editorial motion graphic, calm premium document-processing explainer, no people. 0–2s: a cyan scan line passes over the scanned PDF pages and lifts a clean text layer from the paper. 2–4s: the extracted glyph blocks align into neat paragraphs and a subtle confidence glow travels across them. 4–6.5s: the paragraphs fold into a compact EPUB book, chapter tabs and a table-of-contents spine assemble with precise mechanical motion. 6.5–9s: the book opens into a structured Markdown document card, lines and headings settle into a clean grid, then the four stages hold in a balanced loop-ready composition. Slow overhead camera push, smooth lateral parallax, crisp paper physics, restrained cyan and violet light, ivory background, deep navy typography shapes, polished product explainer aesthetic, sharp edges, stable composition, no spoken audio.
```

## 생성 후 편집 지시

```text
Keep the four-stage left-to-right layout stable. Preserve the scanned page, OCR layer, EPUB book, and Markdown card as distinct objects. Motion should communicate transformation and ordering, not a fictional app interface. Use abstract glyph blocks instead of long readable sentences. Leave clean negative space above each stage for HTML labels added in post-production.
```

## 확인 기록

- Higgsfield 공식 Seedance 안내를 확인했다. 이미지·영상·오디오 레퍼런스와 프롬프트를 함께 사용하는 image-to-video 흐름이 이 작업에 적합하다.
- 짧은 클립을 먼저 검증한 뒤 최종 해상도로 높이는 방식으로 진행한다.
- 이번 단계에서는 생성하지 않고 역할과 프롬프트만 기록했다.

참고:

- [Higgsfield Seedance 2.0](https://higgsfield.ai/seedance/2.0)
- [Higgsfield Seedance 사용 안내](https://higgsfield.ai/creator-hub/help-center/ai-models/how-do-i-use-seedance)
- [Seedance 2.0 프롬프트 가이드](https://higgsfield.ai/blog/seedance-prompting-guide)
