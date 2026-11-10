import { env } from "@/config/env";

export const ACCESS_TOKEN_COOKIE = "access_token";

const SECONDS_PER_UNIT = { s: 1, m: 60, h: 3600, d: 86400 } as const;

// env.ts already guarantees the "15m" / "1h" / "7d" format, so this parser needs no error branch.
function durationToSeconds(duration: string): number {
    //“TypeScript, trust me, it’s one of those "s" | "m" | "h" | "d" ”
  const unit = duration.slice(-1) as keyof typeof SECONDS_PER_UNIT;
  return Number(duration.slice(0, -1)) * SECONDS_PER_UNIT[unit];
}

export function accessTokenCookieOptions() {
  return {
    // HttpOnly: page scripts can't read the token, so an XSS bug can't steal it.
    httpOnly: true,
    // Browsers require HTTPS for Secure cookies; local development runs on plain http://localhost.
    secure: env.NODE_ENV === "production",
    // Lax: the browser won't attach the cookie to POST requests triggered by other sites (CSRF).

    //as const since typescript see lax as string so need as const so only lax to prevent changing.
    sameSite: "lax" as const,
    path: "/",
    // The cookie expires together with the token, so the browser never keeps a dead token.
    maxAge: durationToSeconds(env.JWT_EXPIRES_IN),
  };
}