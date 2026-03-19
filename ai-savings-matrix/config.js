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
    { id: "education", label: "学習・教育費",   icon: `<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 24 24" fill="#6366f1"><path d="M12 3 1 9l11 6 9-4.91V17h2V9L12 3zm0 12.08L5.08 11l-2.08 1.13V17c0 1.66 4 3 9 3s9-1.34 9-3v-4.87l-2 1.09-7 3.86z"/></svg>` },
    { id: "outsource", label: "仕事・外注費",   icon: `<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 24 24" fill="#6366f1"><path d="M20 6h-2.18A3 3 0 0 0 15 4h-6a3 3 0 0 0-2.82 2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm-11 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1H9V6zm11 14H4V8h16v12z"/></svg>` },
    { id: "creative",  label: "クリエイティブ", icon: `<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 24 24" fill="#6366f1"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm4-8.5a4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4 4 4 0 0 1 4 4zm-4-2a2 2 0 1 0 2 2 2 2 0 0 0-2-2z"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.64 5.64l2.12 2.12M16.24 16.24l2.12 2.12M5.64 18.36l2.12-2.12M16.24 7.76l2.12-2.12"/></svg>` },
    { id: "living",    label: "生活・固定費",   icon: `<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 24 24" fill="#6366f1"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>` },
    { id: "money",     label: "マネー・税務",   icon: `<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 24 24" fill="#6366f1"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>` },
    { id: "health",    label: "健康・メンタル", icon: `<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 24 24" fill="#6366f1"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>` },
    { id: "lifestyle", label: "暮らしサービス", icon: `<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 24 24" fill="#6366f1"><path d="M20 6h-2.18A3 3 0 0 0 15 4H9a3 3 0 0 0-2.82 2H4a2 2 0 0 0-2 2v3h20V8a2 2 0 0 0-2-2zm-11 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1H9zm13 5H2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-7zm-9 5H8v-2h5v2zm5-4h-5V10h5v2z"/></svg>` },
  ],
};
