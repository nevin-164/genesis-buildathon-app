import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { rolesFor } from "@/lib/auth/route-policy";
import { HOME_FOR_ROLE } from "@/lib/constants/roles";
import { UserModel } from "@/models/user.model";
import type { Role, SessionUser } from "@/types/contracts";

import { ACCESS_COOKIE } from "./cookies";
import { ForbiddenError, UnauthorizedError } from "./errors";
import { checkGates } from "./gates";
import { verifyAccessToken } from "./jwt";

/**
 * The one place a session is resolved.
 *
 * Wrapped in React `cache()` so the shell, the page and every leaf component
 * share one JWT verification and one row read per render. Returns null instead
 * of redirecting, because leaf components need a value, not navigation.
 *
 * The token says who signed in; the row says whether they still count. Both are
 * checked, so a deactivated account and a bumped `session_version` each kill an
 * access token that has not yet run out its fifteen minutes.
 */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifyAccessToken(token);
  if (!payload) return null;

  const user = await UserModel.findById(payload.sub);
  if (!user || !user.isActive || user.sessionVersion !== payload.sv) return null;

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    emailVerifiedAt: user.emailVerifiedAt,
  };
});

/* ── Throwing guards. For controllers, which must never redirect. ────────── */

export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new ForbiddenError();
  return user;
}

/* ── Redirecting guards. For page.tsx only — never in a layout. ──────────── */

export async function requirePageUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}

async function requirePageRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requirePageUser();
  if (!roles.includes(user.role)) redirect(HOME_FOR_ROLE[user.role]);

  /*
   * Signed in, right role — but possibly not finished. An OAuth user with no
   * profile yet and an unconfirmed address are the same shape of problem, and
   * `checkGates` is where both answers live.
   *
   * Free here: the DAL has already loaded the user row, and this sits inside
   * React `cache()`.
   *
   * `src/proxy.ts` repeats the email half of this, and deliberately. A segment
   * with a `loading.tsx` has already flushed its shell by the time this runs,
   * and `redirect()` past the first flush becomes a one-second meta refresh
   * rather than a status code. The proxy answers before any of that, and it
   * holds the same row already, so the duplication is free too.
   *
   * This remains the only place `profileGate` runs: that one costs a query the
   * proxy does not otherwise make.
   */
  const gate = await checkGates(user);
  if (gate) redirect(gate.to);

  return user;
}

/**
 * The role lists come from `route-policy.ts`, the same table the proxy reads.
 * Hard-coding them here is how a page ends up admitting a role the proxy has
 * already turned away — or worse, the other way round.
 */
export const requireStudentPage = () => requirePageRole(...rolesFor("/student"));
export const requireFacultyPage = () => requirePageRole(...rolesFor("/faculty"));
export const requireAdminPage = () => requirePageRole(...rolesFor("/admin"));

/**
 * The mirror image: signed-out only.
 *
 * `/login` and `/register` are deliberately outside `config.matcher` — waking
 * the proxy, with its Drizzle import, to redirect a signed-in user off a page
 * they rarely revisit is not worth the cold start. The check is one cached
 * `getSession()` in the page instead.
 */
export async function requireGuestPage(): Promise<void> {
  const user = await getSession();
  if (user) redirect(HOME_FOR_ROLE[user.role]);
}
