import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { internshipReports } from "@/db/schema/reports";
import type { InternshipReport } from "@/db/schema/reports";

/**
 * Queries for `internship_reports`. Owner: package D.
 *
 * Append-only, like the rest of the schema: `create` inserts, nothing updates,
 * nothing deletes. "The report" is whichever row is newest.
 */

/** The current report for an internship, or null if none has been generated. */
export async function findLatestByInternship(
  internshipId: string,
): Promise<InternshipReport | null> {
  const [row] = await db
    .select()
    .from(internshipReports)
    .where(eq(internshipReports.internshipId, internshipId))
    .orderBy(desc(internshipReports.createdAt))
    .limit(1);
  return row ?? null;
}

export async function create(data: {
  internshipId: string;
  content: string;
  model: string;
  promptVersion: number;
  generatedBy: string;
}): Promise<InternshipReport> {
  const [row] = await db.insert(internshipReports).values(data).returning();
  return row;
}

/** Every report ever generated for an internship, newest first. */
export async function listByInternship(
  internshipId: string,
): Promise<InternshipReport[]> {
  return db
    .select()
    .from(internshipReports)
    .where(eq(internshipReports.internshipId, internshipId))
    .orderBy(desc(internshipReports.createdAt));
}
