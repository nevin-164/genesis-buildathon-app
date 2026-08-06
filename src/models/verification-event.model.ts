import "server-only";

import { asc, eq, inArray } from "drizzle-orm";

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
 * The newest change-request or rejection reason per internship — what
 * `InternshipListItem.latestReason` shows.
 *
 * `verify` never carries a reason and `respond` is the student's own words, so
 * neither belongs here: this field answers "what am I being asked to fix?".
 */
export function latestReasons(
  rows: (TimelineEntry & { internshipId: string })[],
): Map<string, string> {
  const latest = new Map<string, string>();
  for (const row of rows) {
    if (row.action !== "request_changes" && row.action !== "reject") continue;
    if (!row.reason) continue;
    // Rows arrive oldest first, so the last write wins.
    latest.set(row.internshipId, row.reason);
  }
  return latest;
}
