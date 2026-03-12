#!/usr/bin/env node
/**
 * note-to-pdf: note.comの記事をPDFに変換するスクリプト
 *
 * 使い方:
 *   node scripts/note-to-pdf.mjs <URL> [オプション]
 *
 * オプション:
 *   --output <path>    出力PDFのファイルパス（デフォルト: ./output.pdf）
 *   --wait <ms>        ページ読み込み後の待機時間ミリ秒（デフォルト: 3000）
 *
 * 例:
 *   node scripts/note-to-pdf.mjs https://note.com/xxx/n/yyy --output article.pdf
 *
 * ※ 普段使いのChromeのログイン状態を自動で引き継ぎます
 */

import { chromium } from 'playwright-core';
import { existsSync } from 'fs';
import { resolve } from 'path';
import os from 'os';

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

// OSごとのChromeユーザーデータディレクトリ
function getChromeUserDataDir() {
  const platform = process.platform;
  if (platform === 'win32') {
    return process.env.LOCALAPPDATA + '\\Google\\Chrome\\User Data';
  } else if (platform === 'darwin') {
    return os.homedir() + '/Library/Application Support/Google/Chrome';
  } else {
    return os.homedir() + '/.config/google-chrome';
  }
}

function findChrome() {
  for (const p of CHROME_PATHS) {
    if (existsSync(p)) return p;
  }
  return null;
}

function parseArgs(argv) {
  const args = { url: null, output: './output.pdf', wait: 3000 };
  const rest = argv.slice(2);

  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--output' && rest[i + 1]) {
      args.output = rest[++i];
    } else if (rest[i] === '--wait' && rest[i + 1]) {
      args.wait = parseInt(rest[++i], 10);
    } else if (!rest[i].startsWith('--') && !args.url) {
      args.url = rest[i];
    }
  }

  return args;
}

async function noteArticleToPdf({ url, output, wait }) {
  const chromePath = findChrome();
  if (!chromePath) {
    console.error('エラー: Chromeが見つかりません。Google Chromeをインストールしてください。');
    process.exit(1);
  }

  const userDataDir = getChromeUserDataDir();
  console.log(`変換対象URL: ${url}`);
  console.log(`出力先: ${resolve(output)}`);
  console.log(`Chromeプロファイル: ${userDataDir}`);

  // 既存のChromeプロファイルを使う（ログイン状態を引き継ぐ）
  const context = await chromium.launchPersistentContext(userDataDir, {
    executablePath: chromePath,
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    viewport: { width: 1200, height: 900 },
  });

  try {
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
    await context.close();
  }
}

// メイン処理
const args = parseArgs(process.argv);

if (!args.url) {
  console.error('使い方: node scripts/note-to-pdf.mjs <URL> [--output <path>] [--wait <ms>]');
  console.error('');
  console.error('例:');
  console.error('  node scripts/note-to-pdf.mjs https://note.com/xxx/n/yyy --output article.pdf');
  process.exit(1);
}

noteArticleToPdf(args).catch((err) => {
  console.error('エラーが発生しました:', err.message);
  process.exit(1);
});
