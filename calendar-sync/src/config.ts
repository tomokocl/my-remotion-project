import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "..", ".env") });

export const config = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  },
  accountA: {
    refreshToken: process.env.ACCOUNT_A_REFRESH_TOKEN!,
    calendarId: process.env.ACCOUNT_A_CALENDAR_ID || "primary",
  },
  accountB: {
    refreshToken: process.env.ACCOUNT_B_REFRESH_TOKEN!,
    calendarId: process.env.ACCOUNT_B_CALENDAR_ID || "primary",
  },
  server: {
    port: parseInt(process.env.PORT || "3000", 10),
    webhookBaseUrl: process.env.WEBHOOK_BASE_URL!,
  },
};
