import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/lib/auth/cookies";
import {
  exchangeCodeForIdentity,
  isOAuthProvider,
  OAuthCodeRejectedError,
  type OAuthIdentity,
} from "@/lib/auth/oauth";
import { issueSession } from "@/lib/auth/refresh";
import { HOME_FOR_ROLE } from "@/lib/constants/roles";
import { OAuthAccountModel } from "@/models/oauth-account.model";
import { UserModel } from "@/models/user.model";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SEAM FILE — owner: package B (OAuth).
 *
 * `GET /api/auth/google/callback` — step two. This exact path is what gets
 * registered as the authorised redirect URI in the Google console, which is why
 * it is fixed here before anyone configures the provider.
 *
 * Nobody outside package B edits this file.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  if (!isOAuthProvider(provider)) {
    return new NextResponse(null, { status: 404 });
  }

  const url = new URL(request.url);

  // The user pressed "Cancel" on the provider's consent screen. Not an error —
  // send them back to /login quietly rather than showing a failure.
  if (url.searchParams.get("error")) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("il_oauth_state");
    response.cookies.delete("il_oauth_verifier");
    return response;
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = await cookies();
  const expectedState = jar.get("il_oauth_state")?.value;
  const codeVerifier = jar.get("il_oauth_verifier")?.value;
  const intentStr = jar.get("il_oauth_intent")?.value;
  const intent = intentStr === "login" ? "login" : "register";

  if (!code || !state || !expectedState || !codeVerifier || state !== expectedState) {
    return oauthFailure(request, intent);
  }

  let identity: OAuthIdentity;
  try {
    identity = await exchangeCodeForIdentity(provider, code, codeVerifier);
  } catch (error) {
    /*
     * A refused code is an expected outcome, not a crash. Logging it at error
     * level with a stack trace buries the one line that explains it — the
     * provider's own reason — and makes a replayed callback look like a bug in
     * the exchange.
     */
    if (error instanceof OAuthCodeRejectedError) {
      console.warn(
        `[oauth/callback] ${provider} refused the authorisation code: ${error.providerCode}` +
          `${error.description ? ` (${error.description})` : ""}.` +
          (error.isRetryable
            ? " A code is single-use and expires within minutes, so this is normally a" +
              " replayed, refreshed or stale callback. Starting sign-in again clears it."
            : " Check GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and that" +
              " OAUTH_REDIRECT_BASE_URL matches the redirect URI registered with the provider."),
      );
      return oauthFailure(request, intent, error.isRetryable ? "oauth_retry" : "oauth");
    }

    console.error("[oauth/callback]", error);
    return oauthFailure(request, intent);
  }

  try {
    const user = await resolveUser(identity, intent);
    await UserModel.updateLastLogin(user.id);
    const { accessToken, refreshToken } = await issueSession(user);
    const response = NextResponse.redirect(new URL(HOME_FOR_ROLE[user.role], request.url));
    response.cookies.set(ACCESS_COOKIE, accessToken, accessCookieOptions());
    response.cookies.set(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
    response.cookies.delete("il_oauth_state");
    response.cookies.delete("il_oauth_verifier");
    response.cookies.delete("il_oauth_intent");
    return response;
  } catch (error) {
    console.error("[oauth/callback]", error);
    if (error instanceof OAuthNoAccountError) {
      const response = NextResponse.redirect(new URL("/login?error=oauth_no_account", request.url));
      response.cookies.delete("il_oauth_state");
      response.cookies.delete("il_oauth_verifier");
      response.cookies.delete("il_oauth_intent");
      return response;
    }
    return oauthFailure(request, intent);
  }
}

class OAuthNoAccountError extends Error {
  constructor() {
    super("oauth: no account exists for this identity and intent is login");
  }
}

async function resolveUser(identity: OAuthIdentity, intent: "login" | "register") {
  const linked = await OAuthAccountModel.findByProviderAccount(
    identity.provider,
    identity.providerAccountId,
  );
  if (linked) {
    const user = await UserModel.findById(linked.userId);
    if (!user?.isActive) throw new Error("oauth: linked account is inactive");
    if (user.emailVerifiedAt) return user;

    const verified = await UserModel.markEmailVerifiedFromOAuth(user.id);
    if (!verified) throw new Error("oauth: linked account disappeared");
    return verified;
  }

  const existing = await UserModel.findByEmail(identity.email);
  if (existing) {
    if (!existing.isActive) throw new Error("oauth: account is inactive");
    await OAuthAccountModel.link({
      userId: existing.id,
      provider: identity.provider,
      providerAccountId: identity.providerAccountId,
      providerEmail: identity.email,
    });
    const verified = await UserModel.markEmailVerifiedFromOAuth(existing.id);
    if (!verified) throw new Error("oauth: account disappeared after linking");
    return verified;
  }

  if (intent === "login") {
    throw new OAuthNoAccountError();
  }

  const user = await UserModel.createOAuthUser({
    email: identity.email,
    fullName: identity.fullName,
  });
  await OAuthAccountModel.link({
    userId: user.id,
    provider: identity.provider,
    providerAccountId: identity.providerAccountId,
    providerEmail: identity.email,
  });
  return user;
}

function oauthFailure(
  request: Request,
  intent: "login" | "register",
  reason: "oauth" | "oauth_retry" = "oauth",
) {
  const target = intent === "login" ? `/login?error=${reason}` : `/register?error=${reason}`;
  const response = NextResponse.redirect(new URL(target, request.url));
  response.cookies.delete("il_oauth_state");
  response.cookies.delete("il_oauth_verifier");
  response.cookies.delete("il_oauth_intent");
  return response;
}
