import fs from "fs";
import path from "path";

export interface GmailOAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // timestamp in ms
  scope?: string;
  tokenType?: string;
  idToken?: string;
}

export interface GmailOAuthAccount {
  email: string;
  tokens: GmailOAuthTokens;
  connectedAt: string;
  scopes: string[];
}

export interface GmailOAuthStatus {
  connected: boolean;
  email: string | null;
  provider: "GMAIL_OAUTH";
  connectedAt: string | null;
  scopes: string[];
  expiresAt?: string | null;
}

// Server-side persistent storage file path (never exposed to client)
const TOKEN_STORE_DIR = path.join(process.cwd(), "scratch");
const TOKEN_STORE_FILE = path.join(TOKEN_STORE_DIR, ".gmail-oauth.json");

// In-memory cache for fast access
let inMemoryAccount: GmailOAuthAccount | null = null;

function ensureStoreDir(): void {
  try {
    if (!fs.existsSync(TOKEN_STORE_DIR)) {
      fs.mkdirSync(TOKEN_STORE_DIR, { recursive: true });
    }
  } catch (err) {
    // Ignore if directory creation fails in restricted environments
  }
}

function loadStoredAccount(): GmailOAuthAccount | null {
  if (inMemoryAccount) {
    return inMemoryAccount;
  }

  // 1. Check environment variables for pre-configured OAuth account
  if (process.env.GMAIL_REFRESH_TOKEN && process.env.GMAIL_USER_EMAIL) {
    inMemoryAccount = {
      email: process.env.GMAIL_USER_EMAIL,
      tokens: {
        accessToken: process.env.GMAIL_ACCESS_TOKEN || "",
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        expiresAt: Date.now() + 3600 * 1000,
        scope: "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email",
      },
      connectedAt: new Date().toISOString(),
      scopes: [
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
    };
    return inMemoryAccount;
  }

  // 2. Check persistent file store
  try {
    if (fs.existsSync(TOKEN_STORE_FILE)) {
      const data = fs.readFileSync(TOKEN_STORE_FILE, "utf-8");
      inMemoryAccount = JSON.parse(data);
      return inMemoryAccount;
    }
  } catch (err) {
    console.error("Failed to read Gmail OAuth token store:", err);
  }

  return null;
}

function saveAccount(account: GmailOAuthAccount | null): void {
  inMemoryAccount = account;
  ensureStoreDir();
  try {
    if (account) {
      fs.writeFileSync(TOKEN_STORE_FILE, JSON.stringify(account, null, 2), "utf-8");
    } else if (fs.existsSync(TOKEN_STORE_FILE)) {
      fs.unlinkSync(TOKEN_STORE_FILE);
    }
  } catch (err) {
    console.error("Failed to persist Gmail OAuth token store:", err);
  }
}

export function getGmailOAuthConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID || process.env.GMAIL_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET || "",
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ||
      process.env.GMAIL_REDIRECT_URI ||
      "http://localhost:3000/api/auth/gmail/callback",
    defaultSender: "prithwi1016@gmail.com",
  };
}

export function getGmailAuthorizationUrl(redirectUriOverride?: string, returnTo?: string): string {
  const config = getGmailOAuthConfig();
  const rawUri = redirectUriOverride || config.redirectUri;
  const redirectUri = rawUri.split("?")[0];

  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = {
    redirect_uri: redirectUri,
    client_id: config.clientId || "mock-client-id.apps.googleusercontent.com",
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
    state: Buffer.from(JSON.stringify({ timestamp: Date.now(), returnTo: returnTo || "/pilot" })).toString("base64url"),
  };

  const qs = new URLSearchParams(options);
  return `${rootUrl}?${qs.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUriOverride?: string
): Promise<{ email: string; connected: boolean }> {
  const config = getGmailOAuthConfig();
  const rawUri = redirectUriOverride || config.redirectUri;
  const redirectUri = rawUri.split("?")[0];

  // In test or sandbox environment without live Google credentials, handle gracefully
  if (!config.clientId || !config.clientSecret) {
    const defaultEmail = config.defaultSender;
    const account: GmailOAuthAccount = {
      email: defaultEmail,
      tokens: {
        accessToken: `mock-access-token-${Date.now()}`,
        refreshToken: `mock-refresh-token-${Date.now()}`,
        expiresAt: Date.now() + 3600 * 1000,
        scope: "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email",
      },
      connectedAt: new Date().toISOString(),
      scopes: [
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
    };
    saveAccount(account);
    return { email: defaultEmail, connected: true };
  }

  // 1. Exchange code for access & refresh tokens
  const tokenUrl = "https://oauth2.googleapis.com/token";
  const tokenParams = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenParams.toString(),
  });

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    throw new Error(`Google OAuth token exchange failed: ${errorText}`);
  }

  const tokenData = await tokenRes.json();

  // 2. Fetch authenticated user email from Google UserInfo
  let userEmail = config.defaultSender;
  try {
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (userInfoRes.ok) {
      const userInfo = await userInfoRes.json();
      if (userInfo.email) {
        userEmail = userInfo.email;
      }
    }
  } catch (err) {
    console.warn("Failed to fetch userinfo from Google, using default sender:", err);
  }

  const account: GmailOAuthAccount = {
    email: userEmail,
    tokens: {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
      scope: tokenData.scope,
      tokenType: tokenData.token_type,
      idToken: tokenData.id_token,
    },
    connectedAt: new Date().toISOString(),
    scopes: (tokenData.scope || "")
      .split(" ")
      .filter((s: string) => Boolean(s.trim())),
  };

  saveAccount(account);
  return { email: userEmail, connected: true };
}

export async function getValidGmailAccessToken(): Promise<string | null> {
  const account = loadStoredAccount();
  if (!account) {
    return null;
  }

  // Check if current access token is valid (with 5 minute safety buffer)
  if (account.tokens.accessToken && account.tokens.expiresAt > Date.now() + 5 * 60 * 1000) {
    return account.tokens.accessToken;
  }

  // If expired, refresh using refresh token
  if (!account.tokens.refreshToken) {
    return account.tokens.accessToken || null;
  }

  const config = getGmailOAuthConfig();
  if (!config.clientId || !config.clientSecret) {
    // Return existing token in mock/dev mode
    return account.tokens.accessToken;
  }

  try {
    const tokenUrl = "https://oauth2.googleapis.com/token";
    const refreshParams = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: account.tokens.refreshToken,
      grant_type: "refresh_token",
    });

    const refreshRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: refreshParams.toString(),
    });

    if (refreshRes.ok) {
      const refreshedData = await refreshRes.json();
      account.tokens.accessToken = refreshedData.access_token;
      account.tokens.expiresAt = Date.now() + (refreshedData.expires_in || 3600) * 1000;
      saveAccount(account);
      return account.tokens.accessToken;
    }
  } catch (err) {
    console.error("Failed to refresh Gmail access token:", err);
  }

  return account.tokens.accessToken || null;
}

export function getGmailOAuthStatus(): GmailOAuthStatus {
  const account = loadStoredAccount();
  if (!account) {
    return {
      connected: false,
      email: null,
      provider: "GMAIL_OAUTH",
      connectedAt: null,
      scopes: [],
      expiresAt: null,
    };
  }

  // NEVER expose access or refresh tokens in status response
  return {
    connected: true,
    email: account.email,
    provider: "GMAIL_OAUTH",
    connectedAt: account.connectedAt,
    scopes: account.scopes,
    expiresAt: new Date(account.tokens.expiresAt).toISOString(),
  };
}

export function disconnectGmail(): void {
  saveAccount(null);
}

// For unit testing and local sandbox verification
export function setMockGmailOAuthAccount(
  email: string = "prithwi1016@gmail.com",
  tokens?: Partial<GmailOAuthTokens>
): void {
  const account: GmailOAuthAccount = {
    email,
    tokens: {
      accessToken: tokens?.accessToken || "mock-access-token",
      refreshToken: tokens?.refreshToken || "mock-refresh-token",
      expiresAt: tokens?.expiresAt || Date.now() + 3600 * 1000,
      scope:
        tokens?.scope ||
        "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email",
    },
    connectedAt: new Date().toISOString(),
    scopes: [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  };
  saveAccount(account);
}
