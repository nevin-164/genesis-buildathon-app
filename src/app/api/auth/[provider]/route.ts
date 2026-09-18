import { NextResponse } from "next/server";

import { isOAuthProvider, isProviderConfigured } from "@/lib/auth/oauth";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SEAM FILE — owner: package B (OAuth).
 *
 * `GET /api/auth/google` and `GET /api/auth/github` — step one of the dance.
 * The route exists now so the path, the param name and the provider validation
 * are settled before the login form links to it.
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
  void request;
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

  /*
   * Package B replaces everything below with:
   *
   *   const { url, state, codeVerifier } = await createAuthorisationUrl(provider);
   *   const response = NextResponse.redirect(url);
   *   response.cookies.set("il_oauth_state", state, { httpOnly: true, secure: …,
   *     sameSite: "lax", path: "/", maxAge: 600 });
   *   if (codeVerifier) response.cookies.set("il_oauth_verifier", codeVerifier, …);
   *   return response;
   *
   * `sameSite: "lax"` and not "strict" — the provider redirects the browser
   * back cross-site, and a strict cookie is not sent on that navigation, so the
   * callback would find no state and reject every single sign-in.
   */
  return NextResponse.json({ error: "Not implemented." }, { status: 501 });
}
