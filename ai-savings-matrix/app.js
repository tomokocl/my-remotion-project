// ===== ダミーデータ =====
const DUMMY_POSTS = [
  {
    tool: "chatgpt", genre: "juku", level: "beginner",
    title: "中学受験の過去問解説をChatGPTに丸投げ",
    detail: "塾の月謝2万円を節約。苦手な算数の解説を毎日質問して、3ヶ月で志望校レベルに到達。",
    saving: "月2万円削減",
    author: "Tさん（40代・主婦）",
  },
  {
    tool: "chatgpt", genre: "juku", level: "beginner",
    title: "高校英語の予習をChatGPTで完結",
    detail: "英語塾を解約。文法質問・英作文添削をAIで代替。模試の偏差値は維持できています。",
    saving: "月1.5万円削減",
    author: "Kさん（高2保護者）",
  },
  {
    tool: "claude", genre: "subscribe", level: "beginner",
    title: "全サブスクをリスト化してClaude分析",
    detail: "「使ってないサービス教えて」と聞いたら5つ見つかった。年間で計算したら驚きの金額に。",
    saving: "年間6万円削減",
    author: "Mさん（30代・会社員）",
  },
  {
    tool: "gemini", genre: "insurance", level: "middle",
    title: "Geminiで保険の見直しシミュレーション",
    detail: "複数の保険証券をテキスト入力して比較。不要な特約を発見し解約へ。担当者より詳しく教えてくれた。",
    saving: "月8,000円削減",
    author: "Sさん（50代・自営業）",
  },
  {
    tool: "chatgpt", genre: "food", level: "beginner",
    title: "冷蔵庫の食材でレシピ提案",
    detail: "余り物食材を入力するだけで夕食メニューが決まる。食品ロスが減り食費が激減した。",
    saving: "月3,000円削減",
    author: "Yさん（20代・一人暮らし）",
  },
  {
    tool: "manus", genre: "food", level: "beginner",
    title: "業務スーパー活用術をManusで調査",
    detail: "Manusで「コスパ最強の業務スーパー商品」を徹底リサーチ。購入リストを最適化できた。",
    saving: "月5,000円削減",
    author: "Hさん（40代・4人家族）",
  },
  {
    tool: "claude", genre: "learning", level: "middle",
    title: "資格勉強の教材費をゼロに",
    detail: "FP2級の参考書を買わずにClaude相手に問答形式で勉強。1発合格できた。",
    saving: "教材費3万円削減",
    author: "Nさん（30代・転職活動中）",
  },
  {
    tool: "chatgpt", genre: "tax", level: "middle",
    title: "確定申告の疑問をChatGPTで解決",
    detail: "税理士に頼まず副業の確定申告を自力で完成。不明な経費項目も全部聞けた。",
    saving: "税理士費用5万円削減",
    author: "Rさん（副業ライター）",
  },
  {
    tool: "claude", genre: "insurance", level: "beginner",
    title: "格安SIMへの乗り換えシミュレーション",
    detail: "今の通信費と比較してClaude試算。家族4人分の最安プランを提案してもらい即乗り換え。",
    saving: "月1.2万円削減",
    author: "Oさん（30代・夫婦2人）",
  },
  {
    tool: "other", genre: "learning", level: "middle",
    title: "Copilotで英語学習コストを大幅削減",
    detail: "英会話スクールを退会しAIと毎日フリートーク。TOEIC点数は上がって費用は激減。",
    saving: "月2万円削減",
    author: "Aさん（20代・就活中）",
  },
];

// ===== キャラクター育成 =====
const LEVELS = [
  { level: 1, name: "たまご",      emoji: "🥚", minScore: 0    },
  { level: 2, name: "ひよこ",      emoji: "🐣", minScore: 30   },
  { level: 3, name: "こども",      emoji: "🐥", minScore: 100  },
  { level: 4, name: "わかば",      emoji: "🌱", minScore: 300  },
  { level: 5, name: "せいちょう",  emoji: "🌿", minScore: 700  },
  { level: 6, name: "まんかい",    emoji: "🌳", minScore: 1500 },
];

function calcCharacterScore() {
  const postScore  = posts.length * 10;
  const likeScore  = Object.values(likeCountCache).reduce((a, b) => a + b, 0) * 5;
  const shareScore = Object.values(shareCountCache).reduce((a, b) => a + b, 0) * 3;
  return postScore + likeScore + shareScore;
}

function getCharacterData(score) {
  let current = LEVELS[0], next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (score >= LEVELS[i].minScore) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
      break;
    }
  }
  const progress = next
    ? Math.min(100, Math.round((score - current.minScore) / (next.minScore - current.minScore) * 100))
    : 100;
  return { current, next, score, progress };
}

function renderCharacterWidget() {
  const el = document.getElementById("character-widget");
  if (!el) return;
  const score = calcCharacterScore();
  const { current, progress } = getCharacterData(score);
  el.innerHTML = `
    <span class="char-emoji">${current.emoji}</span>
    <div class="char-info">
      <span class="char-name">${current.name}</span>
      <div class="char-bar-wrap"><div class="char-bar" style="width:${progress}%"></div></div>
    </div>
    <span class="char-lv">Lv.${current.level}</span>
  `;
  el.onclick = openCharacterCard;
  checkLevelUp(current.level);
}

function openCharacterCard() {
  renderCharacterWidget(); // ウィジェットとカードを常に同じデータで描画
  const score = calcCharacterScore();
  const { current, next, progress } = getCharacterData(score);
  const totalLikes  = Object.values(likeCountCache).reduce((a, b) => a + b, 0);
  const totalShares = Object.values(shareCountCache).reduce((a, b) => a + b, 0);

  document.getElementById("cc-emoji").textContent  = current.emoji;
  document.getElementById("cc-name").textContent   = current.name;
  document.getElementById("cc-level").textContent  = `Lv.${current.level}`;
  document.getElementById("cc-score").textContent  = score;
  document.getElementById("cc-bar").style.width    = progress + "%";
  document.getElementById("cc-next").textContent   = next
    ? `次の進化まで ${next.minScore - score}pt`
    : "🎊 最終進化達成！";
  document.getElementById("cc-posts").textContent  = posts.length;
  document.getElementById("cc-likes").textContent  = totalLikes;
  document.getElementById("cc-shares").textContent = totalShares;

  document.getElementById("char-card-overlay").classList.add("open");
}

function checkLevelUp(currentLevel) {
  const stored = localStorage.getItem("ai-savings-char-level");
  if (stored !== null) {
    const lastLevel = parseInt(stored, 10);
    if (currentLevel > lastLevel) {
      localStorage.setItem("ai-savings-char-level", currentLevel);
      setTimeout(() => showLevelUpPopup(lastLevel, currentLevel), 400);
      return;
    }
  }
  localStorage.setItem("ai-savings-char-level", currentLevel);
}

function showLevelUpPopup(oldLevel, newLevel) {
  const oldChar = LEVELS[oldLevel - 1];
  const newChar = LEVELS[newLevel - 1];
  document.getElementById("lu-old-emoji").textContent = oldChar.emoji;
  document.getElementById("lu-new-emoji").textContent = newChar.emoji;
  document.getElementById("lu-new-name").textContent  = newChar.name;
  document.getElementById("lu-new-level").textContent = `Lv.${newChar.level}`;
  document.getElementById("levelup-overlay").classList.add("open");
}

// ===== 状態管理 =====
let posts = [];
let currentCell = null; // { mode, tool?, genre, level? } クリック中のセル
let currentView = "level"; // "level" | "tool"

// ===== データ読み込み =====
async function loadData() {
  if (CONFIG.CSV_URL) {
    try {
      const url = CONFIG.CSV_URL + "&t=" + Date.now(); // キャッシュバスター
      const res = await fetch(url);
      const csv = await res.text();
      console.log("=== CSV取得成功 ===");
      console.log("先頭200文字:", csv.slice(0, 200));
      posts = parseCSV(csv);
      console.log("パース結果:", posts);
    } catch (e) {
      console.warn("CSV読み込み失敗。ダミーデータを使用します。", e);
      posts = DUMMY_POSTS;
    }
  } else {
    posts = DUMMY_POSTS;
  }
}

// RFC 4180準拠のCSVパーサー（ダブルクォート・改行対応）
function splitCSVRows(csv) {
  const rows = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (inQuote) {
      if (ch === '"' && csv[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQuote = false; }
      else { cur += ch; }
    } else {
      if (ch === '"') { inQuote = true; }
      else if (ch === '\n' || (ch === '\r' && csv[i + 1] === '\n')) {
        rows.push(cur);
        cur = "";
        if (ch === '\r') i++;
      } else { cur += ch; }
    }
  }
  if (cur) rows.push(cur);
  return rows;
}

function splitCSVFields(line) {
  const fields = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQuote = false; }
      else { cur += ch; }
    } else {
      if (ch === '"') { inQuote = true; }
      else if (ch === ',') { fields.push(cur.trim()); cur = ""; }
      else { cur += ch; }
    }
  }
  fields.push(cur.trim());
  return fields;
}

function parseCSV(csv) {
  const lines = splitCSVRows(csv.trim());
  const rawHeaders = splitCSVFields(lines[0]);

  // CSVヘッダーとconfig.CSV_COLUMNSを部分一致で対応付け
  const colIndex = {}; // internalKey → 列インデックス
  rawHeaders.forEach((h, i) => {
    for (const [key, prefix] of Object.entries(CONFIG.CSV_COLUMNS)) {
      if (h.includes(prefix)) colIndex[key] = i;
    }
  });

  const getVal = (values, key) =>
    colIndex[key] !== undefined
      ? (values[colIndex[key]] || "").trim()
      : "";

  return lines.slice(1).map(line => {
    const values = splitCSVFields(line);

    const rawTool  = getVal(values, "tool");
    const rawGenre = getVal(values, "genre");

    // 「その他: Copilot」形式を分解
    const otherMatch = rawTool.match(/^その他[:：]\s*(.+)$/);
    const toolOther  = otherMatch ? otherMatch[1].trim() : "";
    const toolSearch = otherMatch ? "その他" : rawTool;

    // ツール名（ラベルorID）→ id に正規化
    const toolObj = CONFIG.TOOLS.find(t =>
      t.label.toLowerCase() === toolSearch.toLowerCase() ||
      t.id    .toLowerCase() === toolSearch.toLowerCase()
    );

    // ジャンル名（ラベルorID）→ id に正規化
    const genreObj = CONFIG.GENRES.find(g =>
      g.label === rawGenre || g.id === rawGenre
    );

    // 難易度: 空の場合は "beginner" にデフォルト
    const rawLevel = getVal(values, "level");
    const levelObj = CONFIG.LEVELS.find(l =>
      l.label === rawLevel || l.id === rawLevel
    );
    const levelId = levelObj ? levelObj.id : (rawLevel ? rawLevel : "beginner");

    return {
      tool:       toolObj  ? toolObj.id  : rawTool.toLowerCase(),
      tool_other: toolOther,
      genre:      genreObj ? genreObj.id : rawGenre,
      level:      levelId,
      title:     getVal(values, "title"),
      detail:    getVal(values, "detail"),
      saving:    getVal(values, "saving"),
      author:    getVal(values, "author"),
      media:     getVal(values, "media"),
      x_account: normalizeXAccount(getVal(values, "x_account")),
    };
  }).filter(p => p.tool && p.genre);
}

// ===== 投稿フィルタ =====
function getPostsFor(toolId, genreId) {
  return posts.filter(p => p.tool === toolId && p.genre === genreId);
}

function getPostsForLevel(genreId, levelId) {
  return posts.filter(p => p.genre === genreId && (p.level === levelId));
}

// ===== カテゴリー×難易度 マトリックス描画 =====
function renderLevelMatrix() {
  const header = document.getElementById("matrix-level-header");
  const body   = document.getElementById("matrix-level-body");

  // ヘッダー行に難易度を追加
  CONFIG.LEVELS.forEach(lv => {
    const th = document.createElement("th");
    th.className = "genre-th";
    th.innerHTML = `<div class="genre-th-inner"><span class="genre-icon">${lv.icon}</span><span>${lv.label}</span><span class="level-desc">${lv.desc}</span></div>`;
    header.appendChild(th);
  });

  // 各ジャンル行
  CONFIG.GENRES.forEach(genre => {
    const tr = document.createElement("tr");

    // ジャンル名セル（行ヘッダー）
    const genreTh = document.createElement("th");
    genreTh.className = "tool-th";
    genreTh.innerHTML = `<div class="tool-th-inner"><span class="genre-icon">${genre.icon}</span> ${genre.label}</div>`;
    tr.appendChild(genreTh);

    // 各難易度セル
    CONFIG.LEVELS.forEach(level => {
      const cellPosts = getPostsForLevel(genre.id, level.id);
      const td = document.createElement("td");
      td.className = "matrix-cell " + (cellPosts.length > 0 ? "filled" : "empty");

      if (cellPosts.length > 0) {
        td.innerHTML = `
          <div class="cell-inner">
            <span class="cell-check">✅</span>
            <span class="cell-count">${cellPosts.length}件</span>
            <span class="cell-preview">${cellPosts[0].title}</span>
          </div>`;
      } else {
        td.innerHTML = `
          <div class="cell-inner">
            <span class="cell-plus">＋</span>
            <span class="cell-new-label">投稿する</span>
          </div>`;
      }

      td.addEventListener("click", () => openModalByLevel(genre, level, cellPosts));
      tr.appendChild(td);
    });

    body.appendChild(tr);
  });
}

// ===== ドッグイヤー切り替え =====
function switchMatrixPanel(showEl, hideEl) {
  hideEl.style.transition = "opacity 0.2s ease, transform 0.2s ease";
  hideEl.style.opacity = "0";
  hideEl.style.transform = "translateY(-6px)";
  setTimeout(() => {
    hideEl.style.display = "none";
    showEl.style.opacity = "0";
    showEl.style.transform = "translateY(6px)";
    showEl.style.display = "block";
    requestAnimationFrame(() => {
      showEl.style.transition = "opacity 0.25s ease, transform 0.25s ease";
      showEl.style.opacity = "1";
      showEl.style.transform = "translateY(0)";
    });
  }, 200);
}

function toggleMatrixView() {
  const levelPanel = document.getElementById("view-level");
  const toolPanel  = document.getElementById("view-tool");
  const label = document.getElementById("dog-ear-label");
  const arrow = document.getElementById("dog-ear-arrow");
  const title = document.getElementById("matrix-view-title");
  const tab   = document.getElementById("dog-ear-tab");

  if (currentView === "level") {
    switchMatrixPanel(toolPanel, levelPanel);
    label.textContent = "カテゴリー別";
    arrow.textContent = "◀";
    title.textContent = "🤖 AIツール × 節約ジャンル";
    tab.classList.add("active");
    currentView = "tool";
  } else {
    switchMatrixPanel(levelPanel, toolPanel);
    label.textContent = "🔧 ツール別";
    arrow.textContent = "▶";
    title.textContent = "📊 節約カテゴリー × 難易度レベル";
    tab.classList.remove("active");
    currentView = "level";
  }
}

// ===== マトリックス描画 =====
function renderMatrix() {
  const header = document.getElementById("matrix-header");
  const body   = document.getElementById("matrix-body");

  // ヘッダー行にジャンルを追加
  CONFIG.GENRES.forEach(g => {
    const th = document.createElement("th");
    th.className = "genre-th";
    th.innerHTML = `<div class="genre-th-inner"><span class="genre-icon">${g.icon}</span><span>${g.label}</span></div>`;
    header.appendChild(th);
  });

  // 各ツール行
  CONFIG.TOOLS.forEach(tool => {
    const tr = document.createElement("tr");

    // ツール名セル
    const toolTh = document.createElement("th");
    toolTh.className = "tool-th";
    toolTh.innerHTML = `<div class="tool-th-inner"><span class="tool-dot" style="background:${tool.color}"></span>${tool.icon} ${tool.label}</div>`;
    tr.appendChild(toolTh);

    // 各ジャンルセル
    CONFIG.GENRES.forEach(genre => {
      const cellPosts = getPostsFor(tool.id, genre.id);
      const td = document.createElement("td");
      td.className = "matrix-cell " + (cellPosts.length > 0 ? "filled" : "empty");
      td.dataset.tool  = tool.id;
      td.dataset.genre = genre.id;

      if (cellPosts.length > 0) {
        td.innerHTML = `
          <div class="cell-inner">
            <span class="cell-check">✅</span>
            <span class="cell-count">${cellPosts.length}件</span>
            <span class="cell-preview">${cellPosts[0].title}</span>
          </div>`;
      } else {
        td.innerHTML = `
          <div class="cell-inner">
            <span class="cell-plus">＋</span>
            <span class="cell-new-label">投稿する</span>
          </div>`;
      }

      td.addEventListener("click", () => openModal(tool, genre, cellPosts));
      tr.appendChild(td);
    });

    body.appendChild(tr);
  });

  // 合計件数
  document.getElementById("total-count").textContent = posts.length;
}

// ===== モーダル =====
function openModal(tool, genre, cellPosts) {
  currentCell = { tool, genre };

  document.getElementById("modal-tool-badge").textContent  = `${tool.icon} ${tool.label}`;
  document.getElementById("modal-genre-badge").textContent = `${genre.icon} ${genre.label}`;
  document.getElementById("modal-title").textContent =
    `${tool.label} × ${genre.label} の実例`;

  const cardsEl = document.getElementById("modal-cards");
  const emptyEl = document.getElementById("modal-empty");
  cardsEl.innerHTML = "";

  if (cellPosts.length > 0) {
    emptyEl.style.display = "none";
    cellPosts.forEach(post => {
      const card = document.createElement("div");
      card.className = "post-card";
      card.innerHTML = `
        <span class="post-card-arrow">›</span>
        ${post.tool_other ? `<span class="post-card-tool-other">⚪ ${escHtml(post.tool_other)}</span>` : ""}
        <p class="post-card-title">${escHtml(post.title)}</p>
        <p class="post-card-detail">${escHtml(post.detail)}</p>
        ${post.saving ? `<span class="post-card-saving">💰 ${escHtml(post.saving)}</span>` : ""}
        ${post.author ? `<p class="post-card-detail" style="margin-top:6px;font-size:0.75rem;">— ${escHtml(post.author)}</p>` : ""}
        ${post.x_account ? `<p class="post-card-detail" style="margin-top:2px;font-size:0.75rem;"><a href="https://x.com/${escHtml(post.x_account)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">𝕏 @${escHtml(post.x_account)}</a></p>` : ""}
      `;
      card.addEventListener("click", () => openDetail(tool, genre, post));
      cardsEl.appendChild(card);
    });
  } else {
    emptyEl.style.display = "block";
  }

  showView("list");
  document.getElementById("modal-overlay").classList.add("open");
}

// ===== カテゴリー×難易度 モーダル =====
function openModalByLevel(genre, level, cellPosts) {
  currentCell = { mode: "level", genre, level };

  document.getElementById("modal-tool-badge").textContent  = `${level.icon} ${level.label}`;
  document.getElementById("modal-genre-badge").textContent = `${genre.icon} ${genre.label}`;
  document.getElementById("modal-title").textContent =
    `${genre.label} × ${level.label}（${level.desc}）の実例`;

  const cardsEl = document.getElementById("modal-cards");
  const emptyEl = document.getElementById("modal-empty");
  cardsEl.innerHTML = "";

  if (cellPosts.length > 0) {
    emptyEl.style.display = "none";
    cellPosts.forEach(post => {
      const toolObj = CONFIG.TOOLS.find(t => t.id === post.tool)
        || { icon: "⚪", label: "その他", id: "other", color: "#6b7280" };
      const card = document.createElement("div");
      card.className = "post-card";
      card.innerHTML = `
        <span class="post-card-arrow">›</span>
        <span class="post-card-tool-chip" style="background:${toolObj.color}22;color:${toolObj.color};border:1px solid ${toolObj.color}44">${toolObj.icon} ${post.tool_other || toolObj.label}</span>
        ${post.tool_other ? `<span class="post-card-tool-other">⚪ ${escHtml(post.tool_other)}</span>` : ""}
        <p class="post-card-title">${escHtml(post.title)}</p>
        <p class="post-card-detail">${escHtml(post.detail)}</p>
        ${post.saving ? `<span class="post-card-saving">💰 ${escHtml(post.saving)}</span>` : ""}
        ${post.author ? `<p class="post-card-detail" style="margin-top:6px;font-size:0.75rem;">— ${escHtml(post.author)}</p>` : ""}
        ${post.x_account ? `<p class="post-card-detail" style="margin-top:2px;font-size:0.75rem;"><a href="https://x.com/${escHtml(post.x_account)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">𝕏 @${escHtml(post.x_account)}</a></p>` : ""}
      `;
      card.addEventListener("click", () => openDetail(toolObj, genre, post));
      cardsEl.appendChild(card);
    });
  } else {
    emptyEl.style.display = "block";
  }

  showView("list");
  document.getElementById("modal-overlay").classList.add("open");
}

// ===== いいね / シェア =====
// countCache: { [postKey]: number } ページ読み込み時にGASから取得してキャッシュ
let likeCountCache = {};
let shareCountCache = {};

function getPostKey(post) {
  // タイトルだけだと同名投稿がキー衝突するため detail の先頭20字も混ぜる
  const detailSnippet = (post.detail || "").slice(0, 20).replace(/\s+/g, "");
  return `${post.tool}__${post.genre}__${post.title}__${detailSnippet}`.slice(0, 150);
}

// localStorage でこのブラウザがいいね済みか管理
function isLiked(key) {
  try {
    return JSON.parse(localStorage.getItem("ai-savings-liked-posts") || "{}")[key] === true;
  } catch { return false; }
}
function setLikedLocal(key, val) {
  try {
    const store = JSON.parse(localStorage.getItem("ai-savings-liked-posts") || "{}");
    store[key] = val;
    localStorage.setItem("ai-savings-liked-posts", JSON.stringify(store));
  } catch {}
}

// GAS から全カウントを取得（ページロード時に1回呼ぶ）
// share__ プレフィックスのキーはシェア数、それ以外はいいね数
async function loadLikeCounts() {
  if (!CONFIG.GAS_LIKES_URL) {
    renderCharacterWidget();
    return;
  }
  try {
    const res = await fetch(CONFIG.GAS_LIKES_URL + "?action=counts");
    const all = await res.json();
    likeCountCache = {};
    shareCountCache = {};
    for (const [k, v] of Object.entries(all)) {
      if (k.startsWith("share__")) shareCountCache[k] = v;
      else likeCountCache[k] = v;
    }
  } catch (e) {
    console.warn("いいね数の取得失敗:", e);
  }
  renderCharacterWidget();
}

function getShareKey(post) {
  return "share__" + getPostKey(post);
}

async function incrementShareCount(shareKey) {
  if (!CONFIG.GAS_LIKES_URL) return;
  shareCountCache[shareKey] = (shareCountCache[shareKey] || 0) + 1;
  const countEl = document.getElementById("share-count-num");
  if (countEl) countEl.textContent = shareCountCache[shareKey];
  renderCharacterWidget();
  await sendLikeToGAS(shareKey, "like");
}

// GAS にいいね/取り消しを送信し、返ってきたカウントでキャッシュ更新
async function sendLikeToGAS(key, action) {
  if (!CONFIG.GAS_LIKES_URL) return null;
  try {
    const url = `${CONFIG.GAS_LIKES_URL}?action=${action}&key=${encodeURIComponent(key)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (typeof data.count === "number") likeCountCache[key] = data.count;
    return data.count;
  } catch (e) {
    console.warn("いいね送信失敗:", e);
    return null;
  }
}

function renderLikeButton(key) {
  const liked = isLiked(key);
  const count = likeCountCache[key] || 0;
  const countHtml = CONFIG.GAS_LIKES_URL
    ? `<span class="like-count">${count}</span>`
    : "";
  return `<button class="btn-like${liked ? " liked" : ""}">
    <span class="like-heart">${liked ? "❤️" : "🤍"}</span> 参考になった！${countHtml}
  </button>`;
}

function openDetail(tool, genre, post) {
  // バッジ
  const toolLabel = (tool.id === "other" && post.tool_other)
    ? `⚪ ${post.tool_other}`
    : `${tool.icon} ${tool.label}`;
  const badgesEl = document.getElementById("detail-badges");
  badgesEl.innerHTML = `
    <span class="modal-tool-badge">${escHtml(toolLabel)}</span>
    <span class="modal-genre-badge">${escHtml(genre.icon)} ${escHtml(genre.label)}</span>
  `;

  // タイトル・本文
  document.getElementById("detail-title").textContent = post.title || "";
  document.getElementById("detail-body").textContent  = post.detail || "";

  // 節約額
  const savingEl = document.getElementById("detail-saving-row");
  savingEl.innerHTML = post.saving
    ? `<span class="detail-saving-badge">💰 ${escHtml(post.saving)}</span>`
    : "";

  // 投稿者
  document.getElementById("detail-author").textContent =
    post.author ? `— ${post.author}` : "";

  // X アカウント
  const xEl = document.getElementById("detail-x-account");
  if (xEl) {
    if (post.x_account) {
      xEl.innerHTML = `<a href="https://x.com/${escHtml(post.x_account)}" target="_blank" rel="noopener">𝕏 @${escHtml(post.x_account)}</a>`;
      xEl.style.display = "";
    } else {
      xEl.style.display = "none";
    }
  }

  // メディア（画像 / 動画 / Googleドライブ）
  const mediaEl = document.getElementById("detail-media-wrap");
  mediaEl.innerHTML = renderMedia(post.media || "");

  // いいねボタン
  const postKey = getPostKey(post);
  const reactionEl = document.getElementById("detail-reaction-row");
  reactionEl.innerHTML = renderLikeButton(postKey);
  reactionEl.querySelector(".btn-like").addEventListener("click", async function () {
    const nowLiked = !isLiked(postKey);
    // 楽観的UI更新（即時反映）
    setLikedLocal(postKey, nowLiked);
    const action = nowLiked ? "like" : "unlike";
    if (nowLiked) {
      likeCountCache[postKey] = (likeCountCache[postKey] || 0) + 1;
    } else {
      likeCountCache[postKey] = Math.max(0, (likeCountCache[postKey] || 1) - 1);
    }
    this.className = `btn-like${nowLiked ? " liked" : ""}`;
    const countHtml = CONFIG.GAS_LIKES_URL
      ? `<span class="like-count">${likeCountCache[postKey]}</span>` : "";
    this.innerHTML = `<span class="like-heart">${nowLiked ? "❤️" : "🤍"}</span> 参考になった！${countHtml}`;
    renderCharacterWidget();
    // GASに非同期送信（失敗してもUIはそのまま）
    await sendLikeToGAS(postKey, action);
  });

  // シェアボタン
  const shareEl = document.getElementById("detail-share-row");
  const shareKey = getShareKey(post);
  const shareCount = shareCountCache[shareKey] || 0;
  const shareText = `【AI節約術】${post.title}\n${post.saving ? post.saving + '削減 ' : ''}#SHIFTAI #AI節約術`;
  const shareUrl  = location.href;
  const tweetUrl  = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  shareEl.innerHTML = `
    <button class="btn-share-copy" id="btn-share-copy">🔗 URLをコピー</button>
    <a class="btn-share-x" href="${escHtml(tweetUrl)}" target="_blank" rel="noopener">𝕏 でシェア</a>
    ${CONFIG.GAS_LIKES_URL ? `<span class="share-count-badge">📤 <span id="share-count-num">${shareCount}</span>回シェア</span>` : ""}
  `;
  document.getElementById("btn-share-copy").addEventListener("click", async function () {
    navigator.clipboard.writeText(shareUrl).then(() => {
      this.textContent = "✅ コピーしました！";
      setTimeout(() => { this.textContent = "🔗 URLをコピー"; }, 2000);
    });
    await incrementShareCount(shareKey);
  });
  shareEl.querySelector(".btn-share-x").addEventListener("click", async function () {
    await incrementShareCount(shareKey);
  });

  showView("detail");
  document.getElementById("modal").scrollTop = 0;
}

function renderMedia(url) {
  if (!url) return "";

  // GoogleドライブのファイルIDを抽出（複数形式に対応）
  const driveId = extractDriveId(url);
  if (driveId) {
    // preview iframeで統一（画像・動画どちらも表示できる）
    return `<iframe src="https://drive.google.com/file/d/${driveId}/preview" allowfullscreen></iframe>`;
  }

  // 画像ファイル拡張子（直接URL）
  if (/\.(jpe?g|png|gif|webp)(\?|$)/i.test(url)) {
    return `<img src="${escHtml(url)}" alt="投稿画像" loading="lazy">`;
  }

  // 動画ファイル拡張子（直接URL）
  if (/\.(mp4|mov|webm)(\?|$)/i.test(url)) {
    return `<video src="${escHtml(url)}" controls playsinline></video>`;
  }

  return "";
}

function extractDriveId(url) {
  // 形式1: /file/d/ID/view または /file/d/ID/preview
  const m1 = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/);
  if (m1) return m1[1];

  // 形式2: open?id=ID
  const m2 = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (m2) return m2[1];

  // 形式3: uc?id=ID または uc?export=view&id=ID
  const m3 = url.match(/drive\.google\.com\/uc\?.*id=([^&]+)/);
  if (m3) return m3[1];

  return null;
}

function showView(name) {
  document.getElementById("modal-view-list").style.display   = name === "list"   ? "block" : "none";
  document.getElementById("modal-view-detail").style.display = name === "detail" ? "block" : "none";
}

function closeModal() {
  document.getElementById("modal-overlay").classList.remove("open");
  currentCell = null;
}

function buildFormUrl(tool, genre) {
  if (!CONFIG.FORM_BASE_URL) {
    alert("まだフォームURLが設定されていません（config.js を更新してください）");
    return null;
  }
  const params = new URLSearchParams({
    [CONFIG.FORM_FIELDS.tool]:  tool.label,
    [CONFIG.FORM_FIELDS.genre]: genre.label,
    usp: "pp_url",
  });
  return `${CONFIG.FORM_BASE_URL}?${params.toString()}`;
}

function handlePostButton() {
  if (!currentCell) return;
  if (currentCell.mode === "level") {
    if (!CONFIG.FORM_BASE_URL) {
      alert("まだフォームURLが設定されていません（config.js を更新してください）");
      return;
    }
    const params = new URLSearchParams({
      [CONFIG.FORM_FIELDS.genre]: currentCell.genre.label,
      usp: "pp_url",
    });
    window.open(`${CONFIG.FORM_BASE_URL}?${params.toString()}`, "_blank");
  } else {
    const url = buildFormUrl(currentCell.tool, currentCell.genre);
    if (url) window.open(url, "_blank");
  }
}

// X アカウント入力を正規化（URL・@付き・ユーザー名のどれでも受け付ける）
function normalizeXAccount(raw) {
  if (!raw) return "";
  // URL形式: https://x.com/foo または https://twitter.com/foo
  const m = raw.match(/(?:x\.com|twitter\.com)\/([A-Za-z0-9_]+)/);
  if (m) return m[1];
  // @付き
  if (raw.startsWith("@")) return raw.slice(1);
  return raw;
}

// ===== ユーティリティ =====
function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ===== イベントバインド =====
document.getElementById("char-card-overlay").addEventListener("click", e => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove("open");
});
document.getElementById("char-card-close").addEventListener("click", () => {
  document.getElementById("char-card-overlay").classList.remove("open");
});
document.getElementById("levelup-close").addEventListener("click", () => {
  document.getElementById("levelup-overlay").classList.remove("open");
});

document.getElementById("dog-ear-tab").addEventListener("click", toggleMatrixView);
document.getElementById("modal-close").addEventListener("click", closeModal);
document.getElementById("modal-overlay").addEventListener("click", e => {
  if (e.target === e.currentTarget) closeModal();
});
document.getElementById("btn-post-modal").addEventListener("click", handlePostButton);
document.getElementById("detail-back").addEventListener("click", () => {
  document.getElementById("modal").scrollTop = 0;
  showView("list");
});
document.getElementById("btn-post-top").addEventListener("click", () => {
  // ツール・ジャンル未選択状態でフォームを開く（本番時はフォームURLをそのまま開く）
  if (!CONFIG.FORM_BASE_URL) {
    alert("まだフォームURLが設定されていません（config.js を更新してください）");
    return;
  }
  window.open(CONFIG.FORM_BASE_URL, "_blank");
});

// ===== 初期化 =====
(async () => {
  await loadData();
  renderLevelMatrix(); // 1枚目: カテゴリー×難易度（デフォルト）
  renderMatrix();      // 2枚目: ツール×ジャンル
  renderCharacterWidget();
  loadLikeCounts();
})();
