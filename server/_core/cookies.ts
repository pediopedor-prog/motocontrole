/**
 * Cookie utilities stub for server-side code.
 */
export function getSessionCookieOptions(_req?: any) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 365,
  };
}
