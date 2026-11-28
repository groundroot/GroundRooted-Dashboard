// The interview order and skill names follow the kit's videokit entry skill.
const questions = [
  {
    topic: "목적 · 시청자 · 게시처",
    title: "누구에게 어떤 영상으로 보여줄까요?",
    help: "영상의 목적을 정하면 핵심 장면을 고르는 기준이 생깁니다.",
    options: [
      { label: "유튜브 강연 하이라이트", detail: "강연을 놓친 사람에게 핵심 메시지를 전합니다.", skill: "강연 하이라이트", id: "talking-head-highlight" },
      { label: "인스타그램 릴스", detail: "처음 보는 사람에게 기억할 만한 한 가지를 전합니다.", skill: "쇼츠 만들기", id: "shorts" },
      { label: "내부 교육용 요약", detail: "팀원이 사례에서 배운 점을 회의 전에 훑어볼 수 있게 합니다.", skill: "강연 하이라이트", id: "talking-head-highlight" },
    ],
  },
  {
    topic: "길이 · 화면비 · 마감",
    title: "어떤 규격으로 언제까지 만들까요?",
    help: "같은 원본을 한 편으로 만들거나, 본편과 세로 요약을 함께 준비할 수 있습니다.",
    options: [
      { label: "60초 세로 한 편", detail: "9:16 · 오늘까지", length: "60초", ratio: "9:16", delivery: "오늘까지 · 1편" },
      { label: "3분 가로 한 편", detail: "16:9 · 내일까지", length: "3분", ratio: "16:9", delivery: "내일까지 · 1편" },
      { label: "3분 본편과 30초 세로 요약", detail: "16:9 + 9:16 · 이번 주까지", length: "본편 3분 + 요약 30초", ratio: "16:9 + 9:16", delivery: "이번 주까지 · 2편" },
    ],
  },
  {
    topic: "원본 · 인물 · 공개 동의",
    title: "강연자의 얼굴과 이름을 어떻게 쓸까요?",
    help: "가상 원본은 앞의 인터뷰 파일 하나입니다. 공개 동의에 맞춰 쓸 장면을 정합니다.",
    options: [
      { label: "얼굴과 이름 공개에 동의했어요", detail: "발표 핵심 사례를 넣고, 말실수와 중복 설명을 덜어 냅니다.", rule: "공개 동의 범위에서 얼굴과 이름을 사용합니다. 핵심 사례를 남기고 말실수와 중복 설명을 뺍니다." },
      { label: "얼굴만 공개하고 이름은 빼 주세요", detail: "핵심 답변은 쓰고 실명이 나오는 화면과 발언은 뺍니다.", rule: "동의를 받은 얼굴과 핵심 답변을 사용합니다. 실명이 나오는 화면과 발언은 제외합니다." },
      { label: "공개 동의는 아직 받지 않았어요", detail: "핵심 답변만 내부 검토용으로 준비하고 공개는 보류합니다.", rule: "핵심 답변만 담은 내부 검토본으로 준비합니다. 공개 동의를 받기 전에는 게시하지 않습니다." },
    ],
  },
  {
    topic: "스타일 · 자막",
    title: "어떤 분위기와 자막이 어울릴까요?",
    help: "편집 화면에서 고칠 타이틀 자막과 따로 전달할 SRT 자막 파일을 고를 수 있습니다.",
    options: [
      { label: "담백하게 · 한국어 타이틀", detail: "편집 앱에서 수정할 수 있는 자막으로 읽기 편하게 정리합니다.", rule: "강연자의 말투를 살리고 한국어 타이틀 자막을 사용합니다." },
      { label: "빠르게 · 한국어 타이틀과 SRT", detail: "짧게 끊어 편집하고, 수정용 자막과 업로드용 자막 파일을 함께 준비합니다.", rule: "핵심 문장 단위로 빠르게 편집하고 한국어 타이틀 자막과 SRT를 함께 준비합니다." },
      { label: "차분하게 · 한국어 SRT", detail: "발언의 호흡을 살리고 자막은 별도 파일로 전달합니다.", rule: "발언의 호흡을 살리고 한국어 자막은 SRT 파일로 전달합니다." },
    ],
  },
  {
    topic: "음악 · 효과음 · 내레이션",
    title: "소리는 어떻게 구성할까요?",
    help: "인터뷰 음성에 더할 소리를 골라 보세요. 비용과 필요한 도구는 예시 계획에서 확인할 수 있습니다.",
    options: [
      { label: "인터뷰 음성만", detail: "배경음악, 효과음, 별도 내레이션을 넣지 않습니다.", rule: "인터뷰 음성만 사용합니다." },
      { label: "보유한 곡과 짧은 효과음", detail: "말이 시작되면 음악을 낮추고, 장면이 바뀔 때만 효과음을 씁니다.", rule: "사용 권리가 있는 보유 곡과 짧은 전환 효과음을 씁니다. 발언이 나올 때는 음악 볼륨을 낮춥니다." },
      { label: "직접 녹음한 내레이션", detail: "짧은 내레이션으로 앞뒤를 연결하고 인터뷰는 원래 목소리를 씁니다.", rule: "직접 녹음한 내레이션으로 앞뒤를 연결하고, 인터뷰 답변에는 원래 목소리를 씁니다." },
      {
        label: "내 목소리로 내레이션 만들기",
        detail: "Claude가 대본을 쓰면 맥의 VoiceStudio에서 본인 목소리로 생성해 편집에 사용합니다.",
        tags: [["local", "로컬 음성 모델"], ["note", "맥 전용"]],
        skills: ["원고 내레이션 (script-narration)", "음성 만들기 (voicestudio)"],
        rule: "내레이션 대본은 Claude가 쓰고, 사용 권한이 있는 본인 목소리로 컴퓨터에서 생성합니다. 인터뷰 답변에는 원래 목소리를 씁니다.",
        flow: [
          ["내레이션 대본", "인터뷰 앞뒤를 잇는 문장을 Claude가 씁니다. 자막 두 줄 안에 들어가게 끊습니다.", ["claude"]],
          ["목소리 준비", "맥에 무료 VoiceStudio 앱을 따로 설치합니다. 음성 모델을 내려받고 이용 조건을 확인한 뒤 본인이 녹음한 샘플로 목소리를 등록합니다.", ["local"]],
          ["음성 생성", "VoiceStudio가 문장마다 음성 파일을 만들고 대사와 같은 음량으로 맞춥니다. 첫 몇 줄을 들어 보고 전체를 만듭니다.", ["local"]],
          ["타임라인 배치", "만든 음성 파일을 대사 트랙에 놓습니다. 키트의 자동 배치는 맥의 파이널컷 프로 기준이며, 베타 편집 앱에서는 WAV를 가져와 배치를 확인합니다.", ["local"]],
        ],
        flowNote: "사용 권한이 있는 본인 녹음만 사용합니다. 컴퓨터가 음성을 생성하는 단계에 별도 API 요금이 없으며 Claude 사용량은 대본 작성에 적용됩니다.",
      },
      {
        label: "컴퓨터에서 배경 음원 만들기",
        musicExample: true,
        detail: "장면에 맞는 곡을 컴퓨터에서 만드는 예시입니다. 키트에서는 보유 음원이나 별도 음악 서비스를 쓸 수 있습니다.",
        tags: [["note", "예시 · 키트 미포함"]],
        flow: [
          ["음악 브리프", "장마다 길이, 분위기, 템포, 악기를 Claude가 정리해 먼저 보여 드립니다.", ["claude"]],
        ],
      },
    ],
  },
  {
    topic: "유료 생성 · 다운로드",
    title: "유료 소스의 사용 범위는 어디까지인가요?",
    help: "실제 작업에서 결제나 생성이 필요한 경우의 기준입니다.",
    options: [
      { label: "추가 비용 없이", detail: "제공한 원본과 이용 권한이 있는 보유 소스만 씁니다.", rule: "새 유료 소스의 생성과 다운로드 없이 작업합니다." },
      { label: "보유한 구독 범위에서", detail: "이미 쓰는 구독에서 사용 조건이 맞는 소스만 후보로 검토합니다.", rule: "보유한 구독 범위에서 사용 조건이 맞는 소스만 검토합니다. 추가 결제는 하지 않습니다.", musicService: "이미 쓰는 Suno 구독에서 사용권과 남은 크레딧을 확인합니다. 범위 안에서 쓸 수 없으면 보유 음원을 사용합니다." },
      { label: "비용이 들면 먼저 확인", detail: "새 생성이나 다운로드가 필요하면 비용을 확인한 뒤 진행 여부를 정합니다.", rule: "유료 생성이나 다운로드 전에 비용을 안내하고 승인을 받습니다.", musicService: "비용과 사용권을 확인하고 승인받은 뒤 Suno에서 곡을 만듭니다." },
    ],
  },
  {
    topic: "결과를 열 편집 프로그램",
    title: "어떤 편집 프로그램에서 결과를 열까요?",
    help: "선택한 프로그램에 맞춰 키트가 넘기는 파일과 확인 절차가 달라집니다.",
    options: [
      { label: "파이널컷 프로(정식)", detail: "맥에서 편집 타임라인을 가져와 확인합니다.", output: "파이널컷 프로용 타임라인(FCPXML)을 만들어 맥의 파이널컷 프로에서 엽니다.", handoff: "만든 타임라인을 파이널컷 프로로 가져와 컷과 자막을 사람이 검수합니다." },
      { label: "캡컷(베타)", detail: "캡컷용 초안 프로젝트로 넘깁니다.", output: "캡컷용 초안 프로젝트를 만듭니다.", handoff: "캡컷에서 초안을 열어 컷과 자막을 사람이 검수합니다." },
      { label: "다빈치 리졸브(베타)", detail: "연동이 되는 환경에서 새 프로젝트와 타임라인을 만듭니다.", output: "연동이 되는 환경에서 다빈치 리졸브용 타임라인을 만들고, 선택에 따라 타이틀 자막이나 SRT를 준비합니다.", handoff: "다빈치 리졸브에서 컷과 자막을 검수합니다. 설치된 환경에서 베타 연동이 제한되면 SRT와 편집 데이터를 참고해 작업을 이어갑니다." },
      { label: "프리미어 프로(베타)", detail: "키트 패널에서 편집 시퀀스를 만듭니다.", output: "프리미어의 키트 패널에 넘길 작업 파일을 준비합니다.", handoff: "키트 패널에서 시퀀스를 만들고 컷과 자막을 사람이 검수합니다. 패널이 없으면 cuts.json과 SRT만 받을 수 있습니다." },
    ],
  },
  {
    topic: "사용할 스킬",
    title: "편집에 어떤 스킬을 더할까요?",
    help: "선택한 영상에 맞는 편집 스킬과 자막 스킬에 더할 조합을 고릅니다.",
    options: [
      { label: "컷 편집과 자막만", detail: "인터뷰에서 핵심을 고르고 선택한 자막을 만듭니다.", skills: [] },
      { label: "제목에 지정 글꼴 적용", detail: "영상 첫머리에 정해 둔 글꼴로 제목을 넣습니다.", skills: ["폰트 적용 (font-apply)"] },
      { label: "첫 장면에 제목 넣기", detail: "영상 첫머리에 내용을 소개하는 모션 타이틀을 더합니다.", skills: ["모션 그래픽 (motion-design)"] },
      {
        label: "레퍼런스 영상의 편집 스타일 참고",
        detail: "공개 유튜브 레퍼런스의 도입 · 리듬 · 구성을 분석해 이 프로젝트에 맞는 새 기획과 편집 스타일을 만듭니다.",
        skills: ["인기 영상 분석 (viral-video-research)"],
        rule: "레퍼런스는 도입 · 리듬 · 구성 패턴만 분석합니다. 다른 사람의 영상, 대사, 음성, 채널 이름은 편집과 결과물에 쓰지 않습니다.",
        flow: [
          ["레퍼런스 분석", "고른 공개 영상에서 도입 길이, 컷 리듬, 자막 · 효과음 쓰임, 장 구성을 패턴으로 정리합니다.", ["claude"]],
          ["새 스타일 만들기", "정리한 패턴을 이 인터뷰에 맞게 바꿔 스타일 프리셋과 콘티 체크리스트로 만듭니다.", ["claude"]],
          ["콘티에 적용", "새 스타일의 도입과 리듬으로 콘티를 짜고, 계획을 확인받은 뒤 빌드합니다.", ["claude"]],
        ],
        flowNote: "키트의 viral-video-research 스킬 흐름을 줄인 예시입니다. 레퍼런스 영상은 분석용으로만 봅니다.",
      },
    ],
  },
];

const interview = document.querySelector("#interview");
const result = document.querySelector("#result");
const form = document.querySelector("#question-form");
const heading = document.querySelector("#question");
const options = document.querySelector("#options");
const optionTemplate = document.querySelector("#option-template");
const progress = document.querySelector("#progress");
const previous = document.querySelector("#previous");
const next = document.querySelector("#next");

let index = 0;
const answers = [];

function renderQuestion(moveFocus = true) {
  const question = questions[index];
  document.querySelector("#topic").textContent = question.topic;
  document.querySelector("#step-count").textContent = `${index + 1} / ${questions.length}`;
  progress.max = questions.length;
  progress.value = index + 1;
  heading.textContent = question.title;
  document.querySelector("#question-help").textContent = question.help;

  options.replaceChildren(...question.options.map((option, value) => {
    const row = optionTemplate.content.cloneNode(true);
    const input = row.querySelector("input");
    input.value = value;
    input.checked = answers[index] === value;
    row.querySelector("strong").textContent = option.label;
    row.querySelector(".option-copy > span").textContent = option.detail;
    if (option.tags) {
      const tags = element("span", "", "option-tags");
      tags.append(...option.tags.map(([kind, text]) => element("span", text, `cost ${kind}`)));
      row.querySelector(".option-copy").append(tags);
    }
    return row;
  }));

  previous.hidden = index === 0;
  next.disabled = answers[index] === undefined;
  next.textContent = index === questions.length - 1 ? "편집 계획 보기" : "다음";
  if (moveFocus) heading.focus();
}

function element(tag, content, className) {
  const node = document.createElement(tag);
  node.textContent = content;
  if (className) node.className = className;
  return node;
}

const costLabels = {
  local: "컴퓨터가 처리(무료)",
  claude: "Claude가 판단(사용량)",
  service: "별도 서비스(추가 비용)",
};

function stepRow([title, detail, costs, attach], i) {
  const row = element("li", "", "build-step");
  const number = element("span", String(i + 1).padStart(2, "0"), "step-number");
  number.setAttribute("aria-hidden", "true");
  const copy = element("div", "", "step-copy");
  copy.append(element("h3", title), element("p", detail));
  if (attach) {
    const extra = element("p", "", "step-attach");
    extra.append(element("strong", "붙는 작업 "), attach);
    copy.append(extra);
  }
  row.append(number, copy);
  if (costs.length) {
    const costList = element("div", "", "step-cost");
    costList.append(...costs.map(cost => element("span", costLabels[cost], `cost ${cost}`)));
    row.append(costList);
  }
  return row;
}

function renderBuild(editor) {
  const steps = [
    ["원본 읽기", "촬영본이 있는 폴더에서 미디어를 읽습니다. 원본 파일은 제자리에 둡니다.", ["local"]],
    ["촬영본 목록", "파일별 길이, 해상도, 프레임레이트 등을 읽어 목록을 만듭니다.", ["local"]],
    ["장면 분석", "컴퓨터가 대표 프레임을 뽑아 한 장에 모으면 Claude가 내용을 살펴봅니다.", ["local", "claude"]],
    ["음성 인식", "컴퓨터가 받아쓰고 단어별 시간을 맞춥니다. 받아쓰기에는 Claude 사용량이 들지 않습니다.", ["local"], "별도 마이크를 썼다면 싱크를 맞추고 대사에 EQ · 압축을 적용합니다."],
    ["콘티 · 장 파일", "인터뷰에서 고른 목적과 규칙을 바탕으로 쓸 발언과 편집 순서를 정합니다.", ["claude"], "모션 그래픽(제목 · 이름표)을 넣을 자리와 문구, 효과음을 넣을 전환점을 콘티에 적습니다."],
    ["편집 빌드", "콘티에 지정한 컷과 자막 위치를 프레임 단위로 계산합니다.", ["local"], "자막 줄 나눔과 표시 시간, 효과음 위치, 말이 나오는 구간을 계산합니다. 모션 그래픽은 따로 렌더해 영상 파일로 붙입니다."],
    ["cuts.json", "정리한 컷, 자막, 소리 정보를 공통 편집 데이터로 기록합니다.", ["local"], "내레이션 · 배경음악 · 효과음 파일과 트랙, 모션 그래픽 파일을 함께 적습니다."],
    ["타임라인 작성(지원 소프트웨어에 맞게)", editor.output, ["local"], "배경음악을 쓰면 지원되는 앱에서 말이 나오는 구간의 음악을 낮춥니다(덕킹)."],
    ["편집 소프트웨어", editor.handoff, [], "앱에서 자동으로 적용되지 않은 모션 그래픽이나 음량 조절은 여기서 확인하고 마무리합니다."],
  ];
  document.querySelector("#build-steps").replaceChildren(...steps.map(stepRow));
}

function renderPlan() {
  const [goal, format, consent, style, audio, paid, editor, extras] = questions.map(
    (question, i) => question.options[answers[i]],
  );

  document.querySelector("#plan-intro").textContent = `${goal.label} · ${goal.detail}`;
  const audioFlow = audio.musicExample ? {
    ...audio,
    rule: `컴퓨터에서 배경 음원을 만드는 방식은 예시입니다. 현재 키트에서는 ${paid.musicService ? "보유 음원 또는 예산 범위의 별도 서비스를 사용합니다." : "보유 음원을 사용합니다."}`,
    flow: [
      ...audio.flow,
      ["음원 준비", paid.musicService ?? "사용 권한이 있는 보유 음원을 고릅니다.", paid.musicService ? ["service"] : []],
      ["길이 · 음량 맞춤", "곡을 박자에 맞춰 장면 길이로 자르고 음량을 맞춥니다.", ["local"]],
      ["타임라인 배치", "배경음악 트랙에 놓고, 말할 때 음악이 낮아지도록 편집 앱에서 확인합니다.", []],
    ],
    flowNote: paid.musicService
      ? "Suno는 별도 서비스입니다. 키트의 suno-score 스킬을 쓰며 요금과 크레딧은 서비스 구독 조건을 따릅니다."
      : "보유 음원을 쓰면 별도 음악 서비스 요금이 들지 않습니다.",
  } : audio;
  const skills = [`${goal.skill} (${goal.id})`, "자막 (captions)", ...(audio.skills ?? []), ...extras.skills];
  const details = [
    ["길이", format.length],
    ["화면비", format.ratio],
    ["마감 · 버전", format.delivery],
    ["편집 프로그램", editor.label],
    ["소리", audio.label],
    ["쓸 스킬", skills],
  ];
  document.querySelector("#plan-details").replaceChildren(...details.map(([name, value]) => {
    const item = document.createElement("div");
    const dd = element("dd", Array.isArray(value) ? "" : value);
    if (Array.isArray(value)) {
      dd.className = "skill-list";
      dd.append(...value.map(skill => {
        const [, label, id] = skill.match(/^(.*) \((.*)\)$/);
        const line = element("span", label, "skill");
        line.append(" ", element("small", id));
        return line;
      }));
    }
    item.append(element("dt", name), dd);
    return item;
  }));
  document.querySelector("#plan-rules").replaceChildren(
    ...[consent.rule, style.rule, audioFlow.rule, paid.rule, extras.rule]
      .filter(Boolean)
      .map(rule => element("li", rule)),
  );

  const added = [audioFlow, extras].filter(option => option.flow);
  const extra = document.querySelector("#plan-extra");
  extra.hidden = added.length === 0;
  document.querySelector("#plan-extra-list").replaceChildren(...added.map(option => {
    const group = element("li", "", "extra-group");
    const steps = element("ol", "", "extra-steps");
    steps.append(...option.flow.map(stepRow));
    group.append(element("h4", option.label), steps, element("p", option.flowNote, "extra-note"));
    return group;
  }));
  renderBuild(editor);
  interview.hidden = true;
  result.hidden = false;
  document.querySelector("#plan-heading").focus();
}

form.addEventListener("change", event => {
  answers[index] = Number(event.target.value);
  next.disabled = false;
});

form.addEventListener("submit", event => {
  event.preventDefault();
  if (answers[index] === undefined) return;
  if (index === questions.length - 1) {
    renderPlan();
    return;
  }
  index += 1;
  renderQuestion();
});

previous.addEventListener("click", () => {
  index -= 1;
  renderQuestion();
});

document.querySelector("#reset").addEventListener("click", () => {
  answers.length = 0;
  index = 0;
  result.hidden = true;
  interview.hidden = false;
  renderQuestion();
});

renderQuestion(false);
interview.hidden = false;
