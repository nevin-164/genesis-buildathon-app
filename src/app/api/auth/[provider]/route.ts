import { NextResponse } from "next/server";

import {
  createAuthorisationUrl,
  isOAuthProvider,
  isProviderConfigured,
} from "@/lib/auth/oauth";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SEAM FILE — owner: package B (OAuth).
 *
 * `GET /api/auth/google` — step one of the dance. The route exists now so the
 * path, the param name and the provider validation are settled before the login
 * form links to it.
 *
 * Kept as `[provider]` rather than a literal `google/` folder: the segment costs
 * nothing, `isOAuthProvider` already rejects anything else with a 404, and a
 * second provider later is a new enum value rather than a new route tree.
 *
 * Nobody outside package B edits this file.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Not in `src/proxy.ts`'s matcher, and it must stay out of it: the proxy exists
 * to rotate the session of a signed-in user, and nobody here has one yet.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;

  // An unknown segment is a 404, not a 400. `/api/auth/nonsense` is not a
  // malformed request to a real endpoint; it is not an endpoint.
  if (!isOAuthProvider(provider)) {
    return new NextResponse(null, { status: 404 });
  }

  if (!isProviderConfigured(provider)) {
    return NextResponse.json(
      { error: `${provider} sign-in is not configured on this deployment.` },
      { status: 501 },
    );
  }

  const { url, state, codeVerifier } = await createAuthorisationUrl(provider);
  const response = NextResponse.redirect(url);
  const secure = process.env.NODE_ENV === "production";

  // "login" = sign-in only (reject if no account exists).
  // "register" or absent = create-or-sign-in (the default).
  const requestUrl = new URL(request.url);
  const intent = requestUrl.searchParams.get("intent") === "login" ? "login" : "register";

  const cookieOpts = { httpOnly: true, secure, sameSite: "lax" as const, path: "/", maxAge: 600 };

  // Lax is required: Google navigates back to this site from its own origin.
  response.cookies.set("il_oauth_state", state, cookieOpts);
  response.cookies.set("il_oauth_verifier", codeVerifier, cookieOpts);
  response.cookies.set("il_oauth_intent", intent, cookieOpts);

  return response;
}
