import "server-only";

import { Google, OAuth2RequestError, generateCodeVerifier, generateState } from "arctic";
import { decodeJwt } from "jose";

import { baseUrl } from "@/lib/base-url";

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

/**
 * `<base>/api/auth/<provider>/callback`, no trailing slash.
 *
 * Google compares this byte for byte against its registered list, so on a
 * preview deployment — whose hostname is generated per push and cannot be
 * registered in advance — the handshake fails at Google with a mismatch error.
 * That is the correct failure. The old localhost fallback did something worse:
 * it sent the tester back to their own machine and looked like it worked.
 */
export function redirectUri(provider: OAuthProvider): string {
  return `${baseUrl()}/api/auth/${provider}/callback`;
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
 * The provider rejected the authorisation code at the token endpoint.
 *
 * `invalid_grant` is the one worth singling out, and it is almost never a bug
 * in this code: an authorisation code is single-use and lives about ten
 * minutes, so Google answers `invalid_grant` / "Bad Request" when the callback
 * is replayed, when the code was already redeemed, or when it went stale. A
 * wrong PKCE verifier or a mismatched redirect URI come back with their own
 * descriptions instead, which is why `providerCode` and `description` are kept
 * rather than flattened into one message.
 */
export class OAuthCodeRejectedError extends Error {
  readonly providerCode: string;
  readonly description: string | null;

  constructor(providerCode: string, description: string | null) {
    super(`oauth: provider rejected the authorisation code (${providerCode})`);
    this.name = "OAuthCodeRejectedError";
    this.providerCode = providerCode;
    this.description = description;
  }

  /** True when starting the flow again is the whole fix. */
  get isRetryable(): boolean {
    return this.providerCode === "invalid_grant";
  }
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

  let tokens;
  try {
    tokens = await googleClient().validateAuthorizationCode(code, codeVerifier);
  } catch (error) {
    // The provider answered, and it said no. That is a different class of
    // problem from the network being down or our credentials being wrong, and
    // the callback has to be able to tell them apart — one is the user's to
    // retry, the other is ours to fix.
    if (error instanceof OAuth2RequestError) {
      throw new OAuthCodeRejectedError(error.code, error.description);
    }
    throw error;
  }

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
