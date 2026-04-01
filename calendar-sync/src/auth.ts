import { google } from "googleapis";
import { config } from "./config";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

function createOAuth2Client(refreshToken?: string) {
  const client = new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    "http://localhost:3000/oauth/callback"
  );
  if (refreshToken) {
    client.setCredentials({ refresh_token: refreshToken });
  }
  return client;
}

export function getAccountAAuth() {
  return createOAuth2Client(config.accountA.refreshToken);
}

export function getAccountBAuth() {
  return createOAuth2Client(config.accountB.refreshToken);
}

export function getAuthUrl(state: string) {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    response_type: "code",
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state,
  });
}

export async function getTokenFromCode(code: string) {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);
  return tokens;
}
