import express from "express";
import { google } from "googleapis";
import { config } from "./config";
import { getAccountAAuth } from "./auth";
import { performSync, performFullSync } from "./sync";

const app = express();
app.use(express.json());

let watchChannelId: string | null = null;
let watchResourceId: string | null = null;
let watchRenewalTimer: NodeJS.Timeout | null = null;

// Webhook endpoint: Google Calendar sends push notifications here
app.post("/webhook/calendar", async (req, res) => {
  const channelId = req.headers["x-goog-channel-id"];
  const resourceState = req.headers["x-goog-resource-state"];

  console.log(`[webhook] Received: state=${resourceState}, channel=${channelId}`);

  // Respond immediately (Google expects a quick response)
  res.status(200).send("OK");

  if (resourceState === "sync") {
    // Initial sync confirmation, ignore
    console.log("[webhook] Watch channel confirmed");
    return;
  }

  // An event changed in Calendar A — run sync
  try {
    await performSync();
  } catch (err: any) {
    console.error("[webhook] Sync failed:", err.message);
  }
});

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    watching: !!watchChannelId,
    channelId: watchChannelId,
  });
});

// Manual trigger for full sync
app.post("/sync/full", async (_req, res) => {
  try {
    await performFullSync();
    res.json({ status: "ok", message: "Full sync completed" });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Manual trigger for incremental sync
app.post("/sync", async (_req, res) => {
  try {
    await performSync();
    res.json({ status: "ok", message: "Sync completed" });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

async function setupWatch() {
  // Stop existing watch if any
  await stopWatch();

  const auth = getAccountAAuth();
  const calendar = google.calendar({ version: "v3", auth });
  const channelId = `cal-sync-${Date.now()}`;

  try {
    const res = await calendar.events.watch({
      calendarId: config.accountA.calendarId,
      requestBody: {
        id: channelId,
        type: "web_hook",
        address: `${config.server.webhookBaseUrl}/webhook/calendar`,
      },
    });

    watchChannelId = channelId;
    watchResourceId = res.data.resourceId || null;

    // Google watch channels expire (usually ~7 days)
    // Renew 1 hour before expiration
    const expiration = parseInt(res.data.expiration || "0", 10);
    const renewIn = expiration - Date.now() - 60 * 60 * 1000;

    if (renewIn > 0) {
      watchRenewalTimer = setTimeout(() => {
        console.log("[watch] Renewing watch channel...");
        setupWatch();
      }, renewIn);
    }

    console.log(
      `[watch] Watching Calendar A (channel: ${channelId}, expires: ${new Date(expiration).toISOString()})`
    );
  } catch (err: any) {
    console.error("[watch] Failed to setup watch:", err.message);
    // Retry in 5 minutes
    console.log("[watch] Will retry in 5 minutes...");
    setTimeout(setupWatch, 5 * 60 * 1000);
  }
}

async function stopWatch() {
  if (!watchChannelId || !watchResourceId) return;

  const auth = getAccountAAuth();
  const calendar = google.calendar({ version: "v3", auth });

  try {
    await calendar.channels.stop({
      requestBody: {
        id: watchChannelId,
        resourceId: watchResourceId,
      },
    });
    console.log(`[watch] Stopped channel: ${watchChannelId}`);
  } catch (err: any) {
    console.error("[watch] Failed to stop channel:", err.message);
  }

  watchChannelId = null;
  watchResourceId = null;
  if (watchRenewalTimer) {
    clearTimeout(watchRenewalTimer);
    watchRenewalTimer = null;
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[server] Shutting down...");
  await stopWatch();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("[server] Shutting down...");
  await stopWatch();
  process.exit(0);
});

// Start server
app.listen(config.server.port, async () => {
  console.log(`[server] Running on port ${config.server.port}`);
  console.log(`[server] Webhook URL: ${config.server.webhookBaseUrl}/webhook/calendar`);

  // Run initial sync
  console.log("[server] Running initial sync...");
  try {
    await performSync();
  } catch (err: any) {
    console.error("[server] Initial sync failed:", err.message);
  }

  // Setup push notification watch
  await setupWatch();
});
