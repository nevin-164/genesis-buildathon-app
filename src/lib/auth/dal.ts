import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { HOME_FOR_ROLE } from "@/lib/constants/roles";
import type { Role, SessionUser } from "@/types/contracts";

import { ForbiddenError, UnauthorizedError } from "./errors";

/* ────────────────────────────────────────────────────────────────────────────
 * TEMPORARY — package 1 (Auth) replaces the body of getSession() with the real
 * cookie + JWT check. Everything below this comment stays exactly as it is.
 *
 * Until then, set DEV_FAKE_ROLE in .env.local to work on your screens without
 * a login page existing:
 *
 *     DEV_FAKE_ROLE=student      # or faculty, or admin
 *
 * The switch is ignored unless NODE_ENV is "development", so it can never
 * become a login bypass in a deployed build.
 * ──────────────────────────────────────────────────────────────────────────── */

const DEV_USERS: Record<Role, SessionUser> = {
  student: {
    id: "11111111-1111-4111-8111-111111111111",
    fullName: "Priya Nair",
    email: "priya@example.com",
    role: "student",
  },
  faculty: {
    id: "22222222-2222-4222-8222-222222222222",
    fullName: "Dr. Meera Raghunathan",
    email: "meera@example.com",
    role: "faculty",
  },
  admin: {
    id: "33333333-3333-4333-8333-333333333333",
    fullName: "System Administrator",
    email: "admin@example.com",
    role: "admin",
  },
};

function devSession(): SessionUser | null {
  if (process.env.NODE_ENV !== "development") return null;
  const role = process.env.DEV_FAKE_ROLE;
  if (role === "student" || role === "faculty" || role === "admin") {
    return DEV_USERS[role];
  }
  return null;
}

/**
 * The one place a session is resolved.
 *
 * Wrapped in React `cache()` so the shell, the page and every leaf component
 * share one lookup per render. Returns null instead of redirecting, because
 * leaf components need a value, not navigation.
 */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  return devSession();
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
