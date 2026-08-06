import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { HOME_FOR_ROLE } from "@/lib/constants/roles";
import { UserModel } from "@/models/user.model";
import type { Role, SessionUser } from "@/types/contracts";

import { ACCESS_COOKIE } from "./cookies";
import { ForbiddenError, UnauthorizedError } from "./errors";
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

  return { id: user.id, fullName: user.fullName, email: user.email, role: user.role };
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
  return user;
}

/** Staff may browse Explore, so faculty and admin pass this too. */
export const requireStudentPage = () => requirePageRole("student", "faculty", "admin");
export const requireFacultyPage = () => requirePageRole("faculty", "admin");
export const requireAdminPage = () => requirePageRole("admin");
