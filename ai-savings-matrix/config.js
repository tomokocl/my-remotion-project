// ===== 設定ファイル =====
// Googleフォーム連携時はここのURLとフィールドIDを書き換えるだけでOK

const CONFIG = {
  // スプレッドシート公開CSV URL
  CSV_URL: "https://docs.google.com/spreadsheets/d/1JMbIStrvY4UpgRGK-MyhZ7oWvWM1rKSO6vtQiFbEW4E/export?format=csv&gid=0",

  // GoogleフォームのベースURL
  FORM_BASE_URL: "https://docs.google.com/forms/d/19Zi3okQfsfAj_wNDtqgC5Rzh42eQBBXaVhYB_-XDkIQ/viewform",

  // フォームのフィールドID（本番時に差し替え）
  FORM_FIELDS: {
    tool:  "entry.000000001",
    genre: "entry.000000002",
  },

  // スプレッドシートのヘッダー名の先頭一致で列を特定する
  // （フォームの質問文の最初の数文字を書けばOK）
  CSV_COLUMNS: {
    tool:   "使ったAIツール",
    genre:  "節約ジャンル",
    title:  "タイトル",
    detail: "節約術の詳細",
    saving: "削減額",
    author: "投稿者名",
    media:  "実例の画像や動画",
  },

  // AIツール一覧
  TOOLS: [
    { id: "chatgpt",    label: "ChatGPT",    icon: "🟢", color: "#10a37f" },
    { id: "claude",     label: "Claude",     icon: "🟠", color: "#d97706" },
    { id: "gemini",     label: "Gemini",     icon: "🔵", color: "#4285f4" },
    { id: "perplexity", label: "Perplexity", icon: "🟣", color: "#7c3aed" },
    { id: "other",      label: "その他",     icon: "⚪", color: "#6b7280" },
  ],

  // 節約ジャンル一覧
  GENRES: [
    { id: "juku",      label: "塾・家庭教師", icon: "📚" },
    { id: "subscribe", label: "サブスク整理",  icon: "📱" },
    { id: "insurance", label: "保険・通信費",  icon: "🛡️" },
    { id: "food",      label: "食費・日用品",  icon: "🛒" },
    { id: "learning",  label: "自己学習",      icon: "🎓" },
    { id: "tax",       label: "税金・確定申告", icon: "📊" },
  ],
};
