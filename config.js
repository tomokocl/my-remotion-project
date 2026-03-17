// ===== 設定ファイル =====
// Googleフォーム連携時はここのURLとフィールドIDを書き換えるだけでOK

const CONFIG = {
  // スプレッドシート公開CSV URL（本番時に差し替え）
  CSV_URL: null, // "https://docs.google.com/spreadsheets/d/XXXXXX/export?format=csv&gid=0"

  // GoogleフォームのベースURL
  FORM_BASE_URL: "https://docs.google.com/forms/d/e/1FAIpQLSdGwLYspsO4hZfO5kjZUt0VfnS1xrokFFuEas01p6U88q5jpg/viewform",

  // フォームのフィールドID
  FORM_FIELDS: {
    tool:  "entry.1501532013",
    genre: "entry.114612757",
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
