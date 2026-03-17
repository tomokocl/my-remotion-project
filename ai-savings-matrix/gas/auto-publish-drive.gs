/**
 * AI節約術マトリックス - Googleフォームファイル自動公開スクリプト
 *
 * 【設定方法】
 * 1. スプレッドシートを開く
 * 2. 拡張機能 → Apps Script
 * 3. このコードを貼り付けて保存
 * 4. 「トリガーを追加」→ 関数: onFormSubmit / イベント: フォーム送信時
 * 5. 保存して権限を許可
 *
 * 【必須設定】
 * MEDIA_COLUMN_INDEX: スプレッドシートでファイルURLが入る列番号（1始まり）
 * 例: A列=1, B列=2, G列=7
 */

const MEDIA_COLUMN_INDEX = 7; // ← ファイルアップロード列の番号に合わせて変更

function onFormSubmit(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();
  const cell = sheet.getRange(lastRow, MEDIA_COLUMN_INDEX);
  const rawUrl = cell.getValue();

  if (!rawUrl) return; // ファイルなしの場合はスキップ

  const fileId = extractDriveId(rawUrl);
  if (!fileId) return;

  try {
    const file = DriveApp.getFileById(fileId);
    // 「リンクを知っている全員が閲覧可能」に設定
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // セルのURLを /file/d/ID/preview 形式に統一して書き戻す
    const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    cell.setValue(previewUrl);

    Logger.log(`公開完了: ${file.getName()} → ${previewUrl}`);
  } catch (err) {
    Logger.log(`エラー: ${err.message}`);
  }
}

function extractDriveId(url) {
  // /file/d/ID/...
  const m1 = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/);
  if (m1) return m1[1];

  // open?id=ID
  const m2 = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (m2) return m2[1];

  // uc?id=ID
  const m3 = url.match(/drive\.google\.com\/uc\?.*id=([^&]+)/);
  if (m3) return m3[1];

  return null;
}
