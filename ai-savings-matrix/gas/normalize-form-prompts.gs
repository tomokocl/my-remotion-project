/**
 * Google フォーム側のプロンプト質問の正規化 GAS
 *
 * 現状: フォームに「プロンプト/テンプレ本文」等の質問が複数あり、
 *       スプシ側で M/N/O のような重複列を生んでいる。
 * 目標: プロンプト系の質問を 2 問に整理する
 *   - 1 問目 → 「完成した共有用プロンプト」
 *   - 2 問目 → 「作成時のプロンプト」
 *   - 3 問目以降 → 削除
 *
 * 実行手順:
 * 1. Google フォームを開く (スプシではなくフォーム本体)
 * 2. 右上の ⋮ メニュー → 「スクリプトエディタ」を開く
 *    (またはフォームに紐付いた Apps Script プロジェクトを開く)
 * 3. 新しいスクリプトファイル `normalize-form-prompts` を追加してこのコードを貼り付け
 * 4. 保存 → 関数セレクタで `normalizeFormPromptQuestions` を選んで ▶ 実行
 * 5. 初回は承認ダイアログが出る → 許可
 * 6. 実行ログ（表示 → 実行ログ）で結果を確認
 *
 * ⚠ 重要:
 *   - 実行前にフォームのコピーをバックアップとして作成推奨
 *   - この関数はフォームに紐付けて実行する必要があります
 *     （スプシ側 Apps Script から実行する場合は下部 NOTE 参照）
 *   - 1 回だけ実行してください（重複検出がないので複数回実行で意図せず削除される可能性）
 *
 * NOTE: スプシ側 Apps Script から実行したい場合は
 *       FormApp.getActiveForm() の代わりに FormApp.openByUrl(EDIT_FORM_URL) に
 *       置き換えてください。EDIT_FORM_URL は「編集用URL (/edit 付き)」です。
 */

function normalizeFormPromptQuestions() {
  const form = FormApp.getActiveForm();
  const items = form.getItems();

  // プロンプト/テンプレを含む全質問を抽出（ページブレイク・セクションヘッダは除外）
  const promptItems = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const type = item.getType();
    // ページブレイクやセクションヘッダは除外
    if (type === FormApp.ItemType.PAGE_BREAK || type === FormApp.ItemType.SECTION_HEADER) continue;
    const title = item.getTitle();
    if (/プロンプト|テンプレ/.test(title)) {
      promptItems.push(item);
    }
  }

  Logger.log('検出されたプロンプト質問: ' + promptItems.length + ' 件');
  for (let i = 0; i < promptItems.length; i++) {
    Logger.log('  ' + (i + 1) + '. ' + promptItems[i].getTitle());
  }

  if (promptItems.length === 0) {
    Logger.log('プロンプト系の質問が見つかりません。中止します。');
    return;
  }

  // 1 問目 → 完成した共有用プロンプト
  promptItems[0].setTitle('完成した共有用プロンプト');
  promptItems[0].setHelpText('GEM/GPTs 等で公開できる完成した共有用プロンプトがあれば貼ってください（任意）');

  // 2 問目 → 作成時のプロンプト
  if (promptItems.length >= 2) {
    promptItems[1].setTitle('作成時のプロンプト');
    promptItems[1].setHelpText('コピペで使える素のプロンプト本文を書いてください（任意）');
  }

  // 3 問目以降を削除
  const deleted = [];
  for (let i = promptItems.length - 1; i >= 2; i--) {
    deleted.push(promptItems[i].getTitle());
    form.deleteItem(promptItems[i]);
  }

  Logger.log('完了:');
  Logger.log('  1 問目をリネーム: 完成した共有用プロンプト');
  if (promptItems.length >= 2) {
    Logger.log('  2 問目をリネーム: 作成時のプロンプト');
  }
  if (deleted.length > 0) {
    Logger.log('  削除した質問: ' + deleted.join(' / '));
  }
  Logger.log('');
  Logger.log('※ 既存スプシの列は別途 normalize-prompt-columns.gs を実行してください');
}
