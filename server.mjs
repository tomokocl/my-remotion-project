import express from 'express';
import multer from 'multer';
import { chromium } from 'playwright-core';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const upload = multer({ dest: 'tmp/' });

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

function findChrome() {
  for (const p of CHROME_PATHS) {
    if (p && existsSync(p)) return p;
  }
  return null;
}

function loadCookies(cookiesPath) {
  const raw = JSON.parse(readFileSync(cookiesPath, 'utf-8'));
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

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>note → PDF 変換</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 40px;
      width: 100%;
      max-width: 520px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #111;
    }
    p.sub {
      font-size: 13px;
      color: #888;
      margin-bottom: 32px;
    }
    label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #444;
      margin-bottom: 6px;
    }
    input[type="url"], input[type="file"] {
      width: 100%;
      padding: 12px 14px;
      border: 1.5px solid #e0e0e0;
      border-radius: 10px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
      margin-bottom: 20px;
    }
    input[type="url"]:focus {
      border-color: #41c9b0;
    }
    button {
      width: 100%;
      padding: 14px;
      background: #41c9b0;
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #2db99e; }
    button:disabled { background: #aaa; cursor: not-allowed; }
    #status {
      margin-top: 20px;
      padding: 14px;
      border-radius: 10px;
      font-size: 14px;
      display: none;
    }
    #status.loading { background: #f0faf8; color: #2db99e; display: block; }
    #status.error   { background: #fff0f0; color: #e55; display: block; }
    #status.done    { background: #f0faf8; color: #111; display: block; }
    a.dl-btn {
      display: block;
      margin-top: 12px;
      padding: 12px;
      background: #111;
      color: white;
      text-align: center;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
    }
    a.dl-btn:hover { background: #333; }
  </style>
</head>
<body>
  <div class="card">
    <h1>note → PDF</h1>
    <p class="sub">会員限定記事もPDFに変換できます</p>

    <form id="form">
      <label for="url">note の URL</label>
      <input type="url" id="url" name="url" placeholder="https://note.com/..." required>

      <label for="cookies">Cookie ファイル（JSON）</label>
      <input type="file" id="cookies" name="cookies" accept=".json">

      <button type="submit" id="btn">PDFに変換</button>
    </form>

    <div id="status"></div>
  </div>

  <script>
    const form = document.getElementById('form');
    const btn = document.getElementById('btn');
    const status = document.getElementById('status');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      btn.disabled = true;
      status.className = 'loading';
      status.innerHTML = '変換中... しばらくお待ちください';

      const fd = new FormData();
      fd.append('url', document.getElementById('url').value);
      const cookieFile = document.getElementById('cookies').files[0];
      if (cookieFile) fd.append('cookies', cookieFile);

      try {
        const res = await fetch('/convert', { method: 'POST', body: fd });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || '変換に失敗しました');
        }
        const blob = await res.blob();
        const objUrl = URL.createObjectURL(blob);
        status.className = 'done';
        status.innerHTML = '変換完了！<a class="dl-btn" href="' + objUrl + '" download="note-article.pdf">PDFをダウンロード</a>';
      } catch (err) {
        status.className = 'error';
        status.textContent = 'エラー: ' + err.message;
      } finally {
        btn.disabled = false;
      }
    });
  </script>
</body>
</html>`);
});

app.post('/convert', upload.single('cookies'), async (req, res) => {
  const { url } = req.body;
  const cookiesFile = req.file;

  if (!url) {
    return res.status(400).json({ error: 'URLが必要です' });
  }

  const chromePath = findChrome();
  if (!chromePath) {
    if (cookiesFile) unlinkSync(cookiesFile.path);
    return res.status(500).json({ error: 'Chromeが見つかりません' });
  }

  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1200, height: 900 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    });

    if (cookiesFile) {
      const cookies = loadCookies(cookiesFile.path);
      await context.addCookies(cookies);
    }

    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    await page.addStyleTag({
      content: `@media print {
        header, nav, footer,
        [class*="header"], [class*="nav"], [class*="footer"],
        [class*="sidebar"], [class*="recommend"],
        [class*="modal"], [class*="toast"],
        [class*="banner"], [class*="ad"] { display: none !important; }
        body { font-size: 14px !important; }
        img { max-width: 100% !important; }
      }`,
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="note-article.pdf"',
    });
    res.send(Buffer.from(pdfBuffer));
  } finally {
    await browser.close();
    if (cookiesFile && existsSync(cookiesFile.path)) unlinkSync(cookiesFile.path);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`起動しました → http://localhost:${PORT}`);
});
