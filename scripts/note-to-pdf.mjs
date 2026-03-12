#!/usr/bin/env node
/**
 * note-to-pdf: note.comの記事をPDFに変換するスクリプト
 *
 * 使い方:
 *   node scripts/note-to-pdf.mjs <URL> [オプション]
 *
 * オプション:
 *   --cookie <value>   note.comのセッションCookie文字列（会員限定記事に必要）
 *   --output <path>    出力PDFのファイルパス（デフォルト: ./output.pdf）
 *   --wait <ms>        ページ読み込み後の待機時間ミリ秒（デフォルト: 3000）
 *
 * 例:
 *   node scripts/note-to-pdf.mjs https://note.com/xxx/n/yyy --output article.pdf
 *   node scripts/note-to-pdf.mjs https://note.com/xxx/n/yyy --cookie "note_gk_session=abc123" --output article.pdf
 *
 * Cookieの取得方法:
 *   1. ブラウザでnote.comにログイン
 *   2. DevTools > Application > Cookies > https://note.com
 *   3. "note_gk_session" の値をコピー
 *   4. --cookie "note_gk_session=<値>" として渡す
 */

import { chromium } from 'playwright-core';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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
  const args = { url: null, cookie: null, output: './output.pdf', wait: 3000 };
  const rest = argv.slice(2);

  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--cookie' && rest[i + 1]) {
      args.cookie = rest[++i];
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

function parseCookies(cookieStr, domain) {
  if (!cookieStr) return [];

  return cookieStr.split(';').map((part) => {
    const [name, ...valueParts] = part.trim().split('=');
    return {
      name: name.trim(),
      value: valueParts.join('=').trim(),
      domain: domain,
      path: '/',
    };
  });
}

async function noteArticleToPdf({ url, cookie, output, wait }) {
  const chromePath = findChrome();
  if (!chromePath) {
    console.error('エラー: Chromiumが見つかりません。');
    console.error('インストール: npx playwright install chromium');
    process.exit(1);
  }

  console.log(`Chromium: ${chromePath}`);
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

    // Cookieを設定（会員限定記事のセッション認証用）
    if (cookie) {
      const urlObj = new URL(url);
      const cookies = parseCookies(cookie, urlObj.hostname);
      await context.addCookies(cookies);
      console.log(`Cookieを設定しました: ${cookies.map((c) => c.name).join(', ')}`);
    }

    const page = await context.newPage();

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

    // 会員限定コンテンツのロック確認
    const isLocked = await page.evaluate(() => {
      return !!(
        document.querySelector('[class*="paywall"]') ||
        document.querySelector('[class*="membership"]') ||
        document.querySelector('[data-type="locked"]')
      );
    });

    if (isLocked) {
      console.warn('警告: ページがロックされている可能性があります。Cookieを確認してください。');
    }

    // 印刷用CSSを適用してPDF生成
    await page.addStyleTag({
      content: `
        /* 印刷最適化スタイル */
        @media print {
          header, nav, footer,
          [class*="header"], [class*="nav"], [class*="footer"],
          [class*="sidebar"], [class*="recommend"],
          [class*="modal"], [class*="toast"],
          [class*="banner"], [class*="ad"] {
            display: none !important;
          }
          body {
            font-size: 14px !important;
          }
          img {
            max-width: 100% !important;
          }
          a {
            text-decoration: none !important;
            color: inherit !important;
          }
        }
      `,
    });

    console.log('PDFを生成中...');
    await page.pdf({
      path: resolve(output),
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm',
      },
    });

    console.log(`完了: ${resolve(output)} に保存しました`);
  } finally {
    await browser.close();
  }
}

// メイン処理
const args = parseArgs(process.argv);

if (!args.url) {
  console.error('使い方: node scripts/note-to-pdf.mjs <URL> [--cookie <cookie>] [--output <path>] [--wait <ms>]');
  console.error('');
  console.error('例:');
  console.error('  node scripts/note-to-pdf.mjs https://note.com/xxx/n/yyy');
  console.error('  node scripts/note-to-pdf.mjs https://note.com/xxx/n/yyy --cookie "note_gk_session=abc123" --output article.pdf');
  process.exit(1);
}

noteArticleToPdf(args).catch((err) => {
  console.error('エラーが発生しました:', err.message);
  process.exit(1);
});
