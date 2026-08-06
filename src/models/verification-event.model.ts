import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";

import { db, verificationEvents, users } from "@/db";
import type { TimelineEntry, VerificationAction } from "@/types/contracts";

/* ── Queries ────────────────────────────────────────────────────────────── */

/**
 * Get the full conversation thread for an internship.
 * Oldest first (chronological order).
 */
export async function listByInternship(
  internshipId: string,
): Promise<TimelineEntry[]> {
  const rows = await db
    .select({
      id: verificationEvents.id,
      actorName: users.fullName,
      actorRole: users.role,
      action: verificationEvents.action,
      reason: verificationEvents.reason,
      createdAt: verificationEvents.createdAt,
    })
    .from(verificationEvents)
    .innerJoin(users, eq(users.id, verificationEvents.actorId))
    .where(eq(verificationEvents.internshipId, internshipId))
    .orderBy(verificationEvents.createdAt);

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
  }));
}

/**
 * Gets the reason text from the *most recent* rejection or change-request.
 * Used on the student dashboard so they know exactly what to fix without
 * having to open the full detail view.
 */
export async function getLatestReason(
  internshipId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ reason: verificationEvents.reason })
    .from(verificationEvents)
    .where(
      and(
        eq(verificationEvents.internshipId, internshipId),
        inArray(verificationEvents.action, ["request_changes", "reject"])
      )
    )
    .orderBy(desc(verificationEvents.createdAt))
    .limit(1);

  return row?.reason ?? null;
}

/* ── Mutations ──────────────────────────────────────────────────────────── */

/**
 * Append a new event to the timeline.
 */
export async function create(data: {
  internshipId: string;
  actorId: string;
  action: VerificationAction;
  reason: string | null;
}): Promise<void> {
  await db.insert(verificationEvents).values(data);
}
