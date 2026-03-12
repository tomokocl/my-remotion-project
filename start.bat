@echo off
cd /d C:\Users\mtnnk\my-remotion-project
echo 最新版を取得中...
git pull origin claude/note-to-file-converter-a1E9M
echo パッケージをインストール中...
npm install
echo サーバーを起動中...
start http://localhost:4000
node server.mjs
pause
