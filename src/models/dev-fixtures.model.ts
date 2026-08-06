import "server-only";

import { and, eq, like } from "drizzle-orm";

import {
  classes,
  companies,
  db,
  documents,
  internships,
  studentProfiles,
  users,
  verificationEvents,
} from "@/db";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DELETE THIS FILE together with `src/app/(dev)/` before the frontend packages
 * merge. It exists only to feed `/dev/checks`.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Why it exists at all: the authorisation checks need an internship belonging
 * to a *different* faculty member than the one signed in, and the seed assigns
 * every internship to Dr. Meera or to nobody. `src/db/seed.ts` is package 1's
 * file, so rather than edit it the harness makes its own rows and removes them
 * again.
 *
 * It lives in `src/models/` rather than inside `(dev)/` on purpose: this is
 * Drizzle code, and models are the only layer allowed to import `@/db`. A
 * throwaway is not a reason to put a query somewhere a query may not go.
 */

/** Every scratch row is tagged so a crashed run can be cleaned up by hand. */
export const SCRATCH_TAG = "__dev_scratch__";

export type Scratch = {
  internshipId: string;
  companyId: string;
};

export const DevFixtures = {
  /** A second faculty member — anyone who is not the signed-in one. */
  async someOtherFaculty(notUserId: string): Promise<{ id: string; fullName: string } | null> {
    const rows = await db
      .select({ id: users.id, fullName: users.fullName })
      .from(users)
      .where(and(eq(users.role, "faculty"), eq(users.isActive, true)))
      .limit(10);

    return rows.find((row) => row.id !== notUserId) ?? null;
  },

  /**
   * A student this faculty member does NOT advise — neither by override nor
   * through their class. Check 13 needs one to prove that asking about someone
   * else's student returns NotFoundError rather than their history.
   */
  async studentNotAdvisedBy(facultyId: string): Promise<{ id: string } | null> {
    const rows = await db
      .select({
        id: users.id,
        advisorOverrideId: studentProfiles.advisorOverrideId,
        classAdvisorId: classes.advisorId,
      })
      .from(studentProfiles)
      .innerJoin(users, eq(users.id, studentProfiles.userId))
      .leftJoin(classes, eq(classes.id, studentProfiles.classId))
      .where(eq(users.isActive, true));

    const stranger = rows.find((row) =>
      row.advisorOverrideId
        ? row.advisorOverrideId !== facultyId
        : row.classAdvisorId !== facultyId,
    );

    return stranger ? { id: stranger.id } : null;
  },

  async anyStudent(): Promise<{ id: string } | null> {
    const [row] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, "student"), eq(users.isActive, true)))
      .limit(1);
    return row ?? null;
  },

  /**
   * A submitted internship assigned to `facultyId`, plus a company to hang it
   * on. Always paired with `remove()` in a finally block.
   */
  async createSubmittedInternship(params: {
    studentId: string;
    facultyId: string | null;
  }): Promise<Scratch> {
    const [company] = await db
      .insert(companies)
      .values({
        // The unique index is on name, so make it collision-proof per run.
        name: `${SCRATCH_TAG} ${crypto.randomUUID()}`,
        location: "Nowhere",
      })
      .returning({ id: companies.id });

    const [internship] = await db
      .insert(internships)
      .values({
        studentId: params.studentId,
        companyId: company.id,
        assignedFacultyId: params.facultyId,
        assignmentSource: params.facultyId ? "manual" : null,
        status: "submitted",
        roleTitle: `${SCRATCH_TAG} role`,
        domain: "web",
        workMode: "remote",
        startDate: "2026-01-05",
        endDate: "2026-03-05",
        durationWeeks: 8,
        workNature: "guided_project",
        workSummary: "Scratch row created by /dev/checks. Safe to delete.",
        submittedAt: new Date(),
      })
      .returning({ id: internships.id });

    return { internshipId: internship.id, companyId: company.id };
  },

  /** Read back the columns a check needs to assert on. */
  async readInternship(internshipId: string) {
    const [row] = await db
      .select({
        id: internships.id,
        status: internships.status,
        assignedFacultyId: internships.assignedFacultyId,
        assignmentSource: internships.assignmentSource,
        verifiedAt: internships.verifiedAt,
        verifiedBy: internships.verifiedBy,
      })
      .from(internships)
      .where(eq(internships.id, internshipId))
      .limit(1);
    return row ?? null;
  },

  async countEvents(internshipId: string): Promise<number> {
    const rows = await db
      .select({ id: verificationEvents.id })
      .from(verificationEvents)
      .where(eq(verificationEvents.internshipId, internshipId));
    return rows.length;
  },

  async readUser(userId: string) {
    const [row] = await db
      .select({
        id: users.id,
        isActive: users.isActive,
        sessionVersion: users.sessionVersion,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return row ?? null;
  },

  /**
   * Remove a scratch internship and its company.
   *
   * `verification_events` and `documents` cascade from the internship, so they
   * go with it. The company is deleted afterwards, once nothing references it —
   * `internships.company_id` is ON DELETE RESTRICT.
   */
  async remove(scratch: Scratch): Promise<void> {
    await db.delete(documents).where(eq(documents.internshipId, scratch.internshipId));
    await db
      .delete(verificationEvents)
      .where(eq(verificationEvents.internshipId, scratch.internshipId));
    await db.delete(internships).where(eq(internships.id, scratch.internshipId));
    await db.delete(companies).where(eq(companies.id, scratch.companyId));
  },

  /** Belt and braces: sweep anything an interrupted run left behind. */
  async sweep(): Promise<number> {
    const stale = await db
      .select({ id: internships.id, companyId: internships.companyId })
      .from(internships)
      .where(like(internships.roleTitle, `${SCRATCH_TAG}%`));

    for (const row of stale) {
      await DevFixtures.remove({ internshipId: row.id, companyId: row.companyId });
    }

    const orphanCompanies = await db
      .select({ id: companies.id })
      .from(companies)
      .where(like(companies.name, `${SCRATCH_TAG}%`));

    for (const company of orphanCompanies) {
      await db.delete(companies).where(eq(companies.id, company.id));
    }

    return stale.length;
  },
};
