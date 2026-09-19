import "server-only";

import { and, asc, eq, lt, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { classes, companies, db, documents, internships, studentProfiles, users } from "@/db";
import { MAX_APPEALS } from "@/lib/validators/appeal.schema";
import type { AppealDecision, AppealQueueItem, InternshipStatus } from "@/types/contracts";

import { Events } from "./verification-event.model";

/**
 * The appeal half of the `internships` lifecycle: raising one, and ruling on it.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NAMING, and why this is a third file over one table.
 *
 * `internship.model.ts` is the student's side of these rows and
 * `verification.model.ts` is the advisor's. An appeal is neither — it is the
 * administrator's, and it is the only path that lets somebody who is not the
 * assigned advisor change a status. Keeping it in its own file means that
 * power is one import away from being noticed in review, rather than buried in
 * a four-hundred-line module about something else.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * There is NO faculty scoping anywhere below, and that absence is the design.
 * An appeal is heard by someone other than the person appealed against, so
 * every read here is college-wide and every controller in front of it says
 * `requireRole("admin")`.
 */

/** What the decision does to the row. */
const NEXT_STATUS = {
  overturn: "verified",
  uphold: "rejected",
} as const satisfies Record<AppealDecision, string>;

/**
 * `users` twice in one query — once as the student, once as their advisor.
 *
 * Drizzle needs a distinct alias for the second reference, or both collapse
 * into one table in the generated SQL and the two join conditions contradict
 * each other, which returns no rows at all.
 */
const advisor = alias(users, "advisor");

const documentCount = sql<number>`(
  select count(*)::int from ${documents} where ${documents.internshipId} = ${internships.id}
)`;

export type AppealRow = {
  id: string;
  studentId: string;
  assignedFacultyId: string | null;
  status: InternshipStatus;
  appealCount: number;
};

export const Appeals = {
  /* ── raising one ───────────────────────────────────────────────────────── */

  /**
   * The student contests a rejection: the status change, the appeal counter and
   * the `appeal` event, in one transaction.
   *
   * Three conditions sit in the WHERE clause rather than in an `if` above it,
   * so a double-clicked button and a stale tab both lose cleanly:
   *
   *   status = 'rejected'        somebody cannot appeal what is not rejected
   *   student_id = the caller    somebody cannot appeal another student's work
   *   appeal_count < MAX_APPEALS the one-appeal rule, enforced at the write
   *
   * Returns false rather than throwing, so the controller owns the error type.
   */
  async raise(params: {
    internshipId: string;
    studentId: string;
    reason: string;
  }): Promise<boolean> {
    const now = new Date();

    return db.transaction(async (tx) => {
      const [row] = await tx
        .update(internships)
        .set({
          status: "appealed",
          appealedAt: now,
          // Read-modify-write in SQL, not in JavaScript. Two tabs appealing at
          // once would otherwise both read 0 and both write 1.
          appealCount: sql`${internships.appealCount} + 1`,
          updatedAt: now,
        })
        .where(
          and(
            eq(internships.id, params.internshipId),
            eq(internships.studentId, params.studentId),
            eq(internships.status, "rejected"),
            lt(internships.appealCount, MAX_APPEALS),
          ),
        )
        .returning({ id: internships.id });

      if (!row) return false;

      await Events.record(tx, {
        internshipId: params.internshipId,
        actorId: params.studentId,
        action: "appeal",
        reason: params.reason,
      });

      return true;
    });
  },

  /* ── the admin queue ───────────────────────────────────────────────────── */

  /**
   * Every appeal waiting on an administrator, oldest first — always, and for
   * the same reason the faculty queue is: a queue that reorders itself is one
   * people skim instead of work through.
   *
   * The advisor's name comes along because it is the first thing the reader
   * wants: an appeal is about a decision, and a decision has an author.
   */
  async queue(): Promise<AppealQueueItem[]> {
    const rows = await db
      .select({
        id: internships.id,
        studentName: users.fullName,
        registerNumber: studentProfiles.registerNumber,
        companyName: companies.name,
        roleTitle: internships.roleTitle,
        appealedAt: internships.appealedAt,
        updatedAt: internships.updatedAt,
        documentCount,
        facultyName: advisor.fullName,
      })
      .from(internships)
      .innerJoin(users, eq(users.id, internships.studentId))
      .innerJoin(studentProfiles, eq(studentProfiles.userId, internships.studentId))
      .innerJoin(companies, eq(companies.id, internships.companyId))
      // Left: `assigned_faculty_id` is non-null on anything past draft, so this
      // always matches in practice — but an inner join here would silently drop
      // an appeal rather than show it with a blank advisor, and a dropped
      // appeal is one nobody ever rules on.
      .leftJoin(advisor, eq(advisor.id, internships.assignedFacultyId))
      .where(eq(internships.status, "appealed"))
      .orderBy(asc(internships.appealedAt), asc(internships.id));

    return rows.map((row) => {
      // `internships_appeal_dated_ck` guarantees the left side. The fallback is
      // for the type checker, not for a row we expect to exist.
      const appealedAt = row.appealedAt ?? row.updatedAt;
      return {
        id: row.id,
        studentName: row.studentName,
        registerNumber: row.registerNumber,
        companyName: row.companyName,
        roleTitle: row.roleTitle,
        appealedAt: appealedAt.toISOString(),
        waitingDays: daysSince(appealedAt),
        documentCount: row.documentCount,
        facultyName: row.facultyName,
      };
    });
  },

  /* ── one appeal ────────────────────────────────────────────────────────── */

  /** The light read a controller does before it judges state. */
  async findForReview(internshipId: string): Promise<AppealRow | null> {
    const [row] = await db
      .select({
        id: internships.id,
        studentId: internships.studentId,
        assignedFacultyId: internships.assignedFacultyId,
        status: internships.status,
        appealCount: internships.appealCount,
      })
      .from(internships)
      .where(eq(internships.id, internshipId))
      .limit(1);

    return row ?? null;
  },

  /** Student, class and the date the appeal was raised. */
  async context(internshipId: string): Promise<{
    studentId: string;
    fullName: string;
    registerNumber: string;
    className: string;
    appealedAt: Date | null;
    facultyName: string | null;
  } | null> {
    const [row] = await db
      .select({
        studentId: internships.studentId,
        fullName: users.fullName,
        registerNumber: studentProfiles.registerNumber,
        className: classes.name,
        appealedAt: internships.appealedAt,
        facultyName: advisor.fullName,
      })
      .from(internships)
      .innerJoin(users, eq(users.id, internships.studentId))
      .innerJoin(studentProfiles, eq(studentProfiles.userId, internships.studentId))
      .innerJoin(classes, eq(classes.id, studentProfiles.classId))
      .leftJoin(advisor, eq(advisor.id, internships.assignedFacultyId))
      .where(eq(internships.id, internshipId))
      .limit(1);

    return row ?? null;
  },

  /* ── the ruling ────────────────────────────────────────────────────────── */

  /**
   * The administrator's decision and its event row, in one transaction.
   *
   * `appeal_count` is deliberately NOT reset. It is a permanent allowance, not
   * a cooldown — an upheld rejection is final, and a student whose appeal
   * succeeded has no reason to need a second one.
   *
   * An overturn writes `verified_by` to the ADMINISTRATOR. The Reality Card
   * names whoever published it, and naming the advisor who rejected it would be
   * a lie on a public page.
   */
  async decide(params: {
    internshipId: string;
    adminId: string;
    decision: AppealDecision;
    reason: string;
  }): Promise<boolean> {
    const now = new Date();
    const overturning = params.decision === "overturn";

    return db.transaction(async (tx) => {
      const [row] = await tx
        .update(internships)
        .set({
          status: NEXT_STATUS[params.decision],
          updatedAt: now,
          // Explore sorts on verifiedAt. Forgetting it publishes a card that
          // sorts to the bottom forever.
          ...(overturning ? { verifiedAt: now, verifiedBy: params.adminId } : {}),
        })
        // The status is the lock. Zero rows back means another administrator
        // ruled first, and the second one gets an honest "already decided"
        // rather than a second event on a settled thread.
        .where(and(eq(internships.id, params.internshipId), eq(internships.status, "appealed")))
        .returning({ id: internships.id });

      if (!row) return false;

      await Events.record(tx, {
        internshipId: params.internshipId,
        actorId: params.adminId,
        action: overturning ? "overturn_appeal" : "uphold_appeal",
        reason: params.reason,
      });

      return true;
    });
  },
};

/* ── helpers ───────────────────────────────────────────────────────────── */

/** Whole days, floored, never negative — the UI does no date maths. */
function daysSince(date: Date): number {
  const ms = Date.now() - date.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}
