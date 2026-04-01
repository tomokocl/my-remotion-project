# Google Calendar 一方向同期サービス — VPSデプロイ要件定義

## 概要

Google カレンダーのアカウントA（社内メイン）の予定を、アカウントB（個人・社外共有用）へリアルタイムで一方向同期するサービスをVPS上にデプロイする。
カレンダーBには「予定あり」とだけ表示され、予定の詳細は同期されない。

## 前提

- このリポジトリの `calendar-sync/` ディレクトリにソースコードがある
- Node.js + TypeScript + Express で構築済み
- Google Calendar API の Push Notification（Webhook）でリアルタイム同期する仕組み

## やってほしいこと

### 1. 環境構築

- Node.js（v20以上）がインストールされていることを確認、なければインストール
- `calendar-sync/` で `npm install` と `npm run build` を実行

### 2. リバースプロキシ設定（nginx）

- nginx でリバースプロキシを設定
- Google Calendar の Webhook を受けるため、HTTPS が必須
- Let's Encrypt (certbot) で SSL 証明書を取得
- ドメイン：（※ここに自分のドメインを入れる。例: `cal-sync.example.com`）
- `cal-sync.example.com` → `localhost:3000` にプロキシ

nginx設定の要件：
```
- /webhook/calendar へのPOSTを通す
- /health へのGETを通す（ヘルスチェック用）
- /sync, /sync/full へのPOSTはローカルからのみアクセス可能にする（外部からはブロック）
```

### 3. systemd サービス化

- `calendar-sync` を systemd サービスとして登録
- 自動起動（enable）
- 異常終了時に自動再起動（Restart=on-failure）
- 環境変数は `calendar-sync/.env` から読み込む
- ログは journalctl で確認できるようにする

systemd ユニットファイルの設置先: `/etc/systemd/system/calendar-sync.service`

### 4. .env の設定

`calendar-sync/.env.example` をコピーして `calendar-sync/.env` を作成。
以下の値を聞いて設定する：

| 変数名 | 説明 |
|--------|------|
| `GOOGLE_CLIENT_ID` | Google Cloud Console の OAuth2 クライアントID |
| `GOOGLE_CLIENT_SECRET` | OAuth2 クライアントシークレット |
| `ACCOUNT_A_REFRESH_TOKEN` | アカウントAの refresh token（setup スクリプトで取得済みのものを入力） |
| `ACCOUNT_B_REFRESH_TOKEN` | アカウントBの refresh token |
| `ACCOUNT_A_CALENDAR_ID` | 通常は `primary` でOK |
| `ACCOUNT_B_CALENDAR_ID` | 通常は `primary` でOK |
| `PORT` | `3000` |
| `WEBHOOK_BASE_URL` | `https://cal-sync.example.com`（nginx で設定したドメイン） |

### 5. 動作確認

以下を順番に確認する：

1. `systemctl status calendar-sync` でサービスが running であること
2. `curl http://localhost:3000/health` で `{"status":"ok","watching":true}` が返ること
3. `curl https://cal-sync.example.com/health` で外部からもアクセスできること
4. `journalctl -u calendar-sync -f` でログを確認し、Watch チャネルが正常に作成されていること
5. `curl -X POST http://localhost:3000/sync/full` で手動フル同期が成功すること

### 6. ログローテーション（任意）

journalctl のデフォルトで問題ないが、必要なら logrotate を設定。

## アーキテクチャ図

```
[Google Calendar A]
       │
       │ (イベント変更)
       ▼
[Google Push Notification]
       │
       │ POST /webhook/calendar
       ▼
[nginx (HTTPS)] → [Express :3000] → [Google Calendar API]
                                           │
                                           ▼
                                    [Google Calendar B]
                                    「予定あり」ブロック作成
```

## 注意事項

- **Cloudflare のプロキシ（オレンジ雲）は絶対に使わないこと。** Google Calendar の Webhook が Cloudflare の Bot 対策/WAF でブロックされる。DNS は「DNS only（グレー雲）」にするか、Cloudflare を経由しない構成にすること。SSL は nginx + Let's Encrypt で処理するので Cloudflare の SSL は不要。
- Webhook の受信には HTTPS が必須（Google の要件）
- Watch チャネルは約7日で期限切れになるが、サーバーが自動で更新する
- サーバーが落ちている間の変更は、再起動時の初期同期で拾われる
- `/sync/full` は既存の同期済みイベントを全削除してから再同期するので、普段は使わない
- `sync-state.json` に同期状態が保存される。これを消すとフル同期になる
