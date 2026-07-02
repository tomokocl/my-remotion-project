// ===== ダミーデータ =====
const DUMMY_POSTS = [
  {
    tool: "chatgpt", genre: "juku",
    title: "中学受験の過去問解説をChatGPTに丸投げ",
    detail: "塾の月謝2万円を節約。苦手な算数の解説を毎日質問して、3ヶ月で志望校レベルに到達。",
    saving: "月2万円削減",
    author: "Tさん（40代・主婦）",
  },
  {
    tool: "chatgpt", genre: "juku",
    title: "高校英語の予習をChatGPTで完結",
    detail: "英語塾を解約。文法質問・英作文添削をAIで代替。模試の偏差値は維持できています。",
    saving: "月1.5万円削減",
    author: "Kさん（高2保護者）",
  },
  {
    tool: "claude", genre: "subscribe",
    title: "全サブスクをリスト化してClaude分析",
    detail: "「使ってないサービス教えて」と聞いたら5つ見つかった。年間で計算したら驚きの金額に。",
    saving: "年間6万円削減",
    author: "Mさん（30代・会社員）",
  },
  {
    tool: "gemini", genre: "insurance",
    title: "Geminiで保険の見直しシミュレーション",
    detail: "複数の保険証券をテキスト入力して比較。不要な特約を発見し解約へ。担当者より詳しく教えてくれた。",
    saving: "月8,000円削減",
    author: "Sさん（50代・自営業）",
  },
  {
    tool: "chatgpt", genre: "food",
    title: "冷蔵庫の食材でレシピ提案",
    detail: "余り物食材を入力するだけで夕食メニューが決まる。食品ロスが減り食費が激減した。",
    saving: "月3,000円削減",
    author: "Yさん（20代・一人暮らし）",
  },
  {
    tool: "manus", genre: "food",
    title: "業務スーパー活用術をManusで調査",
    detail: "Manusで「コスパ最強の業務スーパー商品」を徹底リサーチ。購入リストを最適化できた。",
    saving: "月5,000円削減",
    author: "Hさん（40代・4人家族）",
  },
  {
    tool: "claude", genre: "learning",
    title: "資格勉強の教材費をゼロに",
    detail: "FP2級の参考書を買わずにClaude相手に問答形式で勉強。1発合格できた。",
    saving: "教材費3万円削減",
    author: "Nさん（30代・転職活動中）",
  },
  {
    tool: "chatgpt", genre: "tax",
    title: "確定申告の疑問をChatGPTで解決",
    detail: "税理士に頼まず副業の確定申告を自力で完成。不明な経費項目も全部聞けた。",
    saving: "税理士費用5万円削減",
    author: "Rさん（副業ライター）",
  },
  {
    tool: "claude", genre: "insurance",
    title: "格安SIMへの乗り換えシミュレーション",
    detail: "今の通信費と比較してClaude試算。家族4人分の最安プランを提案してもらい即乗り換え。",
    saving: "月1.2万円削減",
    author: "Oさん（30代・夫婦2人）",
  },
  {
    tool: "other", genre: "learning",
    title: "Copilotで英語学習コストを大幅削減",
    detail: "英会話スクールを退会しAIと毎日フリートーク。TOEIC点数は上がって費用は激減。",
    saving: "月2万円削減",
    author: "Aさん（20代・就活中）",
  },
];

// ===== 状態管理 =====
let posts = [];
let currentCell = null; // { tool, genre } クリック中のセル

// ===== データ読み込み =====
async function loadData() {
  if (CONFIG.CSV_URL) {
    try {
      const url = CONFIG.CSV_URL + "&t=" + Date.now(); // キャッシュバスター
      const res = await fetch(url);
      const csv = await res.text();
      posts = parseCSV(csv);
    } catch (e) {
      console.warn("CSV読み込み失敗。ダミーデータを使用します。", e);
      posts = DUMMY_POSTS;
    }
  } else {
    posts = DUMMY_POSTS;
  }
}

function parseCSV(csv) {
  const lines = csv.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map(line => {
    const cols = line.match(/(".*?"|[^,]+)/g) || [];
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (cols[i] || "").replace(/^"|"$/g, "").trim();
    });
    return obj;
  }).filter(p => p.tool && p.genre);
}

// ===== 投稿フィルタ =====
function getPostsFor(toolId, genreId) {
  return posts.filter(p => p.tool === toolId && p.genre === genreId);
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
        <p class="post-card-title">${escHtml(post.title)}</p>
        <p class="post-card-detail">${escHtml(post.detail)}</p>
        ${post.saving ? `<span class="post-card-saving">💰 ${escHtml(post.saving)}</span>` : ""}
        ${post.author ? `<p class="post-card-detail" style="margin-top:6px;font-size:0.75rem;">— ${escHtml(post.author)}</p>` : ""}
      `;
      cardsEl.appendChild(card);
    });
  } else {
    emptyEl.style.display = "block";
  }

  document.getElementById("modal-overlay").classList.add("open");
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
  const url = buildFormUrl(currentCell.tool, currentCell.genre);
  if (url) window.open(url, "_blank");
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
document.getElementById("modal-close").addEventListener("click", closeModal);
document.getElementById("modal-overlay").addEventListener("click", e => {
  if (e.target === e.currentTarget) closeModal();
});
document.getElementById("btn-post-modal").addEventListener("click", handlePostButton);
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
  renderMatrix();
})();
