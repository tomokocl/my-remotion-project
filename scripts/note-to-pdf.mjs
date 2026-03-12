#!/usr/bin/env node
/**
 * note-to-pdf: note.comの記事をPDFに変換するスクリプト
 *
 * 使い方:
 *   node scripts/note-to-pdf.mjs <URL> [オプション]
 *
 * オプション:
 *   --login            ブラウザを表示してログイン（会員限定記事に必要）
 *   --output <path>    出力PDFのファイルパス（デフォルト: ./output.pdf）
 *   --wait <ms>        ページ読み込み後の待機時間ミリ秒（デフォルト: 3000）
 *
 * 例:
 *   # 無料記事
 *   node scripts/note-to-pdf.mjs https://note.com/xxx/n/yyy
 *
 *   # 会員限定記事（ブラウザが開くのでログインしてEnterを押す）
 *   node scripts/note-to-pdf.mjs https://note.com/xxx/n/yyy --login
 */

import { chromium } from 'playwright-core';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { createInterface } from 'readline';

const CHROME_PATHS = [
  '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
];

function findChrome() {
  for (const p of CHROME_PATHS) {
    if (existsSync(p)) return p;
  }
  return null;
}

function parseArgs(argv) {
  const args = { url: null, login: false, output: './output.pdf', wait: 3000 };
  const rest = argv.slice(2);

  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--login') {
      args.login = true;
    } else if (rest[i] === '--output' && rest[i + 1]) {
      args.output = rest[++i];
    } else if (rest[i] === '--wait' && rest[i + 1]) {
      args.wait = parseInt(rest[++i], 10);
    } else if (!rest[i].startsWith('--') && !args.url) {
      args.url = rest[i];
    }
  }

  return args;
}

function waitForEnter(message) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(message, () => {
      rl.close();
      resolve();
    });
  });
}

async function noteArticleToPdf({ url, login, output, wait }) {
  const chromePath = findChrome();
  if (!chromePath) {
    console.error('エラー: Chromiumが見つかりません。');
    process.exit(1);
  }

  console.log(`変換対象URL: ${url}`);
  console.log(`出力先: ${resolve(output)}`);

  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: !login,  // --login のときだけブラウザを表示
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1200, height: 900 },
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();

    if (login) {
      // ログインページを開いてユーザーに手動ログインしてもらう
      console.log('ブラウザを開きました。note.comにログインしてください。');
      await page.goto('https://note.com/login', { waitUntil: 'networkidle', timeout: 30000 });

      await waitForEnter('ログインが完了したらEnterを押してください...');
      console.log('ログイン確認済み。記事を取得します。');
    }

    console.log('ページを読み込み中...');
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

    if (wait > 0) {
      console.log(`${wait}ms 待機中...`);
      await page.waitForTimeout(wait);
    }

    const title = await page.title();
    console.log(`ページタイトル: ${title}`);

    await page.addStyleTag({
      content: `
        @media print {
          header, nav, footer,
          [class*="header"], [class*="nav"], [class*="footer"],
          [class*="sidebar"], [class*="recommend"],
          [class*="modal"], [class*="toast"],
          [class*="banner"], [class*="ad"] {
            display: none !important;
          }
          body { font-size: 14px !important; }
          img { max-width: 100% !important; }
          a { text-decoration: none !important; color: inherit !important; }
        }
      `,
    });

    console.log('PDFを生成中...');
    await page.pdf({
      path: resolve(output),
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    });

    console.log(`完了: ${resolve(output)} に保存しました`);
  } finally {
    await browser.close();
  }
}

// メイン処理
const args = parseArgs(process.argv);

if (!args.url) {
  console.error('使い方: node scripts/note-to-pdf.mjs <URL> [--login] [--output <path>] [--wait <ms>]');
  console.error('');
  console.error('例:');
  console.error('  # 無料記事');
  console.error('  node scripts/note-to-pdf.mjs https://note.com/xxx/n/yyy');
  console.error('');
  console.error('  # 会員限定記事（ブラウザが開くのでログインしてEnterを押す）');
  console.error('  node scripts/note-to-pdf.mjs https://note.com/xxx/n/yyy --login --output article.pdf');
  process.exit(1);
}

noteArticleToPdf(args).catch((err) => {
  console.error('エラーが発生しました:', err.message);
  process.exit(1);
});
