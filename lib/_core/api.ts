/**
 * API module stub for standalone mobile app.
 * Provides no-op implementations for OAuth-related API calls.
 */
import { getApiBaseUrl } from "@/constants/oauth";

interface ApiUser {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  lastSignedIn: string;
}

interface OAuthExchangeResult {
  sessionToken?: string;
  user?: ApiUser;
}

export async function getMe(): Promise<ApiUser | null> {
  try {
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) return null;
    const response = await fetch(`${baseUrl}/api/trpc/auth.me`, {
      credentials: "include",
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.result?.data ?? null;
  } catch {
    return null;
  }
}

export async function exchangeOAuthCode(
  code: string,
  state: string,
): Promise<OAuthExchangeResult> {
  try {
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) return {};
    const response = await fetch(`${baseUrl}/api/oauth/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, state }),
    });
    if (!response.ok) return {};
    return await response.json();
  } catch {
    return {};
  }
}

export async function logout(): Promise<void> {
  try {
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) return;
    await fetch(`${baseUrl}/api/trpc/auth.logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Silently fail
  }
}
