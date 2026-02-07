const trials = [
  {
    id: "logic-1",
    question: "세 개의 문이 있고 한 문만 열쇠가 있습니다. 항상 절반씩 좁혀나가는 전략의 핵심은 무엇인가요?",
    options: [
      "모든 문을 무작위로 선택한다.",
      "가능한 선택지를 매 단계에서 반으로 줄인다.",
      "항상 가장 오른쪽 문을 선택한다.",
    ],
    answerIndex: 1,
    hints: [
      "1단계: 가능한 선택지를 체계적으로 줄이는 전략을 떠올려 보세요.",
      "2단계: 매 단계에서 후보를 절반으로 줄이면 정보 효율이 높아집니다.",
      "3단계: 정답은 '가능한 선택지를 매 단계에서 반으로 줄인다'입니다.",
    ],
  },
  {
    id: "math-1",
    question: "어떤 수에 3을 더하고 2를 곱해 14가 되었다면, 원래 수는?",
    options: ["2", "4", "5"],
    answerIndex: 1,
    hints: [
      "1단계: 역연산을 차례로 적용해 보세요.",
      "2단계: 먼저 2로 나눈 뒤 3을 빼면 됩니다.",
      "3단계: 14 ÷ 2 = 7, 7 - 3 = 4입니다.",
    ],
  },
  {
    id: "verbal-1",
    question: "문장 '모든 고양이는 동물이다'에서 '고양이'와 '동물'의 관계는?",
    options: ["동일하다", "포함 관계이다", "무관하다"],
    answerIndex: 1,
    hints: [
      "1단계: 포함 관계의 방향을 생각해 보세요.",
      "2단계: 고양이는 동물 집합 안에 포함됩니다.",
      "3단계: 정답은 '포함 관계이다'입니다.",
    ],
  },
];

const conditionPool = ["hint-available", "hint-optional"];

const state = {
  participantId: "",
  condition: conditionPool[Math.floor(Math.random() * conditionPool.length)],
  shuffledTrials: [],
  trialIndex: 0,
  trialStartTime: 0,
  firstHintTime: null,
  hintLevelOpened: 0,
  responses: [],
};

const introEl = document.getElementById("intro");
const trialEl = document.getElementById("trial");
const completeEl = document.getElementById("complete");
const participantIdInput = document.getElementById("participantId");
const startBtn = document.getElementById("startBtn");
const conditionLabel = document.getElementById("conditionLabel");
const trialIndexLabel = document.getElementById("trialIndex");
const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const hintToggleBtn = document.getElementById("hintToggle");
const hintLevelsEl = document.getElementById("hintLevels");
const hintContentEl = document.getElementById("hintContent");
const submitBtn = document.getElementById("submitBtn");
const feedbackEl = document.getElementById("feedback");
const downloadBtn = document.getElementById("downloadBtn");
const csvPreviewEl = document.getElementById("csvPreview");

const shuffle = (list) => {
  const array = [...list];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const resetHintUI = () => {
  hintLevelsEl.classList.add("hidden");
  hintContentEl.textContent = "";
  const hintButtons = hintLevelsEl.querySelectorAll(".hint-btn");
  hintButtons.forEach((button) => {
    const level = Number(button.dataset.level);
    button.disabled = level !== 1;
  });
};

const startTrial = () => {
  const current = state.shuffledTrials[state.trialIndex];
  conditionLabel.textContent = `조건: ${state.condition}`;
  trialIndexLabel.textContent = `문항 ${state.trialIndex + 1} / ${state.shuffledTrials.length}`;
  questionEl.textContent = current.question;
  optionsEl.innerHTML = "";
  feedbackEl.textContent = "";

  current.options.forEach((option, idx) => {
    const label = document.createElement("label");
    label.className = "option";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "option";
    input.value = idx;
    const text = document.createElement("span");
    text.textContent = option;
    label.appendChild(input);
    label.appendChild(text);
    optionsEl.appendChild(label);
  });

  state.trialStartTime = performance.now();
  state.firstHintTime = null;
  state.hintLevelOpened = 0;
  resetHintUI();
};

const openHintLevel = (level) => {
  const current = state.shuffledTrials[state.trialIndex];
  if (state.firstHintTime === null) {
    state.firstHintTime = performance.now();
  }
  state.hintLevelOpened = Math.max(state.hintLevelOpened, level);
  hintContentEl.textContent = current.hints[level - 1];

  const nextButton = hintLevelsEl.querySelector(`.hint-btn[data-level="${level + 1}"]`);
  if (nextButton) {
    nextButton.disabled = false;
  }
};

startBtn.addEventListener("click", () => {
  const participantId = participantIdInput.value.trim();
  if (!participantId) {
    participantIdInput.focus();
    return;
  }
  state.participantId = participantId;
  state.shuffledTrials = shuffle(trials);
  state.trialIndex = 0;
  introEl.classList.add("hidden");
  trialEl.classList.remove("hidden");
  startTrial();
});

hintToggleBtn.addEventListener("click", () => {
  hintLevelsEl.classList.toggle("hidden");
});

hintLevelsEl.addEventListener("click", (event) => {
  const button = event.target.closest(".hint-btn");
  if (!button || button.disabled) {
    return;
  }
  const level = Number(button.dataset.level);
  openHintLevel(level);
});

submitBtn.addEventListener("click", () => {
  const selected = optionsEl.querySelector("input[name='option']:checked");
  if (!selected) {
    feedbackEl.textContent = "정답을 선택해 주세요.";
    feedbackEl.style.color = "#b45309";
    return;
  }

  const current = state.shuffledTrials[state.trialIndex];
  const accuracy = Number(selected.value) === current.answerIndex ? 1 : 0;
  const now = performance.now();
  const firstHintRt = state.firstHintTime === null ? null : Math.round(state.firstHintTime - state.trialStartTime);

  state.responses.push({
    participant_id: state.participantId,
    condition: state.condition,
    trial_index: state.trialIndex + 1,
    hint_level_opened: state.hintLevelOpened,
    first_hint_rt_ms: firstHintRt,
    total_time_ms: Math.round(now - state.trialStartTime),
    accuracy,
  });

  feedbackEl.textContent = accuracy ? "정답입니다!" : "오답입니다.";
  feedbackEl.style.color = accuracy ? "#15803d" : "#b91c1c";

  state.trialIndex += 1;
  if (state.trialIndex < state.shuffledTrials.length) {
    setTimeout(startTrial, 500);
  } else {
    trialEl.classList.add("hidden");
    completeEl.classList.remove("hidden");
    csvPreviewEl.textContent = buildCsv();
  }
});

const buildCsv = () => {
  const headers = [
    "participant_id",
    "condition",
    "trial_index",
    "hint_level_opened",
    "first_hint_rt_ms",
    "total_time_ms",
    "accuracy",
  ];
  const lines = [headers.join(",")];
  state.responses.forEach((row) => {
    lines.push(
      headers
        .map((header) => {
          const value = row[header];
          return value === null ? "" : String(value);
        })
        .join(",")
    );
  });
  return lines.join("\n");
};

const downloadCsv = () => {
  const csv = buildCsv();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `responses_${state.participantId}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

downloadBtn.addEventListener("click", downloadCsv);
