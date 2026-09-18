import "server-only";

import type { OAuthProvider } from "@/db/schema/enums";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SEAM FILE — owner: package B (OAuth).
 *
 * The two route handlers under `app/api/auth/[provider]/` already import these
 * and already return 501 until they are real. The provider buttons are already
 * on the login form, disabled. Package B fills in this file and those two
 * handlers; no other file in the auth layer changes.
 *
 * Nobody outside package B edits this file.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * This is the only file that may import `arctic`.
 */

/** What the callback learned about them. The provider's answer, nothing more. */
export type OAuthIdentity = {
  provider: OAuthProvider;
  /** The provider's own id — `sub` on Google, `id` on GitHub. Stable forever. */
  providerAccountId: string;
  email: string;
  fullName: string;
};

/** Valid values of the `[provider]` route segment. */
export const OAUTH_PROVIDERS = ["google", "github"] as const;

export function isOAuthProvider(value: string): value is OAuthProvider {
  return (OAUTH_PROVIDERS as readonly string[]).includes(value);
}

/** True when both halves of this provider's credentials are configured. */
export function isProviderConfigured(provider: OAuthProvider): boolean {
  const id =
    provider === "google" ? process.env.GOOGLE_CLIENT_ID : process.env.GITHUB_CLIENT_ID;
  const secret =
    provider === "google"
      ? process.env.GOOGLE_CLIENT_SECRET
      : process.env.GITHUB_CLIENT_SECRET;
  return Boolean(id && secret);
}

/** `<OAUTH_REDIRECT_BASE_URL>/api/auth/<provider>/callback`, no trailing slash. */
export function redirectUri(provider: OAuthProvider): string {
  const base = (process.env.OAUTH_REDIRECT_BASE_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  return `${base}/api/auth/${provider}/callback`;
}

/**
 * Step one: where to send the browser, plus the `state` (and PKCE verifier for
 * Google) that the callback has to check.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * `state` is CSRF protection and it is not decorative. Store it in a
 * short-lived httpOnly cookie on the way out and compare on the way back; a
 * callback that skips the comparison will happily log someone into an account
 * an attacker chose.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function createAuthorisationUrl(provider: OAuthProvider): Promise<{
  url: string;
  state: string;
  codeVerifier: string | null;
}> {
  throw new Error(`oauth: ${provider} not implemented — package B owns lib/auth/oauth.ts`);
}

/**
 * Step two: swap the code for a token, call the provider's userinfo endpoint,
 * and return who they are. Throws on any failure; the callback route turns that
 * into a redirect to /login with an error, never a stack trace.
 *
 * GitHub note: the primary email is NOT in the basic profile response when the
 * user has it set to private. Request the `user:email` scope and read
 * `GET /user/emails`, or a real fraction of GitHub users cannot register.
 */
export async function exchangeCodeForIdentity(
  provider: OAuthProvider,
  code: string,
  codeVerifier: string | null,
): Promise<OAuthIdentity> {
  void code;
  void codeVerifier;
  throw new Error(`oauth: ${provider} not implemented — package B owns lib/auth/oauth.ts`);
}
