import "server-only";

import { and, eq, exists, or, sql } from "drizzle-orm";

import { batches, classes, db, departments, internships, studentProfiles, users } from "@/db";

/** `student_profiles`, plus the column that decides who advises whom. */

export type StudentRouting = {
  userId: string;
  classId: string;
  /** The advisor of the student's class. Never null — see `db/schema/org.ts`. */
  classAdvisorId: string;
};

export type RosterRow = {
  id: string;
  fullName: string;
  email: string;
  registerNumber: string;
  className: string;
};

export const StudentProfiles = {
  /**
   * Everything `resolveAdvisor` needs, in one read.
   *
   * `innerJoin`, not left: a student always has a class and a class always has
   * an advisor. A missing row here means the student id was wrong, not that
   * they are unrouted.
   */
  async routingFor(studentId: string): Promise<StudentRouting | null> {
    const [row] = await db
      .select({
        userId: studentProfiles.userId,
        classId: studentProfiles.classId,
        classAdvisorId: classes.advisorId,
      })
      .from(studentProfiles)
      .innerJoin(classes, eq(classes.id, studentProfiles.classId))
      .where(eq(studentProfiles.userId, studentId))
      .limit(1);

    return row ?? null;
  },

  /**
   * The roster: students this faculty member advises **right now**.
   *
   * This is the one query that walks the tree live rather than reading the
   * frozen column on the internship, because it has to list students who have
   * never submitted anything — there is no internship row to read an advisor
   * off. So it deliberately disagrees with the verification queue after a
   * handover: the new advisor gets the students immediately, the old one keeps
   * the internships already submitted to them. Both halves are correct, and
   * the faculty dashboard labels them separately for exactly that reason.
   *
   * Deactivated students are excluded. They cannot sign in or submit anything,
   * so nothing about them is actionable, and counting them would inflate
   * "not submitted" with people who never will.
   *
   * `facultyId === null` means an admin is asking, and gets every student.
   */
  async roster(facultyId: string | null): Promise<RosterRow[]> {
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
      .innerJoin(classes, eq(classes.id, studentProfiles.classId))
      .where(
        and(eq(users.isActive, true), facultyId ? eq(classes.advisorId, facultyId) : undefined),
      )
      .orderBy(users.fullName);
  },

  /** One roster row by id, with no advisor scoping. The caller authorises. */
  async rosterRow(studentId: string): Promise<RosterRow | null> {
    const [row] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        registerNumber: studentProfiles.registerNumber,
        className: classes.name,
      })
      .from(studentProfiles)
      .innerJoin(users, eq(users.id, studentProfiles.userId))
      .innerJoin(classes, eq(classes.id, studentProfiles.classId))
      .where(eq(studentProfiles.userId, studentId))
      .limit(1);

    return row ?? null;
  },

  /**
   * May this faculty member look at this student? Two ways to qualify, and the
   * second is not optional:
   *
   *   1. they advise the student's class today, or
   *   2. they own at least one of the student's internships.
   *
   * (2) is what makes a handover survivable. An internship keeps the advisor it
   * was submitted to, so after a class changes hands the old advisor still has
   * live items in their queue — and without this arm, clicking the student's
   * name from that queue would 404 on their own work.
   *
   * One query, not two: the EXISTS is cheap and covered by
   * `internships_student_idx`.
   */
  async isAdvisedBy(studentId: string, facultyId: string): Promise<boolean> {
    const [row] = await db
      .select({ userId: studentProfiles.userId })
      .from(studentProfiles)
      .innerJoin(classes, eq(classes.id, studentProfiles.classId))
      .where(
        and(
          eq(studentProfiles.userId, studentId),
          or(
            eq(classes.advisorId, facultyId),
            exists(
              db
                .select({ one: sql`1` })
                .from(internships)
                .where(
                  and(
                    eq(internships.studentId, studentId),
                    eq(internships.assignedFacultyId, facultyId),
                  ),
                ),
            ),
          ),
        ),
      )
      .limit(1);

    return row !== undefined;
  },

  /**
   * Move a student between classes.
   *
   * Deliberately touches nothing else. An internship's advisor was resolved at
   * submit time and frozen onto its row; re-pointing it here would take a
   * decision away from whoever is mid-review.
   */
  async setClass(studentId: string, classId: string): Promise<boolean> {
    const [row] = await db
      .update(studentProfiles)
      .set({ classId })
      .where(eq(studentProfiles.userId, studentId))
      .returning({ userId: studentProfiles.userId });
    return row !== undefined;
  },
};

/** How an advisor was decided, for `internships.assignment_source`. */
export type ResolvedAdvisor = { facultyId: string; source: "class" };

/* ── package 2's flat API ───────────────────────────────────────────────────
 * The student backend imports this module as `* as StudentProfiles` and calls
 * plain functions. `routingFor` above answers "who advises this student"; these
 * two answer "who is this student", which the explore cards and the dashboard
 * need and routing does not carry.
 * ────────────────────────────────────────────────────────────────────────── */

export type StudentProfileRow = {
  userId: string;
  registerNumber: string;
  classId: string;
  className: string;
  classAdvisorId: string;
};

export async function findByUserId(userId: string): Promise<StudentProfileRow | null> {
  const [row] = await db
    .select({
      userId: studentProfiles.userId,
      registerNumber: studentProfiles.registerNumber,
      classId: studentProfiles.classId,
      className: classes.name,
      classAdvisorId: classes.advisorId,
    })
    .from(studentProfiles)
    .innerJoin(classes, eq(classes.id, studentProfiles.classId))
    .where(eq(studentProfiles.userId, userId))
    .limit(1);

  return row ?? null;
}

/** "CSE 2022-2026" — the line under a student's name on an Explore card. */
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
