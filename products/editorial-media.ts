// Versioned, public-only generated artwork. Prompts and provenance are documented
// in website/interactive-art-direction-20261004.md. Never add private uploads here.
export const editorialImages = {
  reading: { stem: 'reading', alt: '열린 책에서 페이지가 펼쳐져 푸른 자료 폴더로 이어지는 종이 조형' },
  transcript: { stem: 'transcript', alt: '영상의 재생 기호에서 종이 리본이 펼쳐져 기록으로 이어지는 조형' },
  editing: { stem: 'editing', alt: '문장을 표현한 말풍선과 보라색 편집 구간이 이어진 종이 타임라인' },
  origin: { stem: 'origin', alt: '펼쳐진 노트에서 연녹색 종이 잎이 자라는 조형' },
} as const;
export type EditorialImageName = keyof typeof editorialImages;
export const editorialBase = '/media/editorial-v1';
export const editorialPublicPaths = Object.values(editorialImages).flatMap(({ stem }) =>
  [640, 1440].map(width => `${editorialBase}/${stem}-${width}.webp`),
);
export const paperMotionPath = `${editorialBase}/paper-motion.mp4`;
