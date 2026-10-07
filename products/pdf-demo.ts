// Authored website fixtures, NOT an actual app conversion or performance claim.
export const pdfSamples = [
  {
    id: "research", label: "리서치 노트", filename: "research-note.md", category: "RESEARCH NOTE", number: "01",
    title: "기록을 넘어,\n다음 생각으로.", subtitle: "자료를 다시 활용하는 작은 습관", date: "2026. 09",
    intro: "좋은 자료는 한 번 읽고 끝나지 않습니다. 필요한 문장을 찾고, 나의 언어로 정리하고, 다음 질문의 출발점으로 삼습니다.",
    heading: "자료를 내 것으로 만드는 세 가지 방법",
    points: ["핵심 내용을 읽고 필요한 부분을 고릅니다.", "주제별로 연결하고 나만의 메모를 더합니다.", "다음 작업에서 다시 꺼내 쓸 수 있게 보관합니다."],
    quote: "자료를 쌓는 일에서, 생각을 이어가는 일로.",
  },
  {
    id: "meeting", label: "회의 기록", filename: "meeting-note.md", category: "MEETING NOTE", number: "02",
    title: "함께 나눈 생각,\n분명한 다음 행동.", subtitle: "작은 팀의 프로젝트 회의", date: "2026. 09",
    intro: "오늘 나눈 이야기를 다음 작업으로 연결합니다. 논의한 내용과 결정한 사항을 구분하면 각자의 다음 행동이 또렷해집니다.",
    heading: "다음 회의까지 준비할 것",
    points: ["프로젝트의 목적과 대상을 한 문장으로 정리합니다.", "검토할 자료를 모으고 출처를 함께 기록합니다.", "결정이 필요한 항목과 진행 상황을 공유합니다."],
    quote: "좋은 기록은 다음 행동을 쉽게 만듭니다.",
  },
] as const;
export type PdfSample = (typeof pdfSamples)[number];
export function sampleMarkdown(sample: PdfSample) {
  return "# " + sample.title.replace("\n", " ") + "\n\n" + sample.intro + "\n\n## " + sample.heading + "\n\n" + sample.points.map(p => "- " + p).join("\n") + "\n\n> " + sample.quote + "\n";
}
export const demoProvenance = { kind: "authored-explainer", actualAppOutput: false, appVersion: null, created: "2026-09-20", source: "GroundRooted website preview fixture" } as const;
