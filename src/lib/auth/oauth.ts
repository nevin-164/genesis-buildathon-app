import "server-only";

import { Google, generateCodeVerifier, generateState } from "arctic";
import { decodeJwt } from "jose";

import type { OAuthProvider } from "@/db/schema/enums";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SEAM FILE — owner: package B (OAuth).
 *
 * The two route handlers under `app/api/auth/[provider]/` already import these
 * and already return 501 until they are real. The Google button is already on
 * the login form, disabled. Package B fills in this file and those two
 * handlers; no other file in the auth layer changes.
 *
 * Nobody outside package B edits this file.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * This is the only file that may import `arctic`.
 *
 * Google is the only provider. The `[provider]` route segment and the
 * `oauth_provider` enum stay anyway: they cost nothing, they keep the unique
 * index on `(provider, provider_account_id)` meaningful, and adding a second
 * provider later becomes a migration plus a branch here rather than a redesign
 * of the callback.
 */

/** What the callback learned about them. The provider's answer, nothing more. */
export type OAuthIdentity = {
  provider: OAuthProvider;
  /** The provider's own id — the `sub` claim on Google. Stable forever. */
  providerAccountId: string;
  email: string;
  fullName: string;
};

/** Valid values of the `[provider]` route segment. */
export const OAUTH_PROVIDERS = ["google"] as const;

export function isOAuthProvider(value: string): value is OAuthProvider {
  return (OAUTH_PROVIDERS as readonly string[]).includes(value);
}

/** True when both halves of this provider's credentials are configured. */
export function isProviderConfigured(provider: OAuthProvider): boolean {
  void provider;
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
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
 * Step one: where to send the browser, plus the `state` and the PKCE verifier
 * that the callback has to check.
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
  codeVerifier: string;
}> {
  void provider;

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = googleClient().createAuthorizationURL(state, codeVerifier, ["openid", "profile", "email"]);

  return { url: url.toString(), state, codeVerifier };
}

/**
 * Step two: swap the code for tokens, read the identity out of the signed
 * `id_token`, and return who they are. Throws on any failure; the callback
 * route turns that into a redirect to /login with an error, never a stack
 * trace.
 */
export async function exchangeCodeForIdentity(
  provider: OAuthProvider,
  code: string,
  codeVerifier: string,
): Promise<OAuthIdentity> {
  void provider;

  const tokens = await googleClient().validateAuthorizationCode(code, codeVerifier);
  // The token arrived directly from Google's token endpoint over TLS. It is not
  // browser-provided input, so decoding its claims here is sufficient.
  const claims = decodeJwt(tokens.idToken()) as {
    sub?: string;
    email?: string;
    name?: string;
    email_verified?: boolean;
  };

  if (!claims.sub) throw new Error("google: no subject on id_token");
  if (!claims.email) throw new Error("google: no email on id_token");
  if (claims.email_verified === false) {
    throw new Error("google: email not verified with the provider");
  }

  const email = claims.email.toLowerCase().trim();
  if (!email) throw new Error("google: no usable email on id_token");

  return {
    provider: "google",
    providerAccountId: claims.sub,
    email,
    fullName: claims.name?.trim() || email.split("@")[0]!,
  };
}

function googleClient(): Google {
  return new Google(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri("google"),
  );
}
