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
 * 実行手順（スプシ側 Apps Script からでも、フォーム側からでもどちらでも可）:
 * 1. スプシ or フォームの Apps Script を開く
 * 2. 新しいスクリプトファイル `normalize-form-prompts` を追加してこのコードを貼り付け
 * 3. 保存 → 関数セレクタで `normalizeFormPromptQuestions` を選んで ▶ 実行
 * 4. 初回は承認ダイアログが出る → 許可
 * 5. 実行ログ（表示 → 実行ログ）で結果を確認
 *
 * ⚠ 重要:
 *   - 実行前にフォームのコピーをバックアップとして作成推奨
 *   - 1 回だけ実行してください
 */

/**
 * フォーム編集URL を直接ここに貼れば、どの Apps Script プロジェクトからでも実行できる。
 * 空文字のままなら自動検出を試みる。
 *
 * 取り方:
 *   1. Google フォームを「編集モード」で開く
 *   2. ブラウザのアドレスバーの URL をまるごとコピー
 *      例: https://docs.google.com/forms/d/1AbCd.../edit
 *      (d/ の直後が「編集用 ID」。d/e/ のパブリック配布URLとは別物)
 */
var FORM_EDIT_URL = '';

/**
 * フォームを取得する。優先順位:
 *   1. FORM_EDIT_URL が設定されていればそれを使う
 *   2. FormApp.getActiveForm() (フォーム紐付きスクリプトの場合)
 *   3. スプシ紐付きスクリプトなら、各シートの getFormUrl() からリンク先フォームを取得
 */
function getTargetForm_() {
  // 1) 直接指定
  if (FORM_EDIT_URL) {
    return FormApp.openByUrl(FORM_EDIT_URL);
  }

  // 2) フォーム紐付きの場合
  try {
    const f = FormApp.getActiveForm();
    if (f) return f;
  } catch (e) {
    // スプシ側で呼ばれた場合に例外が出ることもあるので無視
  }

  // 3) スプシ紐付きの場合 → アクティブシートからリンクされたフォームを引く
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('フォームもスプシも特定できません。FORM_EDIT_URL を設定するか、フォーム/スプシに紐付けて実行してください。');
  }
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    const url = sheets[i].getFormUrl();
    if (url) return FormApp.openByUrl(url);
  }

  throw new Error('このスプシにリンクされているフォームが見つかりません。ファイル冒頭の FORM_EDIT_URL にフォームの編集URLを直接貼って再実行してください。');
}

function normalizeFormPromptQuestions() {
  const form = getTargetForm_();
  Logger.log('対象フォーム: ' + form.getTitle());

  const items = form.getItems();

  // プロンプト/テンプレを含む全質問を抽出（ページブレイク・セクションヘッダは除外）
  const promptItems = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const type = item.getType();
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
