#!/usr/bin/env node
/**
 * note-to-pdf: note.comの記事をPDFに変換するスクリプト
 *
 * 使い方:
 *   node scripts/note-to-pdf.mjs <URL> --cookies <cookieファイル> [オプション]
 *
 * オプション:
 *   --cookies <path>   Cookie Editorで書き出したJSONファイルのパス（会員限定記事に必要）
 *   --output <path>    出力PDFのファイルパス（デフォルト: ./output.pdf）
 *   --wait <ms>        ページ読み込み後の待機時間ミリ秒（デフォルト: 3000）
 *
 * Cookieファイルの作り方:
 *   1. ChromeにCookie Editor拡張機能をインストール
 *      https://chromewebstore.google.com/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm
 *   2. ブラウザでnote.comを開いてログインする
 *   3. Cookie Editorを開いて「Export」→「Export as JSON」
 *   4. メモ帳に貼り付けて note-cookies.json として保存
 *
 * 例:
 *   node scripts/note-to-pdf.mjs https://note.com/xxx/n/yyy \
 *     --cookies note-cookies.json --output article.pdf
 */

import { chromium } from 'playwright-core';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const CHROME_PATHS = [
  // Windows
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  // Mac
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  // Linux
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
  const args = { url: null, cookies: null, output: './output.pdf', wait: 3000 };
  const rest = argv.slice(2);

  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--cookies' && rest[i + 1]) {
      args.cookies = rest[++i];
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

function loadCookies(cookiesPath) {
  const raw = JSON.parse(readFileSync(cookiesPath, 'utf-8'));

  // Cookie EditorのJSON形式をPlaywright形式に変換
  return raw.map((c) => ({
    name: c.name,
    value: c.value,
    domain: c.domain,
    path: c.path || '/',
    httpOnly: c.httpOnly || false,
    secure: c.secure || false,
    sameSite: c.sameSite === 'no_restriction' ? 'None'
            : c.sameSite === 'lax' ? 'Lax'
            : c.sameSite === 'strict' ? 'Strict'
            : 'Lax',
  })).filter(c => c.name && c.value);
}

async function noteArticleToPdf({ url, cookies: cookiesPath, output, wait }) {
  const chromePath = findChrome();
  if (!chromePath) {
    console.error('エラー: Chromeが見つかりません。Google Chromeをインストールしてください。');
    process.exit(1);
  }

  console.log(`変換対象URL: ${url}`);
  console.log(`出力先: ${resolve(output)}`);

  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1200, height: 900 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    // Cookieファイルが指定されていればセット
    if (cookiesPath) {
      if (!existsSync(cookiesPath)) {
        console.error(`エラー: Cookieファイルが見つかりません: ${cookiesPath}`);
        process.exit(1);
      }
      const cookies = loadCookies(cookiesPath);
      await context.addCookies(cookies);
      console.log(`Cookieを読み込みました（${cookies.length}件）`);
    }

    const page = await context.newPage();

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
  console.error('使い方: node scripts/note-to-pdf.mjs <URL> [--cookies <path>] [--output <path>]');
  console.error('');
  console.error('例:');
  console.error('  node scripts/note-to-pdf.mjs https://note.com/xxx/n/yyy \\');
  console.error('    --cookies note-cookies.json --output article.pdf');
  process.exit(1);
}

noteArticleToPdf(args).catch((err) => {
  console.error('エラーが発生しました:', err.message);
  process.exit(1);
});
