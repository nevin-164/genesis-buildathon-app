import "server-only";

import { eq } from "drizzle-orm";

import { db, studentProfiles, classes, batches, departments } from "@/db";

/* ── Queries ────────────────────────────────────────────────────────────── */

/**
 * Returns the student profile joined with class and class-advisor info.
 * Left-joins classes so a student without a class still returns a row.
 * Returns null if the user has no student profile at all.
 */
export async function findByUserId(userId: string) {
  const [row] = await db
    .select({
      userId: studentProfiles.userId,
      registerNumber: studentProfiles.registerNumber,
      classId: studentProfiles.classId,
      advisorOverrideId: studentProfiles.advisorOverrideId,
      className: classes.name,
      classAdvisorId: classes.advisorId,
    })
    .from(studentProfiles)
    .leftJoin(classes, eq(classes.id, studentProfiles.classId))
    .where(eq(studentProfiles.userId, userId))
    .limit(1);
  return row ?? null;
}

/**
 * Build a human-readable batch label like "CSE 2022-2026" for Explore cards.
 * Returns null if the student has no class assignment.
 */
export async function getBatchLabel(userId: string): Promise<string | null> {
  const [row] = await db
    .select({
      departmentCode: departments.code,
      batchName: batches.name,
    })
    .from(studentProfiles)
    .innerJoin(classes, eq(classes.id, studentProfiles.classId))
    .innerJoin(batches, eq(batches.id, classes.batchId))
    .innerJoin(departments, eq(departments.id, batches.departmentId))
    .where(eq(studentProfiles.userId, userId))
    .limit(1);

  if (!row) return null;
  return `${row.departmentCode} ${row.batchName}`;
}
