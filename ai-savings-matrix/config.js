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
    { id: "chatgpt",    label: "ChatGPT",    icon: `<svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 24 24" fill="#10a37f"><path d="M22.28 9.29a5.44 5.44 0 0 0-.46-4.48 5.5 5.5 0 0 0-5.92-2.64 5.46 5.46 0 0 0-4.1-1.84 5.5 5.5 0 0 0-5.24 3.81 5.46 5.46 0 0 0-3.64 2.64 5.5 5.5 0 0 0 .68 6.46 5.44 5.44 0 0 0 .46 4.48 5.5 5.5 0 0 0 5.92 2.64 5.46 5.46 0 0 0 4.1 1.84 5.5 5.5 0 0 0 5.25-3.82 5.46 5.46 0 0 0 3.63-2.63 5.5 5.5 0 0 0-.68-6.46zm-8.48 11.47a4.07 4.07 0 0 1-2.61-.95l.13-.07 4.33-2.5a.72.72 0 0 0 .36-.62v-6.1l1.83 1.06a.07.07 0 0 1 .04.05v5.06a4.09 4.09 0 0 1-4.08 4.07zM4.24 17.64a4.07 4.07 0 0 1-.49-2.74l.13.08 4.33 2.5a.71.71 0 0 0 .72 0l5.29-3.05v2.12a.07.07 0 0 1-.03.06L9.66 19.1a4.09 4.09 0 0 1-5.42-1.46zM3.1 8.15a4.07 4.07 0 0 1 2.13-1.79v5.15a.71.71 0 0 0 .36.62l5.28 3.05-1.83 1.06a.07.07 0 0 1-.07 0L4.56 13.2A4.09 4.09 0 0 1 3.1 8.15zm15.1 3.51-5.29-3.06 1.83-1.05a.07.07 0 0 1 .07 0l4.41 2.55a4.08 4.08 0 0 1-.63 7.36v-5.15a.72.72 0 0 0-.38-.65zm1.82-2.76-.13-.08-4.32-2.51a.71.71 0 0 0-.72 0L9.56 9.36V7.24a.07.07 0 0 1 .03-.06l4.51-2.6a4.08 4.08 0 0 1 6.07 4.23h-.15zm-11.46 3.77-1.83-1.06a.07.07 0 0 1-.04-.05V6.5a4.08 4.08 0 0 1 6.7-3.13l-.13.07-4.33 2.5a.72.72 0 0 0-.36.62l-.01 6.11zm1-2.15 2.35-1.36 2.35 1.36v2.71l-2.35 1.35-2.35-1.35V10.52z"/></svg>`, color: "#10a37f" },
    { id: "claude",     label: "Claude",     icon: `<svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 24 24" fill="#d97706"><path d="M4.53 21 12 3l7.47 18h-3.21l-1.55-3.96H9.29L7.74 21H4.53zm5.77-6.44h3.4L12 10.37l-1.7 4.19z"/></svg>`, color: "#d97706" },
    { id: "gemini",     label: "Gemini",     icon: `<svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 24 24" fill="#4285f4"><path d="M12 2C10.34 7.17 7.17 10.34 2 12c5.17 1.66 8.34 4.83 10 10 1.66-5.17 4.83-8.34 10-10C16.83 10.34 13.66 7.17 12 2z"/></svg>`, color: "#4285f4" },
    { id: "manus",      label: "Manus",      icon: `<svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 24 24" fill="#e53e3e"><path d="M3 21V7l9-4 9 4v14h-5v-7h-8v7H3zm7 0v-5h4v5h-4z"/></svg>`, color: "#e53e3e" },
    { id: "other",      label: "その他",     icon: `<svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 24 24" fill="#6b7280"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>`, color: "#6b7280" },
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
