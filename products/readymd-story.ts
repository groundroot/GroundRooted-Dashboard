// One authored document throughout the website. Not an actual ReadyMD output.
export const readingStory = {
  title: "기록을 넘어, 다음 생각으로.",
  subtitle: "자료를 다시 활용하는 작은 습관",
  intro: "좋은 자료는 한 번 읽고 끝나지 않습니다. 필요한 문장을 찾고, 나의 언어로 정리하고, 다음 질문의 출발점으로 삼습니다.",
  heading: "읽은 내용을 내 생각으로 잇는 법",
  paragraphs: [
    "마음에 남는 문장을 만났다면, 왜 눈길이 갔는지 짧게 적어 보세요. 문장을 그대로 옮기는 것에 나의 질문 하나를 더하면, 다시 읽을 이유가 생깁니다.",
    "메모가 쌓이면 서로 닮은 생각을 모아 봅니다. 책에서 읽은 내용과 오늘의 경험이 만나는 지점에서 다음 글이나 수업의 실마리를 찾을 수 있습니다.",
  ],
  caption: "그림 1. 읽기에서 다음 생각으로 이어지는 과정",
  image: "/media/readymd/reading-map.svg",
  imageFile: "reading-map.svg",
  filename: "reading-note.md",
} as const;
export const readingMarkdown = `# ${readingStory.title}\n\n${readingStory.intro}\n\n## ${readingStory.heading}\n\n${readingStory.paragraphs.join("\n\n")}\n\n![${readingStory.caption}](images/${readingStory.imageFile})\n\n*ReadyMD 사용 방식을 설명하기 위해 만든 예시입니다. 실제 앱 변환 결과가 아닙니다.*\n`;
