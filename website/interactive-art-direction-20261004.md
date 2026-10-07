# 섹션별 생성 이미지와 인터랙션 — 2026-10-04

## 구현

요청: GPT Image와 Higgsfield를 사용해 각 섹션에 맞는 인터랙티브 사이트를 구성한다.

| 위치 | 이미지·영상 | 조작 |
|---|---|---|
| 메인 첫 화면 | 문서·영상 기록·편집의 종이 조형 | 읽기/기록/편집 탭, 방향키·Home·End, 문서 장면 재생·정지 |
| 제품 소개 3곳 | 청색 책과 자료, 베이지 영상과 기록, 보라색 타임라인 | 모은 자료/다음 쓰임 선택 |
| 제품 선택 가이드 | 선택한 작업에 해당하는 조형 | 작업 선택 → 자료·결과·제품 링크 변경 |
| 만드는 이야기 | 노트에서 자라는 연녹색 종이 잎 | ReadyMD 제작 이야기 연결 |
| YouTube to MD | 영상에서 기록으로 이어지는 종이 리본 | 자료/쓰임 선택 + 기존 자막/Markdown 체험 유지 |
| ReadyMD 서재 | Higgsfield 종이 페이지 영상 | 영상 재생·정지, 읽기/재활용 선택 |
| ReadyMD 제작 이야기 | 노트와 종이 잎 | 기존 Nexus 경험·제작 배경 설명 유지 |
| 모든 공개 페이지 | 상단 읽기 진행 표시 | 스크롤 위치에 따라 갱신 |

FAQ와 비용 계산은 텍스트·기존 조작이 중심이다. TypeCut Pro는 기존 공식 외부 사이트 링크를 유지한다. 실제 제품 화면·OCR 결과·사용자 실적을 생성 이미지로 꾸미지 않는다. 페이지에 콘셉트 이미지임을 표시한다.

`imagegen`, `higgsfield-generate` 스킬을 적용했다. 기존 그림자/hover/장식 외곽선 금지는 유지하며, 키보드 포커스·선택 상태는 명확하게 제공한다. 새로운 런타임 패키지를 추가하지 않았다. 일반 UI에 TypeSafe API를 추가하지 않았다.

## 자산과 생성 이력

- GPT Image: 내장 이미지 생성 도구로 이미지 4장 실제 생성. 도구가 세부 모델 버전을 반환하지 않아 GPT Image 2 등 특정 버전으로 표기하지 않는다.
- Higgsfield: Seedance 2.0, text-to-video, 16:9, 1080p, 5초 생성 완료. GPT 이미지를 참조로 올리는 첫 시도는 업로드 서명 오류로 생성 전에 실패했다. 같은 아트 디렉션의 텍스트 프롬프트로 영상 생성에 성공했다. GPT 원본 이미지에서 직접 애니메이션한 결과라고 주장하지 않는다.
- [Higgsfield 원본 영상](https://d8j0ntlcm91z4.cloudfront.net/user_30cEsOuwnLKi8Qw0rgXXwMFLnDb/hf_20261004_060618_70d201ff-b775-415a-b105-3822f5e9dcf4.mp4)
- 웹용 영상: H.264, 1280×720, 5.041667초, 202,782바이트. 오디오 트랙 제거, faststart 적용. 생성 영상에 별도 음성·자막 의미가 없다.
- 영상은 `preload="none"`으로 제공하고, 재생 전에는 `src`도 지정하지 않는다. 초기 자동 재생이 없으며, 화면 밖·백그라운드·모션 감소 설정 변경 시 정지한다. 다시 화면에 들어와도 자동 재개하지 않는다. 오류 시 이미지와 다시 재생 버튼을 제공한다.
- GPT 이미지 원본은 생성 도구 저장소에 보존한다. 아래 파일은 원본 내용을 바꾸지 않고 Sharp로 WebP 인코딩·크기 조절한 웹용 복사본이다.

| 파일 이름 (`public/media/editorial-v1/`) | 640px | 1440px |
|---|---:|---:|
| reading-{width}.webp | 10,186 B | 50,028 B |
| transcript-{width}.webp | 7,912 B | 44,600 B |
| editing-{width}.webp | 6,892 B | 31,312 B |
| origin-{width}.webp | 8,504 B | 37,076 B |

전체 이미지 파일 196,510바이트. `srcset`으로 화면에 맞는 파일을 선택하며 하단은 지연 로딩한다. 폭·높이를 명시해 이미지 로딩으로 인한 밀림을 줄인다. 새 공개 경로는 `products/editorial-media.ts` 목록의 정확한 파일 9개만 `proxy.ts`에서 허용한다. 폴더 전체를 공개하지 않는다.

## 최종 프롬프트

### GPT Image — reading (generate, 불투명 배경)

> Create a premium editorial illustration for a Korean creative-software website, wide 3:2 landscape composition, no text whatsoever. A sculptural open book made from matte ivory paper, its pages unfold gently into three large floating paper sheets and one simple pale-blue archival folder. A tiny cobalt-blue rectangular bookmark gives focus. Objects occupy central 75%, generous airy negative space, seamless very pale ice-blue background #EDF3FC, diffused even studio lighting, no visible cast shadows, no shiny plastic, no outlines, no gradients on the background. Tactile fine paper grain, sophisticated restrained art direction, photographed paper sculpture, orthographic three-quarter view, calm and precise. It represents turning saved documents into readable knowledge. This is a conceptual still life, not an app screenshot, no UI, no devices, no logos, no watermark. High quality sharp detail.

### GPT Image — transcript (generate, 불투명 배경)

> Premium conceptual editorial illustration for a creative software website. Wide 3:2 composition. Matte ivory paper sculpture: on the left a standing landscape rectangle with a small terracotta triangular play symbol cut from colored paper centered on it. A continuous ivory paper ribbon unfurls from that rectangle, arcs gently through the center, and becomes three neatly layered paper manuscript sheets on the right, with delicate embossed short lines suggesting paragraphs, absolutely no readable text. Tiny ochre page marker. Central floating composition entirely in view with generous margin. Seamless warm very pale sand #F6F0E7 background, no gradients, soft even diffuse studio light, no visible cast shadows, fine tactile paper fibers, sophisticated photographic still life, restrained and minimal. Represents a video's words becoming a personal written record. No devices, no screens, no UI, no logos, no watermarks, no people, no decorative borders. High fidelity, sharp details.

### GPT Image — editing (generate, 불투명 배경)

> Premium editorial paper-sculpture still life, wide 3:2 landscape, for a software website about shaping spoken stories through editing. One sculptural continuous ivory paper strip snakes horizontally across the scene in a beautifully balanced loose S curve, with 7 short lavender rectangular segments neatly lined up along its length like an abstract editing timeline. Above this strip float three individual small ivory speech-shaped paper blocks with subtly embossed short dashes, no legible text, and a single deep-violet rectangular marker. Tactile matte paper and fine paper fiber texture. Palette ivory, soft lavender, one deep violet accent. Seamless very pale lavender #F0EDFA background, even diffuse high key lighting with no visible cast shadows. Objects centered in middle 75 percent with generous margins, orthographic slightly elevated perspective, restrained expensive editorial art direction. No scissors, no people, no letters, no words, no logos, no UI, no computer or device, no watermark, no decorative borders. Harmonize with a series showing paper books and paper video symbols.

### GPT Image — origin (generate, 불투명 배경)

> Premium editorial paper-sculpture illustration, 3:2 horizontal. An abstract botanical sprout made entirely from folded ivory paper grows from the central crease of an open small paper notebook. Three delicate pale sage leaves branch out, accompanied by a single cobalt blue small page marker. The composition conveys ideas taking root through everyday reading and making. All elements sculpted from matte textured paper, fine tactile grain, restrained sophisticated photographic art direction. Seamless very pale sage background #EEF3EF, bright even diffuse lighting, no visible cast shadows, no background gradients. Main sculpture center, full object visible with generous margin. No letters, no readable text, no humans, no logo, no UI, no devices, no watermark, no frame. Calm and optimistic. Harmonize with paper-sculpture series about books, video transcripts, and editing timelines.

### Higgsfield — Seedance 2.0 (text-to-video, 1080p, 16:9, duration=5)

> Five-second seamless abstract editorial motion study. A sculptural open ivory paper book floats at lower left, three matte ivory pages arc gently toward a pale blue archival folder at upper right. Seamless very pale ice-blue background, fixed orthographic three-quarter camera, fine tactile paper fibers and diffuse even light without cast shadows. The floating pages gently turn a few degrees in a slow breeze, then settle. Book and folder stay still. Elegant minimal high-key composition with generous negative space. No text, no UI, no people, no logo, no music, no speech, no camera movement, no cuts, no added objects. End matching first frame.

프롬프트의 루프 요구는 제작 의도다. 생성 결과가 첫 프레임과 픽셀 단위로 일치함을 보장하지 않는다.

## 검증

검증 결과는 작업 완료 시 아래에 기록한다. 로컬 검증이며 운영 배포·결제 연동을 의미하지 않는다.

- Node 24.21.0 webpack 프로덕션 빌드와 TypeScript 검사 통과.
- 인증 경계 검사 통과: 새 이미지 8개·영상 1개 HTTP 200/올바른 MIME, 비공개 경로·허용 목록 밖 미디어 차단, HQ 보호와 preview gate 유지.
- 기존 계산 검사 2종 통과.
- `scripts/verify-public-ui.mjs`: 공개 3페이지 × 320/390/768/1024/1440px 가로 넘침 없음, 390/1440px axe 위반 0, 기존 메뉴·자막 탭·복사 성공/실패·FAQ·EPUB 28px·이미지·모션 감소 포함 **32개 통과**.
- `scripts/verify-editorial-ui.mjs 3`: 초기 영상 다운로드 없음, 실제 재생·정지, 화면 밖 정지, 스크롤 진행, 탭 키보드·맞춤 가이드, 영상 오류/재시도, 모바일 각 장면, 스크롤 후 이미지 로딩, 모션 감소와 ReadyMD 영상 포함 **23개 통과**.
- 자동화의 일반 클릭은 Ego 포인터 표시 과정에서 탭 visibility를 잠시 바꿔 영상의 백그라운드 정지를 먼저 일으켰다. 영상 버튼 검증은 같은 브라우저/탭에서 DOM으로 확인한 좌표에 CDP의 신뢰된 마우스 이벤트를 보내 수행했다. 제품의 백그라운드 정지 기능을 제거하거나 우회하지 않았다.
- 영상 HTTP Range 요청: 206, 1,024바이트 응답 확인. ffprobe로 1280×720 H.264와 오디오 트랙 부재 확인. 생성 이미지 전체와 영상 시작/중간 프레임, 데스크톱/모바일 실제 페이지 캡처를 시각 검수했다.
- 결과: `output/playwright/enterprise-upgrade/ui-audit.json`, `output/playwright/editorial-upgrade/results.json`과 같은 폴더의 PNG. 출력 폴더는 Git 제외 상태다.
- 미리보기: `http://127.0.0.1:3045`. `scripts/preview-local.mjs --refresh`가 새 복사본을 빌드한 뒤 이 작업의 launchd 서버를 교체한다. launchd의 비동기 등록 해제를 고려해 재등록을 재시도하며, 시작 실패 시 이전 설정 복구를 시도한다. 기존 작업 트리 `.next`·다른 서비스·환경 파일은 건드리지 않는다.
- 실제 운영 배포, 네이버페이 판매자 가입·결제 구현, 실제 OCR 결과 검증은 이 시각·인터랙션 변경에 포함되지 않는다.
