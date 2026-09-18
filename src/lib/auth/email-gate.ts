import "server-only";

import type { SessionUser } from "@/types/contracts";

import type { GateRedirect } from "./gates";

/**
 * Hold an unverified account on /verify.
 *
 * Called by `checkGates`, which every role-guarded page guard in `dal.ts` runs.
 * `user.emailVerifiedAt` is already on `SessionUser`, read from the row the DAL
 * has loaded — so this costs no extra query.
 *
 * Two pieces of policy are settled here rather than left to callers:
 *
 * A Google user arrives already verified: the callback stamps
 * `email_verified_at` at link time, because the provider has proved the address
 * and asking a second time only loses people.
 *
 * An unverified account may do nothing else. The alternative — read Explore but
 * do not submit — is kinder, but it puts the rule in every controller instead of
 * in one predicate, and /verify is written on the assumption that whoever lands
 * on it has nowhere else to be.
 *
 * /verify itself is public in `route-policy.ts` and is not role-guarded, so it
 * never runs this gate on itself. That is what keeps the redirect from looping.
 */
export async function emailGate(user: SessionUser): Promise<GateRedirect> {
  if (user.emailVerifiedAt) return null;
  return { to: "/verify", reason: "email-unverified" };
}
