/**
 * 節約難易度 (Q列) 自動書き込み GAS
 *
 * 既存の GAS (Drive 公開 onFormSubmit / やり方API doGet・doPost) と独立。
 * 関数名・対象列・トリガー をすべて分離しているため競合しない。
 *
 * セットアップ:
 * 1. Google スプレッドシートを開く
 * 2. 拡張機能 → Apps Script
 * 3. 新しいスクリプトファイルを追加してこのコードを貼り付け
 * 4. 保存 → トリガー画面（⏰アイコン）→ トリガーを追加
 *    - 関数: onFormSubmitDifficulty
 *    - イベントのソース: スプレッドシートから
 *    - イベントの種類: フォーム送信時
 * 5. 既存行を一括で埋めるなら backfillDifficulty を▶で一度実行
 *
 * 判定ルール（サイト側 app.js の parseCSV と同じ）:
 *   - 共有URLに非Driveのリンク、または 難易度列に「リンク/GEM/GPT」      → 上級
 *   - プロンプト/テンプレ列に値あり、または 難易度・タイトルに「プロンプト/テンプレ」 → 中級
 *   - それ以外                                                                    → 初級
 *
 * 安全装置:
 *   - Q列に既に 初級/中級/上級 が入っていればスキップ（手入力を尊重）
 *   - Q列のヘッダが無ければ末尾に「節約難易度」を自動追加
 */

function onFormSubmitDifficulty(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  writeDifficultyForRow_(sheet, lastRow);
}

function backfillDifficulty() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  for (var r = 2; r <= lastRow; r++) {
    writeDifficultyForRow_(sheet, r);
  }
}

function writeDifficultyForRow_(sheet, row) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // 「節約難易度」列を専用検索（「難易度」と区別するため先に確定）
  var colDiff = -1;
  for (var i = 0; i < headers.length; i++) {
    if (String(headers[i]).indexOf('節約難易度') >= 0) {
      colDiff = i + 1;
      break;
    }
  }
  if (colDiff < 0) {
    colDiff = sheet.getLastColumn() + 1;
    sheet.getRange(1, colDiff).setValue('節約難易度');
  }

  // 既に手入力があれば尊重
  var existing = String(sheet.getRange(row, colDiff).getValue() || '').trim();
  if (existing === '初級' || existing === '中級' || existing === '上級') return;

  // 判定用の列を取得（部分一致、節約難易度列は除外）
  var colLevel  = findHeaderCol_(headers, ['難易度'], colDiff);
  var colTitle  = findHeaderCol_(headers, ['タイトル'], colDiff);
  var colUrl    = findHeaderCol_(headers, ['共有URL'], colDiff);
  var colPrompt = findHeaderCol_(headers, ['プロンプト', 'テンプレ'], colDiff);

  var level  = colLevel  > 0 ? String(sheet.getRange(row, colLevel).getValue()  || '') : '';
  var title  = colTitle  > 0 ? String(sheet.getRange(row, colTitle).getValue()  || '') : '';
  var url    = colUrl    > 0 ? String(sheet.getRange(row, colUrl).getValue()    || '').trim() : '';
  var prompt = colPrompt > 0 ? String(sheet.getRange(row, colPrompt).getValue() || '').trim() : '';

  var isDriveUrl = /^https?:\/\/drive\.google\.com/i.test(url);
  var hasRealUrl = /^https?:\/\//i.test(url) && !isDriveUrl;

  var difficulty;
  if (hasRealUrl || /リンク|GEM|GPT/.test(level)) {
    difficulty = '上級';
  } else if (prompt || /プロンプト|テンプレ/.test(level) || /プロンプト|テンプレ/.test(title)) {
    difficulty = '中級';
  } else {
    difficulty = '初級';
  }

  sheet.getRange(row, colDiff).setValue(difficulty);
}

/**
 * ヘッダー配列から部分一致で列番号を返す。excludeCol は除外（「節約難易度」列を「難易度」判定から外すため）。
 */
function findHeaderCol_(headers, needles, excludeCol) {
  for (var i = 0; i < headers.length; i++) {
    if ((i + 1) === excludeCol) continue;
    var h = String(headers[i]);
    for (var j = 0; j < needles.length; j++) {
      if (h.indexOf(needles[j]) >= 0) return i + 1;
    }
  }
  return -1;
}
