import { decodeJwt } from "jose";
import { NextResponse, type NextRequest } from "next/server";

import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/lib/auth/cookies";
import { signAccessToken, verifyAccessToken, type JWTPayload } from "@/lib/auth/jwt";
import { hashToken, newOpaqueToken } from "@/lib/auth/refresh";
import { isAllowed, isProtected } from "@/lib/auth/route-policy";
import { HOME_FOR_ROLE } from "@/lib/constants/roles";
import { AuthSessionModel } from "@/models/auth-session.model";
import { UserModel } from "@/models/user.model";
import type { Role } from "@/types/contracts";

/**
 * Only the signed-in areas need this. Without a matcher the proxy runs on every
 * request — and it imports Drizzle and the postgres driver, so that is a real
 * cost on a platform where each request is a cold serverless function.
 *
 * The bare prefixes are listed alongside the wildcards because `/student`,
 * `/faculty` and `/admin` are all real dashboards.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THIS LIST MUST MIRROR every role-guarded prefix in `lib/auth/route-policy.ts`.
 * It cannot be generated from it: Next reads `config` statically at build time,
 * so an imported or computed value is not seen. `/dev/checks` asserts the two
 * agree — a guarded route missing from here is a route with no proxy at all.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const config = {
  matcher: [
    "/student",
    "/student/:path*",
    "/faculty",
    "/faculty/:path*",
    "/admin",
    "/admin/:path*",
  ],
};

/** Swap the pair once the access token is this close to running out. */
const ROTATE_WITHIN_SECONDS = 120;

/**
 * A refresh token consumed less than this long ago and presented again is a
 * concurrent request carrying the pre-rotation cookie, not an attack. One click
 * in the App Router fans out into several server requests that all send the
 * same cookie; without a grace window they log each other out at random.
 */
const REUSE_GRACE_SECONDS = 30;

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Belt and braces with `config.matcher`: if that is ever widened, this keeps
  // the proxy off public routes rather than redirect-looping on /login.
  if (!isProtected(pathname)) return NextResponse.next();

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const payload = accessToken ? await verifyAccessToken(accessToken) : null;

  /** Set only when we mint a replacement. Never re-write a cookie unchanged. */
  let freshAccess: string | null = null;
  let freshRefresh: string | null = null;
  let user = null;

  if (refreshToken && needsRotation(accessToken, payload)) {
    const found = await AuthSessionModel.findSessionByTokenHash(await hashToken(refreshToken));

    if (!found || found.session.revokedAt || !found.user.isActive) return bounce(request);
    // Absolute, and inherited by every child in the chain. Thirty days from the
    // original sign-in, not thirty days from the last click.
    if (found.session.expiresAt.getTime() <= Date.now()) return bounce(request);

    user = found.user;

    if (found.session.rotatedAt) {
      const secondsSinceRotation = (Date.now() - found.session.rotatedAt.getTime()) / 1000;

      if (secondsSinceRotation > REUSE_GRACE_SECONDS) {
        // Reuse. Kill the family, and bump session_version so the access tokens
        // already in the wild die too instead of lasting another fifteen minutes.
        await AuthSessionModel.revokeFamily(found.session.familyId);
        await UserModel.incrementSessionVersion(found.user.id);
        return bounce(request);
      }

      // Inside the grace window. Mint an access token so this render works, and
      // leave il_rt strictly alone: the browser already holds the rotated one,
      // and writing this consumed token back over it is what logs people out a
      // quarter of an hour later.
      freshAccess = await signAccessToken(claims(user, found.session.familyId));
    } else {
      const opaque = newOpaqueToken();
      const child = await AuthSessionModel.rotateSession(
        found.session.id,
        await hashToken(opaque),
      );

      if (child) {
        freshAccess = await signAccessToken(claims(user, child.familyId));
        freshRefresh = opaque;
      } else {
        // Another request took the row between our read and our write. Same
        // benign race as above, so the same handling: access token only.
        freshAccess = await signAccessToken(claims(user, found.session.familyId));
      }
    }
  } else if (payload) {
    user = await UserModel.findById(payload.sub);
    // The kill switch, checked here as well as in the DAL so a revoked token
    // costs one redirect instead of a full render that then bounces.
    if (user && user.sessionVersion !== payload.sv) return bounce(request);
  }

  if (!user || !user.isActive) return bounce(request);

  /*
   * Any response that leaves here early still has to carry the cookies this
   * request minted. Dropping them sends the browser back with the refresh
   * token that was just consumed, which is indistinguishable from reuse and
   * kills the family on the following request.
   */
  const carryingFreshCookies = (response: NextResponse): NextResponse => {
    if (freshAccess) response.cookies.set(ACCESS_COOKIE, freshAccess, accessCookieOptions());
    if (freshRefresh) response.cookies.set(REFRESH_COOKIE, freshRefresh, refreshCookieOptions());
    return response;
  };

  if (!isAllowed(pathname, user.role)) {
    // Signed in, wrong area. Their own dashboard, not /login — sending a
    // signed-in user to the login page reads as a broken session.
    return carryingFreshCookies(
      NextResponse.redirect(new URL(HOME_FOR_ROLE[user.role], request.url)),
    );
  }

  /*
   * The email gate, and the reason it is here as well as in `dal.ts`.
   * ───────────────────────────────────────────────────────────────────────────
   * `requirePageRole` runs the same rule, but a segment with a `loading.tsx`
   * streams its shell before the page guard has resolved. A `redirect()` thrown
   * after that first flush cannot set a status code, so Next degrades it to
   * `<meta http-equiv="refresh" content="1;url=/verify">`: the dashboard frame
   * paints, the address bar changes a second later, and anything that does not
   * act on the tag — curl, a scraper, a link preview — simply gets HTTP 200.
   *
   * That is a soft gate. Here it is a 307 issued before any rendering starts.
   * ───────────────────────────────────────────────────────────────────────────
   * It costs nothing: every branch above has already loaded the user row. The
   * `dal.ts` check stays as the backstop for anything this matcher does not
   * cover, and it is still the only place `profileGate` runs.
   *
   * No loop: /verify is public in `route-policy.ts`, so it is outside
   * `config.matcher` and `isProtected` turns it away at the top of this
   * function.
   */
  if (!user.emailVerifiedAt) {
    return carryingFreshCookies(NextResponse.redirect(new URL("/verify", request.url)));
  }

  if (!freshAccess && !freshRefresh) return NextResponse.next();

  // The replacements have to go onto the INCOMING request too. Response cookies
  // only reach the browser; the page rendering inside this same request reads
  // request cookies, and would otherwise still be handed the stale token.
  if (freshAccess) request.cookies.set(ACCESS_COOKIE, freshAccess);
  if (freshRefresh) request.cookies.set(REFRESH_COOKIE, freshRefresh);

  const headers = new Headers(request.headers);
  headers.set("cookie", request.cookies.toString());

  // Build the response first and attach cookies last. Returning a redirect
  // after minting a pair throws the new tokens away, and the browser then
  // replays a consumed refresh token straight into reuse detection.
  const response = NextResponse.next({ request: { headers } });
  if (freshAccess) response.cookies.set(ACCESS_COOKIE, freshAccess, accessCookieOptions());
  if (freshRefresh) response.cookies.set(REFRESH_COOKIE, freshRefresh, refreshCookieOptions());
  return response;
}

function needsRotation(accessToken: string | undefined, payload: JWTPayload | null): boolean {
  if (!accessToken || !payload) return true;
  try {
    const { exp } = decodeJwt(accessToken);
    if (typeof exp !== "number") return true;
    return exp - Math.floor(Date.now() / 1000) < ROTATE_WITHIN_SECONDS;
  } catch {
    return true;
  }
}

function claims(
  user: { id: string; role: Role; sessionVersion: number },
  familyId: string,
): JWTPayload {
  return { sub: user.id, role: user.role, sv: user.sessionVersion, sid: familyId };
}

function bounce(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}
