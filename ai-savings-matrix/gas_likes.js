/**
 * AI節約術マトリックス - いいね集計 GAS Web App
 *
 * 【設定手順】
 * 1. Google スプレッドシートを開く（フォーム回答が入っているもので可）
 * 2. 拡張機能 → Apps Script
 * 3. このファイルの内容を貼り付けて保存
 * 4. デプロイ → 新しいデプロイ
 *    - 種類: ウェブアプリ
 *    - 実行ユーザー: 自分
 *    - アクセスできるユーザー: 全員
 * 5. デプロイして表示されたURLをコピー
 * 6. config.js の GAS_LIKES_URL に貼り付ける
 */

const LIKES_SHEET = "Likes";

function doGet(e) {
  const action = (e.parameter.action || "counts");
  const key    = (e.parameter.key    || "");

  const sheet = getOrCreateLikesSheet();
  let result;

  if (action === "like" || action === "unlike") {
    result = updateLike(sheet, key, action === "like" ? 1 : -1);
  } else {
    // action === "counts" : 全件取得
    result = getAllCounts(sheet);
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---------- helpers ----------

function getOrCreateLikesSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(LIKES_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(LIKES_SHEET);
    sheet.appendRow(["postKey", "count"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function updateLike(sheet, key, delta) {
  if (!key) return { error: "no key" };

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      const newCount = Math.max(0, (Number(data[i][1]) || 0) + delta);
      sheet.getRange(i + 1, 2).setValue(newCount);
      return { key: key, count: newCount };
    }
  }

  // 新規行（likeのみ）
  if (delta > 0) {
    sheet.appendRow([key, 1]);
    return { key: key, count: 1 };
  }
  return { key: key, count: 0 };
}

function getAllCounts(sheet) {
  const data = sheet.getDataRange().getValues();
  const result = {};
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) result[data[i][0]] = Number(data[i][1]) || 0;
  }
  return result;
}
