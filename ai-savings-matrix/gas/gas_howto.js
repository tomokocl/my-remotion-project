// ===== GAS: やり方（howto）読み書き Web App =====
// スプレッドシートの「やり方」列を読み書きする
//
// デプロイ手順:
// 1. Google Apps Script で新規プロジェクトを作成
// 2. このコードを貼り付け
// 3. デプロイ → 新しいデプロイ → ウェブアプリ
//    - 実行するユーザー: 自分
//    - アクセスできるユーザー: 全員
// 4. デプロイURLを config.js の GAS_HOWTO_URL に貼り付け

const SPREADSHEET_ID = "1JMbIStrvY4UpgRGK-MyhZ7oWvWM1rKSO6vtQiFbEW4E";
const SHEET_NAME_CANDIDATES = ["フォームの回答 1", "Sheet1", "シート1"];
const HOWTO_HEADER = "やり方";

function getSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  for (const name of SHEET_NAME_CANDIDATES) {
    const s = ss.getSheetByName(name);
    if (s) return s;
  }
  return ss.getSheets()[0];
}

/** ヘッダー行から「やり方」列を探す。なければ新規作成して返す */
function getHowtoCol(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  for (let i = 0; i < headers.length; i++) {
    if (String(headers[i]).trim() === HOWTO_HEADER) return i + 1; // 1-based
  }
  // 列が存在しない場合は末尾に追加
  const newCol = sheet.getLastColumn() + 1;
  sheet.getRange(1, newCol).setValue(HOWTO_HEADER);
  return newCol;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** GET: ?row=N で指定行の「やり方」を返す */
function doGet(e) {
  try {
    const row = parseInt(e.parameter.row, 10);
    if (!row || row < 2) return jsonResponse({ ok: false, error: "invalid row" });

    const sheet = getSheet();
    const col = getHowtoCol(sheet);
    const value = sheet.getRange(row, col).getValue();
    return jsonResponse({ ok: true, howto: String(value || "") });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

/** POST: {row, howto} で指定行の「やり方」を更新 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const row = parseInt(body.row, 10);
    const howto = String(body.howto || "");

    if (!row || row < 2) return jsonResponse({ ok: false, error: "invalid row" });

    const sheet = getSheet();
    const col = getHowtoCol(sheet);
    sheet.getRange(row, col).setValue(howto);

    return jsonResponse({ ok: true, row: row, howto: howto });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}
