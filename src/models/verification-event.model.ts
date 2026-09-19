import "server-only";

import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { db, users, verificationEvents } from "@/db";
import type { Role, TimelineEntry, VerificationAction } from "@/types/contracts";

/**
 * The verification thread — every advisor decision and every student reply, in
 * order, for one internship.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SHARED FILE. Package 3 owns it; package 2 imports `Events.record()` to write
 * the student's `respond` event. Do not create a second module for this.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** `db` or an open transaction — a decision writes its event inside the tx. */
export type Executor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export type NewEvent = {
  internshipId: string;
  actorId: string;
  action: VerificationAction;
  /** Required for everything except `verify`. The database enforces it too. */
  reason: string | null;
};

export const Events = {
  /**
   * Append one event. Pass the transaction when it accompanies a status change:
   * a decision without its reason row is unexplainable to the student, and a
   * reason without the status change is a lie.
   */
  async record(executor: Executor, event: NewEvent): Promise<void> {
    await executor.insert(verificationEvents).values({
      internshipId: event.internshipId,
      actorId: event.actorId,
      action: event.action,
      reason: event.reason,
    });
  },

  /** One internship's thread, oldest first. */
  async timelineFor(internshipId: string): Promise<TimelineEntry[]> {
    const rows = await Events.forInternships([internshipId]);
    return rows.map(stripInternshipId);
  },

  /**
   * Every event for several internships at once, oldest first. Callers group
   * by `internshipId` — one query beats one per row.
   */
  async forInternships(
    internshipIds: string[],
  ): Promise<(TimelineEntry & { internshipId: string })[]> {
    if (internshipIds.length === 0) return [];

    const rows = await db
      .select({
        id: verificationEvents.id,
        internshipId: verificationEvents.internshipId,
        action: verificationEvents.action,
        reason: verificationEvents.reason,
        createdAt: verificationEvents.createdAt,
        actorName: users.fullName,
        actorRole: users.role,
      })
      .from(verificationEvents)
      .innerJoin(users, eq(users.id, verificationEvents.actorId))
      .where(inArray(verificationEvents.internshipId, internshipIds))
      .orderBy(asc(verificationEvents.createdAt), asc(verificationEvents.id));

    return rows.map((row) => ({
      id: row.id,
      internshipId: row.internshipId,
      actorName: row.actorName,
      actorRole: row.actorRole as Role,
      action: row.action as VerificationAction,
      reason: row.reason,
      createdAt: row.createdAt.toISOString(),
    }));
  },
};

function stripInternshipId(row: TimelineEntry & { internshipId: string }): TimelineEntry {
  return {
    id: row.id,
    actorName: row.actorName,
    actorRole: row.actorRole,
    action: row.action,
    reason: row.reason,
    createdAt: row.createdAt,
  };
}

/** Group a flat event list by internship, preserving oldest-first order. */
export function groupTimelines(
  rows: (TimelineEntry & { internshipId: string })[],
): Map<string, TimelineEntry[]> {
  const grouped = new Map<string, TimelineEntry[]>();
  for (const row of rows) {
    const list = grouped.get(row.internshipId) ?? [];
    list.push(stripInternshipId(row));
    grouped.set(row.internshipId, list);
  }
  return grouped;
}

/**
 * Which actions carry the answer to "what is standing in my way?".
 *
 * `verify` never has a reason and `respond` and `appeal` are the student's own
 * words, so none of them belongs here. `uphold_appeal` does: it is the last
 * word anybody will write on that internship, and a student who sees only the
 * advisor's original reason has not been told that the appeal failed.
 *
 * `overturn_appeal` is absent for the same reason `verify` is — it publishes
 * the card, and a published card has nothing standing in its way.
 */
const REASON_BEARING = new Set<VerificationAction>([
  "request_changes",
  "reject",
  "uphold_appeal",
]);

/**
 * The newest blocking reason per internship — what
 * `InternshipListItem.latestReason` shows.
 */
export function latestReasons(
  rows: (TimelineEntry & { internshipId: string })[],
): Map<string, string> {
  const latest = new Map<string, string>();
  for (const row of rows) {
    if (!REASON_BEARING.has(row.action)) continue;
    if (!row.reason) continue;
    // Rows arrive oldest first, so the last write wins.
    latest.set(row.internshipId, row.reason);
  }
  return latest;
}

/* ── package 2's flat API ───────────────────────────────────────────────────
 * The student backend imports this module as `* as VerificationEvent` and
 * calls plain functions. They are thin wrappers over `Events` above rather
 * than a second implementation — one query shape, one place to fix it.
 * ────────────────────────────────────────────────────────────────────────── */

/** `Events.record` against the default connection, for the non-transactional case. */
export async function create(event: NewEvent): Promise<void> {
  await Events.record(db, event);
}

/** One internship's thread, oldest first. */
export async function listByInternship(internshipId: string): Promise<TimelineEntry[]> {
  return Events.timelineFor(internshipId);
}

/**
 * The newest blocking reason for one internship. The SQL twin of
 * `latestReasons` above, and the action list has to match it — see the note on
 * `REASON_BEARING` for why `uphold_appeal` counts and `appeal` does not.
 */
export async function getLatestReason(internshipId: string): Promise<string | null> {
  const [row] = await db
    .select({ reason: verificationEvents.reason })
    .from(verificationEvents)
    .where(
      and(
        eq(verificationEvents.internshipId, internshipId),
        inArray(verificationEvents.action, [...REASON_BEARING]),
      ),
    )
    .orderBy(desc(verificationEvents.createdAt), desc(verificationEvents.id))
    .limit(1);

  return row?.reason ?? null;
}
