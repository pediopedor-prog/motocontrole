/**
 * Authentication module stub for standalone mobile app.
 * Uses AsyncStorage for token and user info persistence.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSION_TOKEN_KEY = "app_session_token";
const USER_INFO_KEY = "manus-runtime-user-info";

export interface User {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  lastSignedIn: Date;
}

export async function getSessionToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setSessionToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(SESSION_TOKEN_KEY, token);
  } catch {
    console.warn("[Auth] Failed to store session token");
  }
}

export async function removeSessionToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    console.warn("[Auth] Failed to remove session token");
  }
}

export async function getUserInfo(): Promise<User | null> {
  try {
    const data = await AsyncStorage.getItem(USER_INFO_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    return {
      ...parsed,
      lastSignedIn: new Date(parsed.lastSignedIn),
    };
  } catch {
    return null;
  }
}

export async function setUserInfo(user: User): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
  } catch {
    console.warn("[Auth] Failed to store user info");
  }
}

export async function clearUserInfo(): Promise<void> {
  try {
    await AsyncStorage.removeItem(USER_INFO_KEY);
  } catch {
    console.warn("[Auth] Failed to clear user info");
  }
}
