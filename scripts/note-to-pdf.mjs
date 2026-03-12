#!/usr/bin/env node
/**
 * note-to-pdf: note.comの記事をPDFに変換するスクリプト
 *
 * 使い方:
 *   node scripts/note-to-pdf.mjs <URL> [オプション]
 *
 * オプション:
 *   --email <value>    note.comのメールアドレス（会員限定記事に必要）
 *   --password <value> note.comのパスワード（会員限定記事に必要）
 *   --output <path>    出力PDFのファイルパス（デフォルト: ./output.pdf）
 *   --wait <ms>        ページ読み込み後の待機時間ミリ秒（デフォルト: 3000）
 *
 * 例:
 *   node scripts/note-to-pdf.mjs https://note.com/xxx/n/yyy --output article.pdf
 *   node scripts/note-to-pdf.mjs https://note.com/xxx/n/yyy \
 *     --email you@example.com --password yourpassword --output article.pdf
 *
 * 環境変数でも指定できます:
 *   NOTE_EMAIL=you@example.com NOTE_PASSWORD=yourpassword \
 *     node scripts/note-to-pdf.mjs https://note.com/xxx/n/yyy
 */

import { chromium } from 'playwright-core';
import { existsSync } from 'fs';
import { resolve } from 'path';

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
  const args = {
    url: null,
    email: process.env.NOTE_EMAIL || null,
    password: process.env.NOTE_PASSWORD || null,
    output: './output.pdf',
    wait: 3000,
  };
  const rest = argv.slice(2);

  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--email' && rest[i + 1]) {
      args.email = rest[++i];
    } else if (rest[i] === '--password' && rest[i + 1]) {
      args.password = rest[++i];
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

async function login(page, email, password) {
  console.log('note.comにログイン中...');
  await page.goto('https://note.com/login', { waitUntil: 'networkidle', timeout: 30000 });

  // メールアドレスとパスワードを入力
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // ログイン完了を待機
  await page.waitForNavigation({ timeout: 15000 }).catch(() => {});

  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    throw new Error('ログインに失敗しました。メールアドレスとパスワードを確認してください。');
  }

  console.log('ログイン成功');
}

async function noteArticleToPdf({ url, email, password, output, wait }) {
  const chromePath = findChrome();
  if (!chromePath) {
    console.error('エラー: Chromiumが見つかりません。');
    console.error('インストール: npx playwright install chromium');
    process.exit(1);
  }

  console.log(`変換対象URL: ${url}`);
  console.log(`出力先: ${resolve(output)}`);

  const browser = await chromium.launch({
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1200, height: 900 },
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();

    // ログイン（認証情報が指定された場合）
    if (email && password) {
      await login(page, email, password);
    } else if (email || password) {
      console.warn('警告: --email と --password の両方を指定してください。');
    }

    console.log('ページを読み込み中...');
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

    // ページ読み込み後の待機（画像などの非同期読み込み対応）
    if (wait > 0) {
      console.log(`${wait}ms 待機中...`);
      await page.waitForTimeout(wait);
    }

    // ページタイトルを取得
    const title = await page.title();
    console.log(`ページタイトル: ${title}`);

    // 印刷用CSSを適用してPDF生成
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
  console.error('使い方: node scripts/note-to-pdf.mjs <URL> [--email <email>] [--password <pass>] [--output <path>]');
  console.error('');
  console.error('例:');
  console.error('  node scripts/note-to-pdf.mjs https://note.com/xxx/n/yyy');
  console.error('  node scripts/note-to-pdf.mjs https://note.com/xxx/n/yyy \\');
  console.error('    --email you@example.com --password yourpassword --output article.pdf');
  console.error('');
  console.error('環境変数でも指定できます:');
  console.error('  NOTE_EMAIL=you@example.com NOTE_PASSWORD=yourpassword \\');
  console.error('    node scripts/note-to-pdf.mjs https://note.com/xxx/n/yyy');
  process.exit(1);
}

noteArticleToPdf(args).catch((err) => {
  console.error('エラーが発生しました:', err.message);
  process.exit(1);
});
