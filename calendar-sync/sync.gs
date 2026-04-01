/**
 * Google Calendar 一方向同期（A → B）
 *
 * アカウントAのカレンダーに予定が入ると、
 * アカウントBのカレンダーに「予定あり」ブロックを自動作成する。
 *
 * ■ セットアップ手順
 *  1. https://script.google.com/ にアカウントAでログインして新しいプロジェクトを作成
 *  2. このコードを貼り付け
 *  3. 下の ACCOUNT_B_CALENDAR_ID にアカウントBのメールアドレスを設定
 *  4. 初回実行: メニューから `initialSetup` を実行（権限の承認が求められる）
 *  5. トリガー設定: メニューから `createTrigger` を実行（1分おきに自動同期が始まる）
 *
 * ■ 前提条件
 *  - アカウントBのカレンダー設定で、アカウントAに
 *   「予定の変更」権限を付与しておくこと
 *   （Googleカレンダー → 設定 → アカウントBのカレンダー → 特定のユーザーとの共有 → アカウントAを追加）
 */

// ============================================
// ★ ここだけ設定してください
// ============================================
const ACCOUNT_B_CALENDAR_ID = "your-b-account@gmail.com"; // アカウントBのメールアドレス
const SYNC_RANGE_DAYS = 180; // 何日先まで同期するか（デフォルト: 6ヶ月）
// ============================================

const SYNC_TAG = "[auto-sync]";
const PROPERTIES_KEY_SYNC_TOKEN = "syncToken";
const PROPERTIES_KEY_EVENT_MAP = "eventMap";

/**
 * 初回セットアップ: 権限の承認 + フル同期
 * メニューから手動で1回だけ実行する
 */
function initialSetup() {
  // プロパティ初期化
  const props = PropertiesService.getScriptProperties();
  props.deleteAllProperties();

  // フル同期
  fullSync();

  Logger.log("初回セットアップ完了！次に createTrigger を実行してください。");
}

/**
 * 1分おきのトリガーを作成
 */
function createTrigger() {
  // 既存のトリガーを削除
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === "incrementalSync") {
      ScriptApp.deleteTrigger(trigger);
    }
  }

  // 1分おきに incrementalSync を実行
  ScriptApp.newTrigger("incrementalSync")
    .timeBased()
    .everyMinutes(1)
    .create();

  Logger.log("トリガー作成完了: 1分おきに同期が実行されます。");
}

/**
 * 増分同期（トリガーから自動実行される）
 */
function incrementalSync() {
  const props = PropertiesService.getScriptProperties();
  const syncToken = props.getProperty(PROPERTIES_KEY_SYNC_TOKEN);
  const eventMap = getEventMap();

  let created = 0;
  let updated = 0;
  let deleted = 0;

  try {
    let pageToken = null;
    let newSyncToken = null;

    do {
      const options = {
        singleEvents: true,
        showDeleted: true,
      };

      if (syncToken) {
        options.syncToken = syncToken;
      } else {
        // syncToken がない場合はフル同期にフォールバック
        fullSync();
        return;
      }

      if (pageToken) {
        options.pageToken = pageToken;
      }

      const response = Calendar.Events.list("primary", options);
      const events = response.items || [];

      for (const event of events) {
        if (event.status === "cancelled") {
          // 削除されたイベント
          const bEventId = eventMap[event.id];
          if (bEventId) {
            tryDeleteEvent(bEventId);
            delete eventMap[event.id];
            deleted++;
          }
        } else if (event.start && event.end) {
          const bEventId = eventMap[event.id];
          if (bEventId) {
            // 更新
            if (tryUpdateBusyBlock(bEventId, event)) {
              updated++;
            }
          } else {
            // 新規作成
            const newId = createBusyBlock(event);
            if (newId) {
              eventMap[event.id] = newId;
              created++;
            }
          }
        }
      }

      pageToken = response.nextPageToken;
      if (!response.nextPageToken && response.nextSyncToken) {
        newSyncToken = response.nextSyncToken;
      }
    } while (pageToken);

    if (newSyncToken) {
      props.setProperty(PROPERTIES_KEY_SYNC_TOKEN, newSyncToken);
    }
    saveEventMap(eventMap);

    if (created > 0 || updated > 0 || deleted > 0) {
      Logger.log(
        `同期完了: ${created}件作成, ${updated}件更新, ${deleted}件削除`
      );
    }
  } catch (e) {
    if (e.message && e.message.includes("Sync token")) {
      // syncToken 期限切れ → フル同期
      Logger.log("Sync token 期限切れ: フル同期を実行します");
      props.deleteProperty(PROPERTIES_KEY_SYNC_TOKEN);
      fullSync();
    } else {
      Logger.log("同期エラー: " + e.message);
      throw e;
    }
  }
}

/**
 * フル同期: Bの自動作成イベントを全削除 → Aから全コピー
 */
function fullSync() {
  const props = PropertiesService.getScriptProperties();
  const eventMap = {};

  // Bのauto-syncイベントを全削除
  cleanupBusyBlocks();

  // Aのイベントを取得して同期
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + SYNC_RANGE_DAYS);

  let pageToken = null;
  let syncToken = null;
  let created = 0;

  do {
    const options = {
      timeMin: now.toISOString(),
      timeMax: future.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250,
    };
    if (pageToken) options.pageToken = pageToken;

    const response = Calendar.Events.list("primary", options);
    const events = response.items || [];

    for (const event of events) {
      if (event.status !== "cancelled" && event.start && event.end) {
        const newId = createBusyBlock(event);
        if (newId) {
          eventMap[event.id] = newId;
          created++;
        }
      }
    }

    pageToken = response.nextPageToken;
    if (!response.nextPageToken && response.nextSyncToken) {
      syncToken = response.nextSyncToken;
    }
  } while (pageToken);

  if (syncToken) {
    props.setProperty(PROPERTIES_KEY_SYNC_TOKEN, syncToken);
  }
  saveEventMap(eventMap);

  Logger.log(`フル同期完了: ${created}件作成`);
}

/**
 * BカレンダーにBusyブロックを作成
 */
function createBusyBlock(sourceEvent) {
  try {
    const newEvent = Calendar.Events.insert(
      {
        summary: SYNC_TAG + " 予定あり",
        start: sourceEvent.start,
        end: sourceEvent.end,
        transparency: "opaque",
        description: SYNC_TAG,
        status: "confirmed",
      },
      ACCOUNT_B_CALENDAR_ID
    );
    return newEvent.id;
  } catch (e) {
    Logger.log("Busyブロック作成失敗: " + e.message);
    return null;
  }
}

/**
 * BカレンダーのBusyブロックを更新
 */
function tryUpdateBusyBlock(bEventId, sourceEvent) {
  try {
    Calendar.Events.update(
      {
        summary: SYNC_TAG + " 予定あり",
        start: sourceEvent.start,
        end: sourceEvent.end,
        transparency: "opaque",
        description: SYNC_TAG,
        status: "confirmed",
      },
      ACCOUNT_B_CALENDAR_ID,
      bEventId
    );
    return true;
  } catch (e) {
    if (e.message && e.message.includes("Not Found")) {
      // Bで手動削除されてた場合、再作成
      const newId = createBusyBlock(sourceEvent);
      return !!newId;
    }
    Logger.log("Busyブロック更新失敗: " + e.message);
    return false;
  }
}

/**
 * Bカレンダーのイベントを削除
 */
function tryDeleteEvent(bEventId) {
  try {
    Calendar.Events.remove(ACCOUNT_B_CALENDAR_ID, bEventId);
  } catch (e) {
    // 既に削除済みなら無視
    if (!e.message || !e.message.includes("Not Found")) {
      Logger.log("削除失敗: " + e.message);
    }
  }
}

/**
 * Bカレンダーのauto-sync済みイベントを全削除
 */
function cleanupBusyBlocks() {
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + SYNC_RANGE_DAYS);

  let pageToken = null;

  do {
    const response = Calendar.Events.list(ACCOUNT_B_CALENDAR_ID, {
      q: SYNC_TAG,
      timeMin: now.toISOString(),
      timeMax: future.toISOString(),
      singleEvents: true,
      maxResults: 250,
      pageToken: pageToken,
    });

    for (const event of response.items || []) {
      if (event.description && event.description.includes(SYNC_TAG)) {
        try {
          Calendar.Events.remove(ACCOUNT_B_CALENDAR_ID, event.id);
        } catch (e) {
          // ignore
        }
      }
    }

    pageToken = response.nextPageToken;
  } while (pageToken);
}

// ============================================
// ヘルパー: イベントマッピングの保存/読み込み
// ============================================
function getEventMap() {
  const props = PropertiesService.getScriptProperties();
  const data = props.getProperty(PROPERTIES_KEY_EVENT_MAP);
  if (!data) return {};
  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
}

function saveEventMap(map) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty(PROPERTIES_KEY_EVENT_MAP, JSON.stringify(map));
}
