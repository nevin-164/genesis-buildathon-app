/**
 * The two session cookies and the options they are always written with.
 *
 * One file, because login, register, sign-out and the proxy all set them. A
 * single flag that disagrees between those four places is the kind of bug that
 * only appears once it is deployed.
 *
 * No `import "server-only"` here on purpose: the proxy imports this module.
 */

/** Signed JWT. Fifteen minutes. */
export const ACCESS_COOKIE = "il_at";

/**
 * Opaque — 32 random bytes, no claims. Thirty days, absolute. Only its SHA-256
 * hash is ever stored, in `auth_sessions.token_hash`.
 */
export const REFRESH_COOKIE = "il_rt";

export const ACCESS_MAX_AGE = 15 * 60;
export const REFRESH_MAX_AGE = 30 * 24 * 60 * 60;

/**
 * `secure` is conditional on purpose. Hard-coding `true` makes the browser drop
 * the cookie on http://localhost without saying anything, which presents as
 * "login does nothing" with no error to chase.
 */
function base() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  } as const;
}

export function accessCookieOptions() {
  return { ...base(), maxAge: ACCESS_MAX_AGE };
}

export function refreshCookieOptions() {
  return { ...base(), maxAge: REFRESH_MAX_AGE };
}
