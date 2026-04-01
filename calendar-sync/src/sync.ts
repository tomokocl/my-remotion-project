import { google, calendar_v3 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { config } from "./config";
import { getAccountAAuth, getAccountBAuth } from "./auth";
import fs from "fs";
import path from "path";

const SYNC_STATE_FILE = path.join(__dirname, "..", "sync-state.json");
const BUSY_EVENT_TAG = "[auto-sync]";

interface SyncState {
  syncToken: string | null;
  eventMap: Record<string, string>; // A eventId -> B eventId
}

function loadSyncState(): SyncState {
  try {
    const data = fs.readFileSync(SYNC_STATE_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return { syncToken: null, eventMap: {} };
  }
}

function saveSyncState(state: SyncState) {
  fs.writeFileSync(SYNC_STATE_FILE, JSON.stringify(state, null, 2));
}

function getCalendarClient(auth: OAuth2Client) {
  return google.calendar({ version: "v3", auth });
}

export async function performSync() {
  const authA = getAccountAAuth();
  const authB = getAccountBAuth();
  const calA = getCalendarClient(authA);
  const calB = getCalendarClient(authB);
  const state = loadSyncState();

  console.log("[sync] Starting sync...");

  try {
    const events = await fetchChangedEvents(calA, state);
    let created = 0;
    let updated = 0;
    let deleted = 0;

    for (const event of events) {
      if (event.status === "cancelled") {
        // Event was deleted in A → delete from B
        const bEventId = state.eventMap[event.id!];
        if (bEventId) {
          await deleteBusyBlock(calB, bEventId);
          delete state.eventMap[event.id!];
          deleted++;
        }
      } else if (event.start && event.end) {
        const existingBEventId = state.eventMap[event.id!];
        if (existingBEventId) {
          // Update existing busy block
          await updateBusyBlock(calB, existingBEventId, event);
          updated++;
        } else {
          // Create new busy block
          const bEventId = await createBusyBlock(calB, event);
          if (bEventId) {
            state.eventMap[event.id!] = bEventId;
            created++;
          }
        }
      }
    }

    saveSyncState(state);
    console.log(
      `[sync] Done: ${created} created, ${updated} updated, ${deleted} deleted`
    );
  } catch (err: any) {
    if (err.code === 410) {
      // Sync token expired, do full sync
      console.log("[sync] Sync token expired, performing full sync...");
      state.syncToken = null;
      state.eventMap = {};
      saveSyncState(state);
      await performFullSync();
    } else {
      console.error("[sync] Error:", err.message);
      throw err;
    }
  }
}

async function fetchChangedEvents(
  calA: calendar_v3.Calendar,
  state: SyncState
): Promise<calendar_v3.Schema$Event[]> {
  const allEvents: calendar_v3.Schema$Event[] = [];
  let pageToken: string | undefined;

  const params: calendar_v3.Params$Resource$Events$List = {
    calendarId: config.accountA.calendarId,
    singleEvents: true,
    showDeleted: true,
  };

  if (state.syncToken) {
    params.syncToken = state.syncToken;
  } else {
    // Initial sync: get events from now onward (up to 6 months)
    params.timeMin = new Date().toISOString();
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    params.timeMax = sixMonthsLater.toISOString();
  }

  do {
    if (pageToken) params.pageToken = pageToken;
    const res = await calA.events.list(params);
    allEvents.push(...(res.data.items || []));
    pageToken = res.data.nextPageToken || undefined;

    if (!res.data.nextPageToken && res.data.nextSyncToken) {
      state.syncToken = res.data.nextSyncToken;
      saveSyncState(state);
    }
  } while (pageToken);

  return allEvents;
}

async function createBusyBlock(
  calB: calendar_v3.Calendar,
  sourceEvent: calendar_v3.Schema$Event
): Promise<string | null> {
  try {
    const res = await calB.events.insert({
      calendarId: config.accountB.calendarId,
      requestBody: {
        summary: `${BUSY_EVENT_TAG} 予定あり`,
        start: sourceEvent.start!,
        end: sourceEvent.end!,
        transparency: "opaque",
        description: BUSY_EVENT_TAG,
        status: "confirmed",
      },
    });
    return res.data.id || null;
  } catch (err: any) {
    console.error("[sync] Failed to create busy block:", err.message);
    return null;
  }
}

async function updateBusyBlock(
  calB: calendar_v3.Calendar,
  bEventId: string,
  sourceEvent: calendar_v3.Schema$Event
) {
  try {
    await calB.events.update({
      calendarId: config.accountB.calendarId,
      eventId: bEventId,
      requestBody: {
        summary: `${BUSY_EVENT_TAG} 予定あり`,
        start: sourceEvent.start!,
        end: sourceEvent.end!,
        transparency: "opaque",
        description: BUSY_EVENT_TAG,
        status: "confirmed",
      },
    });
  } catch (err: any) {
    if (err.code === 404) {
      // B side event was manually deleted, recreate it
      console.log("[sync] B event was deleted, recreating...");
      return createBusyBlock(calB, sourceEvent);
    }
    console.error("[sync] Failed to update busy block:", err.message);
  }
}

async function deleteBusyBlock(
  calB: calendar_v3.Calendar,
  bEventId: string
) {
  try {
    await calB.events.delete({
      calendarId: config.accountB.calendarId,
      eventId: bEventId,
    });
  } catch (err: any) {
    if (err.code !== 404) {
      console.error("[sync] Failed to delete busy block:", err.message);
    }
  }
}

export async function performFullSync() {
  const authA = getAccountAAuth();
  const authB = getAccountBAuth();
  const calA = getCalendarClient(authA);
  const calB = getCalendarClient(authB);

  console.log("[sync] Performing full sync...");

  // First, clean up all existing auto-synced events in B
  await cleanupBusyBlocks(calB);

  // Then sync everything from A
  const state: SyncState = { syncToken: null, eventMap: {} };
  const events = await fetchChangedEvents(calA, state);
  let created = 0;

  for (const event of events) {
    if (event.status !== "cancelled" && event.start && event.end) {
      const bEventId = await createBusyBlock(calB, event);
      if (bEventId) {
        state.eventMap[event.id!] = bEventId;
        created++;
      }
    }
  }

  saveSyncState(state);
  console.log(`[sync] Full sync done: ${created} events created`);
}

async function cleanupBusyBlocks(calB: calendar_v3.Calendar) {
  let pageToken: string | undefined;
  const now = new Date().toISOString();

  do {
    const res = await calB.events.list({
      calendarId: config.accountB.calendarId,
      q: BUSY_EVENT_TAG,
      timeMin: now,
      singleEvents: true,
      pageToken,
    });

    for (const event of res.data.items || []) {
      if (event.description?.includes(BUSY_EVENT_TAG)) {
        await calB.events.delete({
          calendarId: config.accountB.calendarId,
          eventId: event.id!,
        }).catch(() => {});
      }
    }

    pageToken = res.data.nextPageToken || undefined;
  } while (pageToken);
}
