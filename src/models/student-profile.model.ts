import "server-only";

import { and, eq, isNull, or } from "drizzle-orm";

import { batches, classes, db, departments, studentProfiles, users } from "@/db";
import type { AssignmentSource } from "@/db/schema/enums";

/** `student_profiles`, plus the two columns that decide who advises whom. */

export type StudentRouting = {
  userId: string;
  classId: string | null;
  advisorOverrideId: string | null;
  /** The advisor of the student's class, if they have one. */
  classAdvisorId: string | null;
};

export type RosterRow = {
  id: string;
  fullName: string;
  email: string;
  registerNumber: string;
  className: string | null;
};

export const StudentProfiles = {
  /** Everything `resolveAdvisor` needs, in one read. */
  async routingFor(studentId: string): Promise<StudentRouting | null> {
    const [row] = await db
      .select({
        userId: studentProfiles.userId,
        classId: studentProfiles.classId,
        advisorOverrideId: studentProfiles.advisorOverrideId,
        classAdvisorId: classes.advisorId,
      })
      .from(studentProfiles)
      .leftJoin(classes, eq(classes.id, studentProfiles.classId))
      .where(eq(studentProfiles.userId, studentId))
      .limit(1);

    return row ?? null;
  },

  /**
   * The roster: students this faculty member advises.
   *
   * This is the one query that walks the tree **live** rather than reading a
   * frozen column, because it has to list students who have never submitted
   * anything — there is no internship row to read an advisor off.
   *
   *   advisor_override_id = me
   *     OR (advisor_override_id IS NULL AND their class's advisor_id = me)
   *
   * The `IS NULL` half matters: an override is meant to *beat* the class
   * advisor, so without it a student with an override would still appear on
   * their class advisor's roster.
   *
   * Deactivated students are excluded. They cannot sign in or submit anything,
   * so nothing about them is actionable by an advisor, and counting them would
   * inflate "not submitted" with people who never will.
   *
   * `facultyId === null` means an admin is asking, and gets every student.
   */
  async roster(facultyId: string | null): Promise<RosterRow[]> {
    const advisedByMe = facultyId
      ? or(
          eq(studentProfiles.advisorOverrideId, facultyId),
          and(isNull(studentProfiles.advisorOverrideId), eq(classes.advisorId, facultyId)),
        )
      : undefined;

    return db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        registerNumber: studentProfiles.registerNumber,
        className: classes.name,
      })
      .from(studentProfiles)
      .innerJoin(users, eq(users.id, studentProfiles.userId))
      .leftJoin(classes, eq(classes.id, studentProfiles.classId))
      .where(and(eq(users.isActive, true), advisedByMe))
      .orderBy(users.fullName);
  },

  /** Does this faculty member advise this student? Admins bypass the question. */
  async isAdvisedBy(studentId: string, facultyId: string): Promise<boolean> {
    const routing = await StudentProfiles.routingFor(studentId);
    if (!routing) return false;
    if (routing.advisorOverrideId) return routing.advisorOverrideId === facultyId;
    return routing.classAdvisorId === facultyId;
  },

  /** The direct override — the admin's preventive tool. Null clears it. */
  async setAdvisorOverride(studentId: string, facultyId: string | null): Promise<boolean> {
    const [row] = await db
      .update(studentProfiles)
      .set({ advisorOverrideId: facultyId })
      .where(eq(studentProfiles.userId, studentId))
      .returning({ userId: studentProfiles.userId });
    return row !== undefined;
  },

  /**
   * Move a student between classes. Null removes them from any class.
   *
   * Deliberately touches nothing else. An internship's advisor was resolved at
   * submit time and frozen onto its row; re-pointing it here would take a
   * decision away from whoever is mid-review.
   */
  async setClass(studentId: string, classId: string | null): Promise<boolean> {
    const [row] = await db
      .update(studentProfiles)
      .set({ classId })
      .where(eq(studentProfiles.userId, studentId))
      .returning({ userId: studentProfiles.userId });
    return row !== undefined;
  },
};

/** How an advisor was decided, for `internships.assignment_source`. */
export type ResolvedAdvisor = { facultyId: string; source: AssignmentSource };

/* ── package 2's flat API ───────────────────────────────────────────────────
 * The student backend imports this module as `* as StudentProfiles` and calls
 * plain functions. `routingFor` above answers "who advises this student"; these
 * two answer "who is this student", which the explore cards and the dashboard
 * need and routing does not carry.
 * ────────────────────────────────────────────────────────────────────────── */

export type StudentProfileRow = {
  userId: string;
  registerNumber: string;
  classId: string | null;
  advisorOverrideId: string | null;
  className: string | null;
  classAdvisorId: string | null;
};

/**
 * The profile plus its class and that class's advisor.
 *
 * `classes` is left-joined on purpose: a student with no class still has a
 * profile, and returning null for the whole row would read as "no such
 * student".
 */
export async function findByUserId(userId: string): Promise<StudentProfileRow | null> {
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
 * "CSE 2022-2026" — the line under a student's name on an Explore card.
 * Inner joins, so a student with no class simply has no label.
 */
export async function getBatchLabel(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ departmentCode: departments.code, batchName: batches.name })
    .from(studentProfiles)
    .innerJoin(classes, eq(classes.id, studentProfiles.classId))
    .innerJoin(batches, eq(batches.id, classes.batchId))
    .innerJoin(departments, eq(departments.id, batches.departmentId))
    .where(eq(studentProfiles.userId, userId))
    .limit(1);

  return row ? `${row.departmentCode} ${row.batchName}` : null;
}
