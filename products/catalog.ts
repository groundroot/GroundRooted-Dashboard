// Public catalogue order confirmed by the user on 2026-09-29.
// Project identifiers are internal provenance; sales terms remain separate.
export const appCatalog = [
  {
    id: 'readymd', order: '01', name: 'ReadyMD', subtitle: '레디엠디', href: '/pdf-to-md',
    project: 'nexus/Doc-to-Md-ePub-converter',
    category: 'PDF를 내 지식으로',
    headline: '모아 둔 PDF를,\n읽고 다시 쓰는 자료로.',
    description: '읽기 좋은 EPUB과 AI에 활용할 Markdown·이미지로. 내 서재를 만드는 첫 준비를 맡습니다.',
    input: 'PDF', output: 'EPUB · Markdown · 이미지',
  },
  {
    id: 'youtube-to-md', order: '02', name: 'YouTube to MD', subtitle: '', href: '/youtube-to-md',
    project: 'YouTube-Script-MD',
    category: '영상에서 글로',
    headline: '다시 찾고 싶은 영상,\n읽을 수 있는 기록으로.',
    description: '채널과 영상의 자막을 Markdown으로 모으세요. 원문을 보관하고 내 메모와 함께 다시 꺼내 봅니다.',
    input: 'YouTube 자막', output: '영상별 Markdown',
  },
  {
    id: 'typecut-pro', order: '03', name: 'TypeCut Pro', subtitle: '', href: 'https://groundroot.github.io/typecut-pro/',
    project: 'fcpcli',
    category: '대본으로 영상 편집',
    headline: '말을 읽으며,\n영상의 흐름을 다듬다.',
    description: 'Final Cut Pro 프로젝트를 대본으로 살펴보고, 필요한 구간과 자막을 편집하는 작업으로 이어갑니다.',
    input: 'Final Cut Pro 프로젝트', output: '대본 · 자막 · 편집',
  },
] as const;
