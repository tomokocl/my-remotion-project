const CASES = Array.isArray(window.AI_SAVINGS_CASES) ? window.AI_SAVINGS_CASES : [];
const STORAGE_KEY = "ai-savings-matrix-logs-v1";
const LEVELS = {
  beginner: "初級",
  middle: "中級",
  advanced: "上級"
};

let activeLevel = "beginner";
let selectedCase = null;

const seedLogs = {};

function init() {
  document.querySelector("[data-total-count]").textContent = CASES.length;
  renderCounts();
  initTabs();
  initDetailActions();
  initScrollReveal();
  renderCards();
  initFromUrl();
}

function renderCounts() {
  Object.keys(LEVELS).forEach((level) => {
    const count = CASES.filter((item) => item.level === level).length;
    document.querySelectorAll(`[data-count="${level}"], [data-count-main="${level}"]`).forEach((target) => {
      target.textContent = count;
    });
  });
}

function initTabs() {
  document.querySelectorAll("[data-level-tab]").forEach((tab) => {
    tab.addEventListener("click", () => {
      activeLevel = tab.dataset.levelTab;
      selectedCase = null;
      document.querySelector("[data-case-detail]").hidden = true;
      syncActiveTabs();
      renderCards();
      renderDashboardList();
    });
  });
}

function syncActiveTabs() {
  document.querySelectorAll("[data-level-tab]").forEach((item) => {
        item.classList.toggle("is-active", item.dataset.levelTab === activeLevel);
      });
}

function renderCards() {
  const grid = document.querySelector("[data-case-grid]");
  const items = CASES.filter((item) => item.level === activeLevel);

  grid.innerHTML = items.map((item) => {
    const primaryUrl = getPrimaryUrl(item);
    const hasPrompt = Boolean(getUsablePrompt(item));
    const primaryLabel = item.gemUrl ? "GEMで試す" : primaryUrl ? "URLで体験" : "手順で再現";
    return `
      <button class="case-card ${selectedCase?.id === item.id ? "is-selected" : ""}" type="button" data-case-id="${escapeHtml(item.id)}">
        <span class="case-card-meta">${escapeHtml(item.levelLabel || LEVELS[item.level])} / ${escapeHtml(item.category || "未分類")} / ${escapeHtml(item.tool || "AI")}</span>
        <strong>${escapeHtml(item.title)}</strong>
        <span class="case-card-summary">${escapeHtml(getSummary(item, 92))}</span>
        <span class="saving-amount">${formatSavingText(item.saving || "削減目安を確認")}</span>
        <span class="card-tags">
          <em>${primaryLabel}</em>
          ${hasPrompt ? "<em>プロンプトあり</em>" : ""}
        </span>
        <span class="card-action">試してみる</span>
      </button>
    `;
  }).join("");

  grid.querySelectorAll("[data-case-id]").forEach((card) => {
    card.addEventListener("click", () => selectCase(card.dataset.caseId, true));
  });
  renderDashboardList();
}

function renderDashboardList() {
  const list = document.querySelector("[data-dashboard-list]");
  if (!list) return;
  const items = CASES.filter((item) => item.level === activeLevel);
  list.innerHTML = items.map((item) => `
    <button class="dashboard-case ${selectedCase?.id === item.id ? "is-selected" : ""}" type="button" data-dashboard-case-id="${escapeHtml(item.id)}">
      <span>${escapeHtml(item.category || "未分類")} / ${escapeHtml(item.tool || "AI")}</span>
      <strong>${escapeHtml(item.title)}</strong>
      <em>${formatSavingText(item.saving || "削減目安を確認")}</em>
    </button>
  `).join("");

  list.querySelectorAll("[data-dashboard-case-id]").forEach((button) => {
    button.addEventListener("click", () => {
      closeDashboard();
      selectCase(button.dataset.dashboardCaseId, true);
    });
  });
}

function selectCase(caseId, shouldScroll) {
  const item = CASES.find((entry) => entry.id === caseId);
  if (!item) return;
  selectedCase = item;
  activeLevel = item.level;

  document.querySelectorAll("[data-level-tab]").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.levelTab === activeLevel);
  });
  renderCards();

  const detail = document.querySelector("[data-case-detail]");
  detail.hidden = false;
  document.querySelector("[data-detail-level]").textContent = `${item.levelLabel || LEVELS[item.level]} / ${item.category || "未分類"} / ${item.tool || "AI"}`;
  document.querySelector("[data-detail-title]").textContent = item.title;
  document.querySelector("[data-detail-summary]").textContent = getSummary(item, 180);
  const savingBox = document.querySelector("[data-detail-saving]").closest(".saving-box");
  const savingText = item.saving || "事例内で確認";
  savingBox.classList.toggle("is-long", savingText.length > 22);
  document.querySelector("[data-detail-saving]").innerHTML = formatSavingText(savingText);
  document.querySelector("[data-detail-try]").textContent = getTryText(item);
  document.querySelector("[data-detail-story]").innerHTML = isLineStampCase(item)
    ? buildLineStampArticleHtml(item)
    : buildStoryHtml(item);
  document.querySelector("[data-detail-steps]").innerHTML = isLineStampCase(item)
    ? buildLineStampStepsHtml()
    : buildRecipeSteps(item).map((step, index) => `
      <div class="mini-step">
        <span>${index + 1}</span>
        <p>${escapeHtml(step)}</p>
      </div>
    `).join("");

  const link = document.querySelector("[data-detail-link]");
  const primaryUrl = getPrimaryUrl(item);
  if (primaryUrl) {
    link.href = primaryUrl;
    link.textContent = item.gemUrl ? "GEMで試す" : item.sourceUrl ? "今すぐ試す" : "実例画面を見て体験する";
    link.hidden = false;
  } else {
    link.hidden = true;
  }

  const usablePrompt = getUsablePrompt(item);
  const promptBox = document.querySelector("[data-prompt-box]");
  if (usablePrompt) {
    promptBox.hidden = false;
    document.querySelector("[data-detail-prompt]").textContent = usablePrompt;
  } else {
    promptBox.hidden = true;
    document.querySelector("[data-detail-prompt]").textContent = "";
  }

  document.querySelector("[data-form-case-id]").value = item.id;
  renderLogs();
  history.replaceState(null, "", `?case=${encodeURIComponent(item.id)}#manual`);

  if (shouldScroll) {
    detail.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function initDetailActions() {
  const toggle = document.querySelector("[data-dashboard-toggle]");
  const dashboard = document.querySelector("[data-dashboard]");
  const scrim = document.querySelector("[data-dashboard-scrim]");
  toggle.addEventListener("click", () => {
    const isOpen = !dashboard.hidden;
    if (isOpen) closeDashboard();
    else openDashboard();
  });
  document.querySelector("[data-dashboard-close]").addEventListener("click", closeDashboard);
  scrim.addEventListener("click", closeDashboard);

  document.querySelector("[data-copy-detail]").addEventListener("click", async (event) => {
    const text = document.querySelector("[data-detail-prompt]").textContent;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    const button = event.currentTarget;
    button.textContent = "コピーしました";
    setTimeout(() => { button.textContent = "プロンプトをコピー"; }, 1400);
  });

  document.querySelector("[data-practice-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!selectedCase) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    saveLog(selectedCase.id, {
      name: data.get("name") || "匿名さん",
      note: data.get("note") || "",
      tweak: data.get("tweak") || "",
      createdAt: new Date().toISOString()
    });
    form.reset();
    document.querySelector("[data-form-case-id]").value = selectedCase.id;
    renderLogs();
    const status = form.querySelector("[data-form-status]");
    status.textContent = "👏 投稿しました。この事例の「やってみた人」に反映されています。";
    setTimeout(() => { status.textContent = ""; }, 3200);
  });
}

function openDashboard() {
  document.querySelector("[data-dashboard]").hidden = false;
  document.querySelector("[data-dashboard-scrim]").hidden = false;
  document.querySelector("[data-dashboard-toggle]").setAttribute("aria-expanded", "true");
  document.body.classList.add("dashboard-open");
}

function closeDashboard() {
  document.querySelector("[data-dashboard]").hidden = true;
  document.querySelector("[data-dashboard-scrim]").hidden = true;
  document.querySelector("[data-dashboard-toggle]").setAttribute("aria-expanded", "false");
  document.body.classList.remove("dashboard-open");
}

function initScrollReveal() {
  const targets = document.querySelectorAll(".reveal-section, .flow-grid article");
  window.setTimeout(() => {
    targets.forEach((target) => target.classList.add("is-visible"));
  }, 1200);
  if (!("IntersectionObserver" in window)) {
    targets.forEach((target) => target.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.22 });
  targets.forEach((target) => observer.observe(target));
}

function getSavedLogs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveLog(caseId, log) {
  const logs = getSavedLogs();
  logs[caseId] = logs[caseId] || [];
  logs[caseId].unshift(log);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

function getLogs(caseId) {
  const saved = getSavedLogs();
  return [...(saved[caseId] || []), ...(seedLogs[caseId] || [])];
}

function renderLogs() {
  const list = document.querySelector("[data-log-list]");
  if (!selectedCase) return;
  const logs = getLogs(selectedCase.id);
  list.innerHTML = logs.length ? logs.map((log) => `
    <article class="log-item">
      <strong>${escapeHtml(log.name || "匿名さん")}</strong>
      <p>${escapeHtml(log.note || "")}</p>
      ${log.tweak ? `<p><b>変えたところ:</b> ${escapeHtml(log.tweak)}</p>` : ""}
    </article>
  `).join("") : `<p class="empty-log">まだ投稿はありません。最初の「やってみた」を残せます。</p>`;
}

function getSummary(item, length = 100) {
  const text = String(item.articleLead || item.detail || item.prompt || item.howto || "").replace(/\s+/g, " ").trim();
  return text.length > length ? `${text.slice(0, length)}...` : text || "内容を確認しながら、自分用に作り直せる事例です。";
}

function getTryText(item) {
  if (item.tryText) return item.tryText;
  const primaryUrl = getPrimaryUrl(item);
  if (primaryUrl && getUsablePrompt(item)) {
    return "まず上のボタンから完成物や実例画面を開きます。その後、下のプロンプトをコピーして、自分の条件に置き換えて試します。";
  }
  if (primaryUrl) {
    return "まず上のボタンから完成物や実例画面を開きます。どんな入力をすると何が返ってくるのかを見てから、下の手順で自分用に再現します。";
  }
  if (getUsablePrompt(item)) {
    return "共有URLはありません。下のプロンプトをコピーして、サービス名・金額・家族構成などを自分用に置き換えて試します。";
  }
  return "共有URLとプロンプトは未入力です。事例の内容をもとに、目的・条件・出力形式に分けて自分用の依頼文を作ります。";
}

function buildStoryHtml(item) {
  if (Array.isArray(item.articleInputs) || Array.isArray(item.articleExamples) || Array.isArray(item.articleTips)) {
    const inputs = Array.isArray(item.articleInputs) ? item.articleInputs : [];
    const examples = Array.isArray(item.articleExamples) ? item.articleExamples : [];
    const tips = Array.isArray(item.articleTips) ? item.articleTips : [];
    const body = Array.isArray(item.articleBody) ? item.articleBody : [];
    return `
      <div class="line-article">
        <section class="line-lead">
          <p class="line-kicker">この事例で体験すること</p>
          <h3>${escapeHtml(item.articleHeroTitle || item.title || "")}</h3>
          <p>${escapeHtml(item.articleHeroText || getSummary(item))}</p>
        </section>

        ${inputs.length ? `
          <section class="line-card">
            <div>
              <p class="line-kicker">最初に答えること</p>
              <h4>ここを入れると、自分用の結果に変わります。</h4>
            </div>
            <div class="line-question-grid">
              ${inputs.map((input) => `<span>${escapeHtml(input)}</span>`).join("")}
            </div>
          </section>
        ` : ""}

        ${examples.length ? `
          <section class="line-card">
            <div>
              <p class="line-kicker">出てくる例</p>
              <h4>体験後に見える成果物のイメージ</h4>
            </div>
            <div class="stamp-table">
              ${examples.map((example) => `
                <article>
                  <strong>${escapeHtml(example.title || "")}</strong>
                  <span>${escapeHtml(example.body || "")}</span>
                  ${example.note ? `<small>${escapeHtml(example.note)}</small>` : ""}
                </article>
              `).join("")}
            </div>
          </section>
        ` : ""}

        ${tips.length ? `
          <section class="line-card line-points">
            ${tips.map((tip) => `
              <article>
                <strong>${escapeHtml(tip.title || "")}</strong>
                <p>${escapeHtml(tip.body || "")}</p>
              </article>
            `).join("")}
          </section>
        ` : ""}

        ${body.length ? `
          <div class="story-body">
            ${body.map((part) => `<p>${escapeHtml(part)}</p>`).join("")}
          </div>
        ` : ""}
      </div>
    `;
  }

  if (Array.isArray(item.articleCards) || Array.isArray(item.articleBody)) {
    const cards = Array.isArray(item.articleCards) ? item.articleCards : [];
    const body = Array.isArray(item.articleBody) ? item.articleBody : splitText(item.detail || "");
    return `
      <section class="case-diagram" aria-label="体験から再現までの図解">
        <p class="case-diagram-kicker">図解：体験から再現まで</p>
        <div class="case-diagram-flow">
          ${cards.map((card, index) => `
            <article>
              <span class="case-diagram-num">${index + 1}</span>
              <div>
                <strong>${escapeHtml(card.label || "")}</strong>
                <p>${formatTextWithBreaks(card.text || "")}</p>
              </div>
            </article>
          `).join("")}
        </div>
      </section>
      <div class="story-section-title">再現のポイント</div>
      <div class="story-body">
        ${body.map((part) => `<p>${escapeHtml(part)}</p>`).join("")}
      </div>
    `;
  }

  const detailParts = splitText(item.detail || "");
  const firstAsk = inferFirstAsk(item);
  const promptStatus = getUsablePrompt(item)
    ? "そのままコピーできるプロンプトがあります。最初は丸写しで試し、次に自分の条件だけ変えます。"
    : "完成プロンプトは未整備です。代わりに、目的・条件・出力形式へ分解して再現します。";
  const urlStatus = getPrimaryUrl(item)
    ? "完成物または実例画面を先に見られます。初心者はここで完成イメージをつかめます。"
    : "実物URLは未入力です。事例文から、どんな完成物を作りたいかを先に言語化します。";

  return `
    <div class="story-grid">
      <article>
        <span>体験</span>
        <strong>${escapeHtml(urlStatus)}</strong>
      </article>
      <article>
        <span>最初の一言</span>
        <strong>${escapeHtml(firstAsk)}</strong>
      </article>
      <article>
        <span>真似する材料</span>
        <strong>${escapeHtml(promptStatus)}</strong>
      </article>
    </div>
    <div class="story-body">
      ${detailParts.map((part) => `<p>${escapeHtml(part)}</p>`).join("")}
    </div>
  `;
}

function isLineStampCase(item) {
  return item.id === "case-01";
}

function buildLineStampArticleHtml(item) {
  const stampIdeas = [
    ["おはよ", "眠そうな目で布団から頭だけ出している猫", "朝の第一声"],
    ["りょ", "真顔でサムズアップしている猫", "了解・確認の返信"],
    ["いまから帰る", "荷物を背負って競歩のように歩く猫", "帰宅の連絡"],
    ["おつかれさま", "お茶をすすりながら魂が抜けかけている猫", "仕事や学校終わり"],
    ["ごはん何？", "空のお皿と箸を持って真顔で座る猫", "夕方の定番質問"],
    ["ありがとう", "深々とおじぎする猫", "感謝を伝えるとき"],
    ["ごめん…", "壁のすき間から申し訳なさそうに覗く猫", "遅れるとき・ミスしたとき"],
    ["おやすみ", "アイマスクで白目気味に爆睡している猫", "1日の終わり"]
  ];

  const answerExamples = [
    ["契約状況", "いまは契約なし。今後のスタンプ課金を防ぐ目的で使う。"],
    ["使う場面", "家族に送る日常のあいさつ。毎日使う言葉に絞る。"],
    ["雰囲気", "手書き風のシュールな猫。文字あり。"],
    ["ツール経験", "AIは触ったことがない前提で進める。"],
    ["公開範囲", "身内だけで非公開利用。一般販売は目指さない。"]
  ];

  const toolFlow = [
    ["Gem", "5つの質問から、節約額・スタンプ案・画像生成プロンプト・Canva手順・申請前チェックまで分解します。"],
    ["画像生成AI", "白背景、手書き風、文字なしで猫の絵だけ作ります。文字は後からCanvaで入れる方が直しやすいです。"],
    ["Canva", "370 x 320 pxで配置し、手書き風フォントと白い縁取りでLINE上でも読める文字に整えます。"],
    ["LINE Stamp Maker", "8枚をアップロードし、ショップ非公開・無料ダウンロード設定で申請します。検証では申請まで完了しています。"]
  ];

  return `
    <div class="line-article">
      <section class="line-lead">
        <p class="line-kicker">この事例で体験すること</p>
        <h3>家族LINEで本当に使う8個だけを、GemとCanvaでスタンプ化します。</h3>
        <p>検証では、AI未経験の前提で「手書き風のシュールな猫」を作る流れを確認しました。Gemは最初に5つだけ質問し、その回答からスタンプ案、画像生成プロンプト、Canva編集、LINE Stamp Makerでの申請まで順番に出してくれます。</p>
      </section>

      <section class="line-card">
        <div>
          <p class="line-kicker">最初に答えること</p>
          <h4>プロンプトを書く前に、使い方を5つだけ整理します。</h4>
          <p>スタンプ代、よく使う言葉、作りたい雰囲気、使えるツール、公開範囲を答えるだけで、Gemが「何を作ればいいか」まで落とし込みます。</p>
        </div>
        <div class="line-question-grid">
          <span>今スタンプにいくら使っているか</span>
          <span>よく使う言葉や雰囲気</span>
          <span>作りたいキャラクター</span>
          <span>使えるツールの経験</span>
          <span>公開するか、家族用にするか</span>
        </div>
      </section>

      <section class="line-card">
        <p class="line-kicker">検証で入れた条件</p>
        <h4>「AI未経験・家族用・非公開」でも、作業手順まで具体化できました。</h4>
        <div class="stamp-table">
          ${answerExamples.map(([label, body]) => `
            <article>
              <strong>${escapeHtml(label)}</strong>
              <span>${escapeHtml(body)}</span>
            </article>
          `).join("")}
        </div>
      </section>

      <section class="line-card">
        <p class="line-kicker">出てくるスタンプ案の例</p>
        <h4>かわいいだけでなく、毎日の返信で使う言葉に絞ります。</h4>
        <div class="stamp-table">
          ${stampIdeas.map(([label, image, scene]) => `
            <article>
              <strong>${escapeHtml(label)}</strong>
              <span>${escapeHtml(image)}</span>
              <small>${escapeHtml(scene)}</small>
            </article>
          `).join("")}
        </div>
      </section>

      <section class="line-card line-points">
        ${toolFlow.map(([label, body]) => `
          <article>
            <strong>${escapeHtml(label)}</strong>
            <p>${escapeHtml(body)}</p>
          </article>
        `).join("")}
      </section>

      <section class="line-shot-grid line-shot-grid-single">
        <figure class="line-shot">
          <img src="assets/line-stamp-guide/line-stamp-maker-closeup.png" alt="LINEスタンプメーカーのプレビューと販売情報のスマホ画面">
          <figcaption>検証では、Gemの手順に沿ってChatGPT、Canva、LINE Stamp Makerまで進み、申請まで完了しました。画像がある場合は、このように「最後にどの画面へ進むのか」が見えると一気に分かりやすくなります。</figcaption>
        </figure>
      </section>
    </div>
  `;
}

function buildLineStampStepsHtml() {
  const steps = [
    ["Gemで条件を答える", "スタンプ代、よく使う場面、作りたい雰囲気、ツール経験、公開範囲を入力します。検証では「家族用の日常あいさつ」「手書き風のシュールな猫」「AI未経験」「非公開」で進めました。"],
    ["8個の案に絞る", "Gemが出した案から、毎日使う言葉だけ残します。今回は「おはよ」「りょ」「いまから帰る」「おつかれさま」「ごはん何？」「ありがとう」「ごめん…」「おやすみ」の8個です。"],
    ["画像生成AIで絵だけ作る", "白背景、ゆるい手書き風、文字なしで猫の絵を作ります。文字までAIに入れると崩れやすいので、絵と文字を分けるのがコツです。"],
    ["Canvaで文字を入れる", "370 x 320 pxのキャンバスに画像を置き、手書き風フォントで文字を入れます。ダークモードでも読めるように、白い縁取りをつけます。"],
    ["LINE Stamp Makerで申請する", "8枚をアップロードし、家族用ならショップ非公開・無料ダウンロード設定で申請します。検証では申請まで完了し、審査待ちの状態まで進みました。"]
  ];

  return `
    <div class="line-step-list">
      ${steps.map(([title, body], index) => `
        <article class="line-step">
          <span>${index + 1}</span>
          <div>
            <h4>${escapeHtml(title)}</h4>
            <p>${escapeHtml(body)}</p>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function buildRecipeSteps(item) {
  if (Array.isArray(item.articleSteps) && item.articleSteps.length) {
    return item.articleSteps;
  }

  const steps = [];
  if (getPrimaryUrl(item)) {
    steps.push("完成物を先に開いて、どんな画面・返答・入力欄があるかを確認します。ここでゴールを見てから作り始めます。");
  }
  steps.push(`最初は「${inferFirstAsk(item)}」くらいの短い一言でAIに相談します。きれいなプロンプトから始めなくて大丈夫です。`);
  steps.push(`次に条件を足します。例: ${inferConditions(item).join(" / ")}。条件を足すほど、自分の生活に合った返答になります。`);
  steps.push("最後に出力形式を指定します。「比較表」「チェックリスト」「一問一答」「今日やること3つ」のように、見て動ける形にします。");
  if (getUsablePrompt(item)) {
    steps.push("下のプロンプトをコピーし、サービス名・金額・学年・家族構成など、自分に関係する部分だけ置き換えます。");
  } else {
    steps.push("プロンプト本文がない事例は、上の流れを使って「目的」「条件」「出力形式」の3点から自分で組み立てます。");
  }
  steps.push("試してズレたら「もっと短く」「子ども向けに」「月額で比較して」など、1つずつ言い直します。ズレを直すところまでが練習です。");
  return steps;
}

function inferFirstAsk(item) {
  const text = `${item.title || ""} ${item.category || ""}`;
  if (/サブスク/.test(text)) return "今払っているサブスクを整理して、やめられそうなものを教えて";
  if (/食費|日用品|献立|家計/.test(text)) return "今あるものだけで、無駄なく節約できる方法を考えて";
  if (/保険|通信|Wi-Fi|スマホ/.test(text)) return "今の固定費が高すぎないか、見直すポイントを教えて";
  if (/塾|家庭教師|学習|英語|宿題/.test(text)) return "家でできる学習サポートをAIで作りたい";
  if (/税金|確定申告/.test(text)) return "申告前に確認すべきことを、初心者にも分かるように整理して";
  return `${item.title}を自分でも作れるように手順を教えて`;
}

function inferConditions(item) {
  const text = `${item.title || ""} ${item.category || ""}`;
  const conditions = [];
  if (item.saving) conditions.push(`削減目安は${item.saving}`);
  if (/サブスク/.test(text)) conditions.push("月額と利用頻度を入れる", "継続・解約候補・保留に分ける");
  else if (/食費|日用品|献立|家計/.test(text)) conditions.push("家にあるものを入れる", "買い足しを減らす", "続けられる案にする");
  else if (/保険|通信|Wi-Fi|スマホ/.test(text)) conditions.push("今の契約内容を入れる", "安さだけで判断しない", "確認リストを出す");
  else if (/塾|家庭教師|学習|英語|宿題/.test(text)) conditions.push("学年やレベルを入れる", "親が教えなくても確認できる形にする");
  else conditions.push("今の状況を入れる", "困っていることを書く", "次にやることを出してもらう");
  return conditions.slice(0, 4);
}

function getPrimaryUrl(item) {
  return item.gemUrl || item.sourceUrl || item.media || "";
}

function getUsablePrompt(item) {
  const raw = String(item.articlePrompt || item.prompt || "").trim();
  if (!raw) return "";
  const useless = [
    /^GemのURLを共有しました$/i,
    /^内容はページまたはZipファイル内に記載/i,
    /^共有URL/i
  ];
  if (useless.some((pattern) => pattern.test(raw))) return "";
  if (raw.length < 18) return "";
  return raw;
}

function splitText(text) {
  return String(text || "")
    .split(/\n{2,}|\n/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function initFromUrl() {
  const params = new URLSearchParams(location.search);
  const caseId = params.get("case");
  const item = CASES.find((entry) => entry.id === caseId);
  if (item) selectCase(item.id, false);
}

function formatTextWithBreaks(value) {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

function formatSavingText(value) {
  const text = String(value || "");
  const markerIndex = text.search(/[※（(]/);
  if (markerIndex <= 0) return escapeHtml(text);
  const amount = text.slice(0, markerIndex).trim();
  const note = text.slice(markerIndex).trim();
  return `${escapeHtml(amount)}<small class="saving-note">${escapeHtml(note)}</small>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

init();
