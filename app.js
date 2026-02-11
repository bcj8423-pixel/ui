const content = document.getElementById("content");
const phaseLabel = document.getElementById("phaseLabel");

const LIKERT = [1, 2, 3, 4, 5];
const GROUPS = [
  "control_no_ai",
  "static_ai_info",
  "interactive_ai",
];

const allQuestions = makeQuestionBank();
const state = {
  participantId: crypto.randomUUID(),
  assignedGroup: GROUPS[Math.floor(Math.random() * GROUPS.length)],
  startedAt: Date.now(),
  covariates: {},
  matrixReasoning: null,
  baseline: [],
  manipulation: [],
  bpnsfT1: null,
  prediction: null,
  transfer: [],
  bpnsfT2: null,
  stage4TutorialDoneAt: null,
  platform: [],
  aiCallCount: 0,
  firstAiLatencyMs: null,
};

function setPhase(title) {
  phaseLabel.textContent = `현재 단계: ${title}`;
}

function card(html) {
  return `<div class="card">${html}</div>`;
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeQuestionBank() {
  return Array.from({ length: 40 }).map((_, i) => ({
    id: `Q${i + 1}`,
    stem: `논리추론 문항 ${i + 1}: 제시된 전제에서 가장 타당한 결론을 고르시오.`,
    options: ["선지 A", "선지 B", "선지 C", "선지 D", "선지 E"],
    answer: ["A", "B", "C", "D", "E"][i % 5],
    staticHint:
      "핵심 전제를 먼저 구조화하고, 반례가 없는 선택지를 우선적으로 검토하세요.",
  }));
}

function renderIntro() {
  setPhase("사전 안내 및 동의");
  content.innerHTML =
    card(`
      <h2>실험 개요</h2>
      <p>본 프로토타입은 4단계 실험(기저선 → 조작 → 예측/전이 → 행동적 의존)을 구현합니다.</p>
      <ul>
        <li>무선할당 집단: <strong>${state.assignedGroup}</strong></li>
        <li>참가자 ID: <code>${state.participantId}</code></li>
        <li>실험은 개인 부스에서 수행한다는 상황을 가정합니다.</li>
      </ul>
      <button id="start">동의하고 시작</button>
    `);

  document.getElementById("start").onclick = renderCovariates;
}

function renderCovariates() {
  setPhase("사전 통제변인 측정");
  content.innerHTML = card(`
    <h2>사전 설문</h2>
    <p class="inline-note">인구통계, AI 문해력(SNAIL), 인지욕구, 사전 인지능력을 측정합니다.</p>
    <div class="row">
      <label>연령 <input id="age" type="number" min="18" max="99" required /></label>
      <label>성별 <input id="gender" type="text" placeholder="자유응답" /></label>
    </div>
    <label>AI 문해력(SNAIL) 자기평정(1-5)
      <input id="snail" type="number" min="1" max="5" required />
    </label>
    <label>인지욕구 단축형 평균(1-5)
      <input id="nfc" type="number" min="1" max="5" required />
    </label>
    <label>짧은 행렬추론 과제 점수(0-12)
      <input id="matrix" type="number" min="0" max="12" required />
    </label>
    <button id="toBaseline">1단계 시작</button>
  `);

  document.getElementById("toBaseline").onclick = () => {
    state.covariates = {
      age: Number(document.getElementById("age").value),
      gender: document.getElementById("gender").value.trim(),
      snail: Number(document.getElementById("snail").value),
      nfc: Number(document.getElementById("nfc").value),
    };
    state.matrixReasoning = Number(document.getElementById("matrix").value);
    runQuestionStage({
      title: "1단계(기저선): 6문항, 외부 도움 없음",
      key: "baseline",
      count: 6,
      aiMode: "none",
      onDone: () => runManipulation(),
    });
  };
}

function runManipulation() {
  runQuestionStage({
    title: "2단계(조작): 10문항",
    key: "manipulation",
    count: 10,
    aiMode:
      state.assignedGroup === "interactive_ai"
        ? "interactive"
        : state.assignedGroup === "static_ai_info"
          ? "static"
          : "none",
    onDone: () => renderBpnsf("bpnsfT1", renderPredictionAndTransfer),
  });
}

function renderBpnsf(key, next) {
  const isT1 = key === "bpnsfT1";
  setPhase(isT1 ? "2단계 직후 BPNSFS(T1)" : "3단계 직후 BPNSFS(T2)");
  const items = shuffle([
    "나는 과제를 효과적으로 해낼 수 있다는 느낌이 들었다.",
    "나는 과제를 수행하면서 유능하다고 느꼈다.",
    "나는 목표를 달성할 역량이 있다고 느꼈다.",
    "나는 수행 과정이 잘 통제된다고 느꼈다.",
    "나는 내 능력이 부족하다는 느낌이 들었다.",
    "나는 실패할 것 같아 위축되었다.",
    "나는 과제를 감당하기 어렵다고 느꼈다.",
    "나는 무력감을 느꼈다.",
  ]);

  content.innerHTML = card(`
    <h2>${isT1 ? "T1" : "T2"} BPNSFS 유능성 하위척도</h2>
    <p class="inline-note">각 문항: 1(전혀 아니다) ~ 5(매우 그렇다)</p>
    <form id="bpnsfForm"></form>
    <button id="bpnsfNext">다음</button>
  `);

  const form = document.getElementById("bpnsfForm");
  items.forEach((item, idx) => {
    const block = document.createElement("fieldset");
    block.innerHTML = `<legend>${idx + 1}. ${item}</legend>${LIKERT.map(
      (v) => `<label><input type="radio" name="i${idx}" value="${v}"> ${v}</label>`,
    ).join("")}`;
    form.appendChild(block);
  });

  document.getElementById("bpnsfNext").onclick = () => {
    const values = items.map((_, idx) => {
      const checked = form.querySelector(`input[name=i${idx}]:checked`);
      return checked ? Number(checked.value) : null;
    });
    if (values.some((v) => v === null)) {
      alert("모든 문항에 응답해주세요.");
      return;
    }
    state[key] = { items, values };
    next();
  };
}

function renderPredictionAndTransfer() {
  setPhase("3단계(예측 및 전이)");
  content.innerHTML = card(`
    <h2>전이 세트 시작 전 예측</h2>
    <p><strong>동일한 유형의 논리추론 문항 10문항을 혼자 힘으로 풀면 몇 문항을 맞힐 것 같습니까?</strong></p>
    <label>예상 정답 수(0~10)
      <input id="pred" type="number" min="0" max="10" />
    </label>
    <button id="toTransfer">전이 세트 시작</button>
  `);

  document.getElementById("toTransfer").onclick = () => {
    const p = Number(document.getElementById("pred").value);
    if (Number.isNaN(p) || p < 0 || p > 10) return alert("0~10 범위로 입력해주세요.");
    state.prediction = p;
    runQuestionStage({
      title: "3단계(전이): 10문항, AI 미사용",
      key: "transfer",
      count: 10,
      aiMode: "none",
      onDone: () => renderBpnsf("bpnsfT2", renderTutorial),
    });
  };
}

function renderTutorial() {
  setPhase("4단계 준비: AI 인터페이스 시연");
  content.innerHTML = card(`
    <h2>AI 도움 인터페이스 시연 (약 1분)</h2>
    <p>모든 참가자에게 동일하게 안내됩니다. 아래 버튼을 눌러 1회 연습 조작을 수행하세요.</p>
    <button id="demoBtn">AI 도움 요청 (연습)</button>
    <div id="demoLog" class="ai-panel" hidden></div>
    <button id="toStage4" disabled>4단계 시작</button>
  `);

  document.getElementById("demoBtn").onclick = () => {
    const log = document.getElementById("demoLog");
    log.hidden = false;
    log.innerHTML = `<p><strong>시스템:</strong> 연습 문항에 대한 예시 도움입니다. 핵심 조건을 구조화한 뒤, 오답 소거 전략을 적용하세요.</p>`;
    state.stage4TutorialDoneAt = Date.now();
    document.getElementById("toStage4").disabled = false;
  };

  document.getElementById("toStage4").onclick = () => {
    runQuestionStage({
      title: "4단계(행동적 의존): 10문항, AI 선택 사용 가능",
      key: "platform",
      count: 10,
      aiMode: "optional",
      onDone: renderSummary,
    });
  };
}

function runQuestionStage({ title, key, count, aiMode, onDone }) {
  setPhase(title);
  const questions = shuffle(allQuestions).slice(0, count);
  let idx = 0;

  const renderItem = () => {
    const q = questions[idx];
    const startedAt = Date.now();
    let aiUsed = false;

    content.innerHTML = card(`
      <h2>${title}</h2>
      <p><strong>${idx + 1}/${count}.</strong> ${q.stem}</p>
      <form id="qForm">
        ${q.options
          .map((op, i) => `<label><input type="radio" name="ans" value="${"ABCDE"[i]}"> ${op}</label>`)
          .join("")}
      </form>
      <div id="aiArea"></div>
      <button id="nextQ">다음 문항</button>
    `);

    const aiArea = document.getElementById("aiArea");
    if (aiMode === "static") {
      aiArea.innerHTML = `<div class="ai-panel"><strong>AI 정보 카드:</strong> ${q.staticHint}</div>`;
    }
    if (aiMode === "interactive" || aiMode === "optional") {
      aiArea.innerHTML = `
        <div class="ai-panel">
          <button class="secondary" id="askAi">AI 도움 요청</button>
          <div class="chat" id="chat"></div>
          <input id="prompt" placeholder="질문을 입력하세요" />
          <button class="secondary" id="sendPrompt">전송</button>
        </div>
      `;

      const askAi = document.getElementById("askAi");
      const chat = document.getElementById("chat");
      const prompt = document.getElementById("prompt");
      const sendPrompt = document.getElementById("sendPrompt");

      askAi.onclick = () => {
        aiUsed = true;
        state.aiCallCount += 1;
        if (key === "platform" && state.firstAiLatencyMs === null) {
          state.firstAiLatencyMs = Date.now() - startedAt;
        }
        chat.innerHTML += `<p><strong>AI:</strong> 문제의 결론과 전제를 분리해 확인해보세요.</p>`;
      };
      sendPrompt.onclick = () => {
        aiUsed = true;
        state.aiCallCount += 1;
        if (key === "platform" && state.firstAiLatencyMs === null) {
          state.firstAiLatencyMs = Date.now() - startedAt;
        }
        chat.innerHTML += `<p><strong>참가자:</strong> ${prompt.value || "(빈 입력)"}</p>`;
        chat.innerHTML += `<p><strong>AI:</strong> 오답 선택지의 숨은 가정을 찾아 소거해 보세요.</p>`;
        prompt.value = "";
      };
    }

    document.getElementById("nextQ").onclick = () => {
      const selected = document.querySelector("input[name=ans]:checked");
      if (!selected) return alert("답안을 선택하세요.");

      state[key].push({
        questionId: q.id,
        selected: selected.value,
        correct: selected.value === q.answer,
        aiUsed,
        latencyMs: Date.now() - startedAt,
      });

      idx += 1;
      if (idx < count) {
        renderItem();
      } else {
        onDone();
      }
    };
  };

  renderItem();
}

function score(arr) {
  return arr.filter((x) => x.correct).length;
}

function renderSummary() {
  setPhase("종료");
  const baselineScore = score(state.baseline);
  const transferScore = score(state.transfer);
  const illusion = state.prediction - transferScore;
  const platformNoAiRatio =
    ((state.platform.filter((x) => !x.aiUsed).length / state.platform.length) * 100).toFixed(1);

  const payload = {
    ...state,
    summary: {
      baselineScore,
      transferScore,
      competenceIllusion: illusion,
      platformNoAiRatio,
      firstAiLatencyMs: state.firstAiLatencyMs,
      aiCallCount: state.aiCallCount,
    },
    generatedAt: new Date().toISOString(),
  };

  content.innerHTML = `
    ${card(`
      <h2>실험 종료</h2>
      <p class="kpi">기저선 점수: ${baselineScore}/6</p>
      <p class="kpi">전이 실제 점수: ${transferScore}/10</p>
      <p class="kpi">유능성 착각 점수(예측-실제): ${illusion}</p>
      <p class="kpi">4단계 AI 미사용 완료 문항 비율: ${platformNoAiRatio}%</p>
      <p class="kpi">첫 AI 호출 잠복시간: ${state.firstAiLatencyMs ?? "호출 없음"}</p>
      <p class="kpi">총 AI 호출 빈도: ${state.aiCallCount}</p>
    `)}
    ${card(`
      <h3>원자료(JSON)</h3>
      <p class="inline-note">분석에서 T1을 공변량으로 투입한 잔차변화 접근, 위계적 회귀, 병렬매개를 수행할 수 있도록 로그를 저장했습니다.</p>
      <div class="summary"><pre>${JSON.stringify(payload, null, 2)}</pre></div>
      <button id="download">JSON 다운로드</button>
    `)}
  `;

  document.getElementById("download").onclick = () => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `experiment_${state.participantId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
}

renderIntro();
