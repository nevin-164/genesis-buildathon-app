import { NextResponse } from "next/server";

import { isOAuthProvider } from "@/lib/auth/oauth";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SEAM FILE — owner: package B (OAuth).
 *
 * `GET /api/auth/<provider>/callback` — step two. This exact path is what gets
 * registered in the Google and GitHub consoles, which is why it is fixed here
 * before anyone configures a provider.
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
    return NextResponse.redirect(new URL("/login", request.url));
  }

  /*
   * Package B replaces everything below. The order matters:
   *
   *  1. Compare `state` against the il_oauth_state cookie. Mismatch or missing
   *     → redirect to /login. This is the CSRF check; it is not optional.
   *  2. exchangeCodeForIdentity(provider, code, verifier) → OAuthIdentity.
   *  3. Find an oauth_accounts row by (provider, providerAccountId).
   *  4. No row? Look the EMAIL up in users before inserting anything.
   *       - user exists  → insert the oauth_accounts link. Same person, second
   *                        route. Inserting a user instead hits users_email_key
   *                        and reads to them as "registration is broken".
   *       - no user      → create a partial user: passwordHash null, role from
   *                        the onboarding step (NOT from the provider, and
   *                        never "admin"), email_verified_at stamped now,
   *                        because Google has already proved the address.
   *  5. issueSession(user) from lib/auth/refresh.ts — verbatim, the same
   *     function login and register use. A second kind of session means the
   *     rotation and reuse detection in src/proxy.ts stops applying to half
   *     the user base.
   *  6. Set il_at and il_rt with accessCookieOptions()/refreshCookieOptions(),
   *     clear the two oauth cookies, and redirect. profileGate sends an
   *     unfinished user to /onboarding on the next render, so redirecting to
   *     HOME_FOR_ROLE is correct and needs no branch here.
   */
  return NextResponse.json({ error: "Not implemented." }, { status: 501 });
}
