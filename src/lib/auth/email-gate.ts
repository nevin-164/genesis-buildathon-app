import "server-only";

import type { SessionUser } from "@/types/contracts";

import type { GateRedirect } from "./gates";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SEAM FILE — owner: package C (email verification).
 *
 * Already called by `checkGates`, which is already called by every page guard
 * in `dal.ts`. Package C replaces this body and nothing else in the auth layer
 * changes.
 *
 * Nobody outside package C edits this file.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Hold an unverified account on /verify.
 *
 * `user.emailVerifiedAt` is already on `SessionUser`, read from the row the DAL
 * has loaded — so this costs no extra query.
 *
 * The real body is roughly:
 *
 *   if (user.emailVerifiedAt) return null;
 *   return { to: "/verify", reason: "email-unverified" };
 *
 * Two things to settle before writing it, because they are policy, not code.
 * First: an OAuth user arrives already verified — package B stamps
 * `email_verified_at` at link time, since Google has proved the address and
 * asking twice only loses people. Second: decide what an unverified student may
 * still do. Locking them out of everything is simplest and is what /verify
 * assumes; letting them read Explore but not submit an internship is kinder and
 * means this returns null and the controller carries the rule instead.
 */
export async function emailGate(user: SessionUser): Promise<GateRedirect> {
  if (user.emailVerifiedAt) return null;
  return { to: "/verify", reason: "email-unverified" };
}
