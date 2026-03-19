// ===== 設定ファイル =====
// Googleフォーム連携時はここのURLとフィールドIDを書き換えるだけでOK

const CONFIG = {
  // スプレッドシート公開CSV URL
  CSV_URL: "https://docs.google.com/spreadsheets/d/1JMbIStrvY4UpgRGK-MyhZ7oWvWM1rKSO6vtQiFbEW4E/gviz/tq?tqx=out:csv&gid=0",

  // GAS いいね集計 Web App URL（gas_likes.js をデプロイ後に入力）
  GAS_LIKES_URL: "https://script.google.com/macros/s/AKfycbz7ejh14Jy0aotTZ0Ot3llKS5Wx7VDZG51zVYwaXGFaKJ2eW79Y3vJP8_TW7-7_1_9j3g/exec",

  // GoogleフォームのベースURL
  FORM_BASE_URL: "https://docs.google.com/forms/d/e/1FAIpQLSdGwLYspsO4hZfO5kjZUt0VfnS1xrokFFuEas01p6U88q5jpg/viewform",

  // フォームのフィールドID（本番時に差し替え）
  FORM_FIELDS: {
    tool:  "entry.1501532013",
    genre: "entry.114612757",
  },

  // スプレッドシートのヘッダー名の先頭一致で列を特定する
  // （フォームの質問文の最初の数文字を書けばOK）
  CSV_COLUMNS: {
    tool:   "AIツール",
    genre:  "節約ジャンル",
    level:  "難易度",
    title:  "タイトル",
    detail: "節約術の詳細",
    saving: "削減額",
    author:    "投稿者名",
    media:     "実例の画像や動画",
    x_account: "Xアカウント",
  },

  // 難易度レベル一覧
  LEVELS: [
    { id: "beginner", label: "初級",  icon: "🟢", desc: "コピペOK" },
    { id: "middle",   label: "中級",  icon: "🟡", desc: "カスタマイズ" },
    { id: "advanced", label: "上級",  icon: "🔴", desc: "プロンプト設計" },
  ],

  // AIツール一覧
  TOOLS: [
    { id: "chatgpt",    label: "ChatGPT",    icon: "🟢", color: "#10a37f" },
    { id: "claude",     label: "Claude",     icon: "🟠", color: "#d97706" },
    { id: "gemini",     label: "Gemini",     icon: "🔵", color: "#4285f4" },
    { id: "manus",      label: "Manus",      icon: "🔴", color: "#e53e3e" },
    { id: "other",      label: "その他",     icon: "⚪", color: "#6b7280" },
  ],

  // 節約ジャンル一覧
  GENRES: [
    { id: "education", label: "学習・教育費",   icon: "🎓" },
    { id: "outsource", label: "仕事・外注費",   icon: "💼" },
    { id: "creative",  label: "クリエイティブ", icon: "🎨" },
    { id: "living",    label: "生活・固定費",   icon: "🏠" },
    { id: "money",     label: "マネー・税務",   icon: "💰" },
    { id: "health",    label: "健康・メンタル", icon: "💪" },
    { id: "lifestyle", label: "暮らしサービス", icon: "🎒" },
  ],
};
