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
    { id: "beginner", label: "初級",  icon: `<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.8" stroke-linejoin="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>`, desc: "コピペOK" },
    { id: "middle",   label: "中級",  icon: `<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.8" stroke-linejoin="round"><polygon points="12,3 13.5,8.3 18.4,5.6 15.7,10.5 21,12 15.7,13.5 18.4,18.4 13.5,15.7 12,21 10.5,15.7 5.6,18.4 8.3,13.5 3,12 8.3,10.5 5.6,5.6 10.5,8.3"/></svg>`, desc: "カスタマイズ" },
    { id: "advanced", label: "上級",  icon: `<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h10v4l-5 3-5-3V3z"/><line x1="10" y1="10" x2="9.5" y2="13"/><line x1="14" y1="10" x2="14.5" y2="13"/><polygon points="12,13 13.2,16.5 17,16.5 14,18.5 15.2,22 12,20 8.8,22 10,18.5 7,16.5 10.8,16.5"/></svg>`, desc: "プロンプト設計" },
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
