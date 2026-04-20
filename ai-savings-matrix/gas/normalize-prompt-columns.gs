/**
 * プロンプト列の正規化 (M/N/O → M/N 2列に整理) GAS
 *
 * 現状: M列・N列・O列 が全て「プロンプト/テンプレ本文」等の同名ヘッダになっている
 * 目標:
 *   - M列 → 「完成した共有用プロンプト」
 *   - N列 → 「作成時のプロンプト」
 *   - O列以降 → 削除（データは損失しないよう事前に N に集約）
 *
 * 実行手順:
 * 1. Google スプレッドシートを開く
 * 2. 拡張機能 → Apps Script
 * 3. 新しいスクリプトファイル `normalize-prompt-columns` を追加してこのコードを貼り付け
 * 4. 保存 → 関数セレクタで `normalizePromptColumns` を選んで ▶ 実行
 * 5. 初回は承認ダイアログが出る → 許可
 * 6. 実行ログ（表示 → 実行ログ）で結果を確認
 *
 * ⚠ 重要: この関数は 1 回だけ実行してください。
 *   複数回実行しても冪等ですが、列削除は不可逆です。先にスプシのバックアップ推奨。
 *
 * ⚠ 実行後の補足:
 *   Google フォーム側に「プロンプト/テンプレ本文」の質問が複数残っている場合、
 *   次回のフォーム送信で新しい列が自動で追加されることがあります。
 *   フォーム側の質問も整理（不要な重複質問を削除）するとより確実です。
 */

function normalizePromptColumns() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 1 || lastCol < 1) {
    Logger.log('空のシートです');
    return;
  }

  // 現在のヘッダからプロンプト系列の列を全部抽出
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const promptCols = [];
  for (let i = 0; i < headers.length; i++) {
    const h = String(headers[i] || '');
    if (/プロンプト|テンプレ/.test(h)) promptCols.push(i + 1);
  }

  Logger.log('検出されたプロンプト系列の列: ' + promptCols.join(', ') +
             ' (ヘッダ: ' + promptCols.map(c => headers[c - 1]).join(' / ') + ')');

  if (promptCols.length === 0) {
    Logger.log('プロンプト系列の列が見つかりません。中止します。');
    return;
  }

  // 2列未満なら整理不要（ヘッダリネームだけ）
  if (promptCols.length === 1) {
    sheet.getRange(1, promptCols[0]).setValue('作成時のプロンプト');
    Logger.log('1列のみ検出。ヘッダを「作成時のプロンプト」にリネームしました。');
    return;
  }

  // 1列目 → 完成共有用、2列目 → 作成時、3列目以降 → 削除候補
  const colCompleted = promptCols[0];
  const colCreation  = promptCols[1];
  const extraCols    = promptCols.slice(2);

  // 全行の該当セルを一括読み込み（API呼び出しを減らす）
  if (lastRow >= 2) {
    const range = sheet.getRange(2, 1, lastRow - 1, lastCol);
    const data = range.getValues();

    for (let r = 0; r < data.length; r++) {
      // プロンプト系列の中で最長の非空値を N (作成時) に集約
      let best = '';
      for (const col of promptCols) {
        const v = String(data[r][col - 1] || '').trim();
        if (v.length > best.length) best = v;
      }
      // N 列に集約、M 列と余分な列はクリア
      for (const col of promptCols) {
        if (col === colCreation) {
          data[r][col - 1] = best;
        } else {
          data[r][col - 1] = '';
        }
      }
    }
    range.setValues(data);
  }

  // ヘッダをリネーム
  sheet.getRange(1, colCompleted).setValue('完成した共有用プロンプト');
  sheet.getRange(1, colCreation).setValue('作成時のプロンプト');

  // O列以降を削除（右から削除してインデックスがズレないように）
  extraCols.sort(function (a, b) { return b - a; }).forEach(function (col) {
    sheet.deleteColumn(col);
  });

  Logger.log('完了:');
  Logger.log('  ' + colCompleted + '列目(元M) → 完成した共有用プロンプト');
  Logger.log('  ' + colCreation  + '列目(元N) → 作成時のプロンプト (集約済み)');
  if (extraCols.length > 0) {
    Logger.log('  削除した列: ' + extraCols.join(', '));
  }
}
