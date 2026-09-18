import "server-only";

import type { SessionUser } from "@/types/contracts";

import { emailGate } from "./email-gate";
import { profileGate } from "./profile-gate";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PRE-WIRED — NOBODY EDITS THIS FILE. Not package B, not package C.
 *
 * Two packages need the same shape of rule: "this user is signed in and holds
 * the right role, but is not finished, so hold them on one page until they
 * are." Package B has it for an OAuth user with no profile yet; package C has
 * it for an address that has not been confirmed.
 *
 * Written twice, that is two people editing `route-policy.ts` and `dal.ts`.
 * Written here once, each package owns one small predicate file and this
 * resolver never changes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Where to send them, and why. `null` means they may proceed. */
export type GateRedirect = { to: string; reason: string } | null;

/**
 * Runs after the role check has already passed, so a gate never has to think
 * about authorisation — only about completeness.
 *
 * Order matters and is fixed here: profile before email. An OAuth user lands
 * with neither a profile nor (briefly) a verified flag, and sending them to
 * /verify first asks them to confirm an address Google already confirmed,
 * before they have even told us who they are.
 *
 * Both predicates return `null` today, so this costs one function call and
 * changes nothing until their owners fill them in.
 */
export async function checkGates(user: SessionUser): Promise<GateRedirect> {
  return (await profileGate(user)) ?? (await emailGate(user)) ?? null;
}
