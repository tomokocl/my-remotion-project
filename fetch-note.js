#!/usr/bin/env node
/**
 * note.com記事をテキストファイルに変換するスクリプト
 * 使い方: node fetch-note.js <URL> [cookies.json]
 *
 * 例:
 *   node fetch-note.js "https://note.com/simple_sunao/n/n064f2f38edfa?magazine_key=m6bc43d92a308" note-cookies.json
 */

const https = require("https");
const fs = require("fs");
const url = require("url");

const NOTE_URL = process.argv[2];
const COOKIE_FILE = process.argv[3] || "note-cookies.json";

if (!NOTE_URL) {
  console.error("使い方: node fetch-note.js <URL> [cookies.json]");
  process.exit(1);
}

// クッキーJSONを読み込む
let cookieHeader = "";
if (fs.existsSync(COOKIE_FILE)) {
  const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE, "utf-8"));
  cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  console.log(`クッキー読み込み: ${COOKIE_FILE}`);
} else {
  console.warn(`警告: ${COOKIE_FILE} が見つかりません。ログインなしで取得します。`);
}

const parsed = new url.URL(NOTE_URL);

const options = {
  hostname: parsed.hostname,
  path: parsed.pathname + parsed.search,
  method: "GET",
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml",
    "Accept-Language": "ja,en;q=0.9",
    Cookie: cookieHeader,
  },
};

console.log(`取得中: ${NOTE_URL}`);

const req = https.get(options, (res) => {
  let body = "";
  res.on("data", (chunk) => (body += chunk));
  res.on("end", () => {
    // JSON-LD から記事データを抽出
    const jsonLdMatch = body.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
    );

    // タイトル抽出
    const titleMatch = body.match(/<title[^>]*>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(" | note", "").trim() : "note記事";

    // 本文抽出（note.comのコンテンツ構造に対応）
    let content = "";

    // p タグのテキストを収集
    const paragraphs = [];
    const pMatches = body.matchAll(/<p[^>]*class="[^"]*note-common-styles__textnote[^"]*"[^>]*>([\s\S]*?)<\/p>/g);
    for (const m of pMatches) {
      const text = m[1].replace(/<[^>]+>/g, "").trim();
      if (text) paragraphs.push(text);
    }

    // フォールバック: 全pタグ
    if (paragraphs.length === 0) {
      const allP = body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g);
      for (const m of allP) {
        const text = m[1].replace(/<[^>]+>/g, "").trim();
        if (text && text.length > 20) paragraphs.push(text);
      }
    }

    content = paragraphs.join("\n\n");

    if (!content) {
      content = "(本文を取得できませんでした。有料記事の場合はクッキーが必要です。)";
    }

    const output = `# ${title}\n\nURL: ${NOTE_URL}\n\n---\n\n${content}\n`;

    // ファイル名を生成
    const noteId = parsed.pathname.split("/").pop();
    const outFile = `note-${noteId}.txt`;
    fs.writeFileSync(outFile, output, "utf-8");
    console.log(`保存完了: ${outFile}`);
    console.log(`文字数: ${content.length}`);
  });
});

req.on("error", (e) => {
  console.error("エラー:", e.message);
});
