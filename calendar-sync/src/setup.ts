/**
 * Setup script: OAuth2 refresh token を取得するためのワンタイムスクリプト
 *
 * 使い方:
 *   1. .env に GOOGLE_CLIENT_ID と GOOGLE_CLIENT_SECRET を設定
 *   2. npm run setup を実行
 *   3. 表示されるURLをブラウザで開いてアカウントAでログイン → refresh token をコピー
 *   4. もう一度 npm run setup を実行してアカウントBでログイン → refresh token をコピー
 *   5. 取得した refresh token を .env の ACCOUNT_A_REFRESH_TOKEN, ACCOUNT_B_REFRESH_TOKEN に設定
 */

import express from "express";
import { config } from "./config";
import { getAuthUrl, getTokenFromCode } from "./auth";

const app = express();
const PORT = 3000;

const account = process.argv[2] || "A";

app.get("/oauth/callback", async (req, res) => {
  const code = req.query.code as string;
  if (!code) {
    res.status(400).send("No code provided");
    return;
  }

  try {
    const tokens = await getTokenFromCode(code);
    console.log("\n========================================");
    console.log(`アカウント${account}の Refresh Token:`);
    console.log(tokens.refresh_token);
    console.log("========================================");
    console.log(`\nこの値を .env の ACCOUNT_${account}_REFRESH_TOKEN に設定してください\n`);

    res.send(
      `<h1>認証成功！</h1><p>ターミナルに表示された Refresh Token を .env に設定してください。</p><p>このタブは閉じてOKです。</p>`
    );

    // Give time for the response to be sent
    setTimeout(() => process.exit(0), 1000);
  } catch (err: any) {
    console.error("Token取得エラー:", err.message);
    res.status(500).send("Token取得に失敗しました");
  }
});

app.listen(PORT, () => {
  const authUrl = getAuthUrl(account);
  console.log(`\n=== アカウント${account}のセットアップ ===`);
  console.log(`\n以下のURLをブラウザで開いて、アカウント${account}でGoogleにログインしてください:\n`);
  console.log(authUrl);
  console.log("\nログイン後、自動的にリダイレクトされます。\n");
});
