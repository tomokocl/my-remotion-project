/**
 * Googleフォームにセクション分岐を自動セットアップするスクリプト
 *
 * 使い方:
 * 1. Googleフォームを開く
 * 2. 「拡張機能」→「Apps Script」を開く
 * 3. このコードを貼り付ける
 * 4. setupFormSections() を実行（▶ボタン）
 * 5. 初回は権限の承認が必要（「許可」を押す）
 *
 * ※ 実行前に「共有タイプ」の質問がラジオボタンで作成済みであること
 *   選択肢: リンクで共有（GEM・GPTs等） / プロンプト・テンプレ共有 / 体験談として共有
 */

function setupFormSections() {
  const form = FormApp.getActiveForm();
  const items = form.getItems();

  // --- 「共有タイプ」の質問を探す ---
  let shareTypeItem = null;
  for (const item of items) {
    if (item.getTitle().includes('共有タイプ') || item.getTitle().includes('難易度')) {
      if (item.getType() === FormApp.ItemType.MULTIPLE_CHOICE) {
        shareTypeItem = item.asMultipleChoiceItem();
        break;
      }
    }
  }

  if (!shareTypeItem) {
    throw new Error('「共有タイプ」または「難易度」というラジオボタンの質問が見つかりません。先にフォームに追加してください。');
  }

  // --- 「共有URL」と「プロンプト/テンプレ本文」の質問を探す ---
  let urlItem = null;
  let promptItem = null;
  for (const item of items) {
    if (item.getTitle().includes('共有URL')) urlItem = item;
    if (item.getTitle().includes('プロンプト') && item.getTitle().includes('テンプレ')) promptItem = item;
  }

  // --- セクション（ページ区切り）を作成 ---
  // セクション2: リンク共有用
  const sectionLink = form.addPageBreakItem();
  sectionLink.setTitle('リンクで共有する方へ');
  sectionLink.setHelpText('GEMやGPTsなどのURLを貼ってください');

  // 共有URL欄がまだなければ作る
  if (!urlItem) {
    urlItem = form.addTextItem();
    urlItem.setTitle('共有URL');
    urlItem.setHelpText('GEMやGPTs、WebアプリなどのURLを貼ってください');
    urlItem.setRequired(false);
  }

  // セクション3: プロンプト共有用
  const sectionPrompt = form.addPageBreakItem();
  sectionPrompt.setTitle('プロンプト・テンプレを共有する方へ');
  sectionPrompt.setHelpText('コピペで使えるプロンプトやテンプレを書いてください');

  // プロンプト欄がまだなければ作る
  if (!promptItem) {
    promptItem = form.addParagraphTextItem();
    promptItem.setTitle('プロンプト/テンプレ本文');
    promptItem.setHelpText('コピペで使えるプロンプトやテンプレートを入力してください');
    promptItem.setRequired(false);
  }

  // セクション4: 体験談（追加入力なし → 共通項目へ）
  const sectionStory = form.addPageBreakItem();
  sectionStory.setTitle('体験談として共有する方へ');
  sectionStory.setHelpText('この後の共通項目に入力してください');

  // セクション5: 共通項目（タイトル・詳細など → 既存項目がここに来る）
  const sectionCommon = form.addPageBreakItem();
  sectionCommon.setTitle('投稿の詳細');

  // --- 分岐設定 ---
  const choices = shareTypeItem.getChoices();
  const newChoices = [];

  for (const choice of choices) {
    const text = choice.getValue();
    if (text.includes('リンク')) {
      newChoices.push(shareTypeItem.createChoice(text, sectionLink));
    } else if (text.includes('プロンプト') || text.includes('テンプレ')) {
      newChoices.push(shareTypeItem.createChoice(text, sectionPrompt));
    } else if (text.includes('体験談')) {
      newChoices.push(shareTypeItem.createChoice(text, sectionStory));
    } else {
      // マッチしない選択肢はそのまま
      newChoices.push(shareTypeItem.createChoice(text, sectionCommon));
    }
  }

  shareTypeItem.setChoices(newChoices);

  // 各セクションの「次へ」を共通項目セクションに向ける
  sectionLink.setGoToPage(sectionCommon);
  sectionPrompt.setGoToPage(sectionCommon);
  sectionStory.setGoToPage(sectionCommon);

  Logger.log('セットアップ完了！フォームを確認してください。');
  Logger.log('※ 質問の並び順はフォーム編集画面でドラッグして調整してください');
}
