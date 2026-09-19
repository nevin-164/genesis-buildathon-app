import "server-only";

import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";

import { classes, companies, db, documents, internships, studentProfiles, users } from "@/db";
import type {
  DocumentRef,
  InternshipDetail,
  InternshipListItem,
  InternshipStatus,
  QueueItem,
  VerificationDetail,
} from "@/types/contracts";

import { Events, groupTimelines, latestReasons } from "./verification-event.model";

/**
 * Every `internships` read and write package 3 needs.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NAMING. Named for the concern, not the table, because `internship.model.ts`
 * belongs to package 2 — they own the student's side of the same rows. Two
 * packages creating one filename is an add/add merge conflict; two files over
 * one table is not a problem, because both go through the same schema.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Faculty scoping always reads `assigned_faculty_id`, the column frozen at
 * submit time — never the live org tree. A student who changes class in June
 * must not drag a March internship away from the advisor verifying it.
 *
 * A `facultyId` of `null` means an admin is asking, and the scope is dropped.
 */

const NEXT_STATUS = {
  verify: "verified",
  request_changes: "changes_requested",
  reject: "rejected",
} as const satisfies Record<string, InternshipStatus>;

const documentCount = sql<number>`(
  select count(*)::int from ${documents} where ${documents.internshipId} = ${internships.id}
)`;

export type ReviewRow = {
  id: string;
  studentId: string;
  assignedFacultyId: string | null;
  status: InternshipStatus;
};

export const Verification = {
  /* ── counters ────────────────────────────────────────────────────────── */

  /** One grouped query rather than four counts. */
  async statusCounts(facultyId: string | null): Promise<Record<InternshipStatus, number>> {
    const rows = await db
      .select({ status: internships.status, value: count() })
      .from(internships)
      .where(facultyId ? eq(internships.assignedFacultyId, facultyId) : undefined)
      .groupBy(internships.status);

    const counts: Record<InternshipStatus, number> = {
      draft: 0,
      submitted: 0,
      changes_requested: 0,
      verified: 0,
      rejected: 0,
      appealed: 0,
    };
    for (const row of rows) counts[row.status] = row.value;
    return counts;
  },

  /**
   * The status shown next to a student on the roster.
   *
   * A student may have several internships — the seed deliberately gives one
   * of them a verified and a draft row — but `AssignedStudent.internshipStatus`
   * is a single value. It is defined as **the most recently created one**, and
   * that definition lives here so the roster and the counters cannot drift.
   */
  async latestStatusByStudent(studentIds: string[]): Promise<Map<string, InternshipStatus>> {
    if (studentIds.length === 0) return new Map();

    const rows = await db
      .select({
        studentId: internships.studentId,
        status: internships.status,
      })
      .from(internships)
      .where(inArray(internships.studentId, studentIds))
      .orderBy(desc(internships.createdAt), desc(internships.id));

    const latest = new Map<string, InternshipStatus>();
    for (const row of rows) {
      // Rows arrive newest first, so the first one seen per student wins.
      if (!latest.has(row.studentId)) latest.set(row.studentId, row.status);
    }
    return latest;
  },

  /* ── the queue ───────────────────────────────────────────────────────── */

  /**
   * Everything waiting on this advisor, oldest first — always. A queue that
   * reorders itself is a queue people skim instead of work through.
   */
  async queue(facultyId: string | null): Promise<QueueItem[]> {
    const rows = await db
      .select({
        id: internships.id,
        studentName: users.fullName,
        registerNumber: studentProfiles.registerNumber,
        companyName: companies.name,
        roleTitle: internships.roleTitle,
        submittedAt: internships.submittedAt,
        createdAt: internships.createdAt,
        documentCount,
      })
      .from(internships)
      .innerJoin(users, eq(users.id, internships.studentId))
      // Inner: a student always has a profile, and it always has a class with
      // an advisor. A left join here would be pretending otherwise.
      .innerJoin(studentProfiles, eq(studentProfiles.userId, internships.studentId))
      .innerJoin(companies, eq(companies.id, internships.companyId))
      .where(
        and(
          eq(internships.status, "submitted"),
          facultyId ? eq(internships.assignedFacultyId, facultyId) : undefined,
        ),
      )
      .orderBy(asc(internships.submittedAt), asc(internships.id));

    return rows.map((row) => {
      const submittedAt = row.submittedAt ?? row.createdAt;
      return {
        id: row.id,
        studentName: row.studentName,
        registerNumber: row.registerNumber,
        companyName: row.companyName,
        roleTitle: row.roleTitle,
        submittedAt: submittedAt.toISOString(),
        waitingDays: daysSince(submittedAt),
        documentCount: row.documentCount,
      };
    });
  },

  /* ── one internship ──────────────────────────────────────────────────── */

  /** The light read a controller does before it judges ownership and state. */
  async findForReview(internshipId: string): Promise<ReviewRow | null> {
    const [row] = await db
      .select({
        id: internships.id,
        studentId: internships.studentId,
        assignedFacultyId: internships.assignedFacultyId,
        status: internships.status,
      })
      .from(internships)
      .where(eq(internships.id, internshipId))
      .limit(1);

    return row ?? null;
  },

  async detail(internshipId: string): Promise<VerificationDetail | null> {
    const [row] = await db
      .select({
        internship: internships,
        companyName: companies.name,
        studentName: users.fullName,
        registerNumber: studentProfiles.registerNumber,
        className: classes.name,
      })
      .from(internships)
      .innerJoin(companies, eq(companies.id, internships.companyId))
      .innerJoin(users, eq(users.id, internships.studentId))
      .innerJoin(studentProfiles, eq(studentProfiles.userId, internships.studentId))
      .innerJoin(classes, eq(classes.id, studentProfiles.classId))
      .where(eq(internships.id, internshipId))
      .limit(1);

    if (!row) return null;

    const [docs, events, facultyName] = await Promise.all([
      listDocuments(internshipId),
      Events.forInternships([internshipId]),
      row.internship.assignedFacultyId
        ? nameOf(row.internship.assignedFacultyId)
        : Promise.resolve(null),
    ]);

    return {
      internship: toDetail(row.internship, {
        companyName: row.companyName,
        facultyName,
        documents: docs,
        timeline: groupTimelines(events).get(internshipId) ?? [],
        latestReason: latestReasons(events).get(internshipId) ?? null,
      }),
      student: {
        id: row.internship.studentId,
        fullName: row.studentName,
        registerNumber: row.registerNumber,
        className: row.className,
      },
    };
  },

  /** A student's internships, newest first — the faculty-facing history list. */
  async listByStudent(studentId: string): Promise<InternshipListItem[]> {
    const rows = await db
      .select({
        id: internships.id,
        companyName: companies.name,
        roleTitle: internships.roleTitle,
        status: internships.status,
        submittedAt: internships.submittedAt,
      })
      .from(internships)
      .innerJoin(companies, eq(companies.id, internships.companyId))
      .where(eq(internships.studentId, studentId))
      .orderBy(desc(internships.createdAt), desc(internships.id));

    const reasons = latestReasons(await Events.forInternships(rows.map((r) => r.id)));

    return rows.map((row) => ({
      id: row.id,
      companyName: row.companyName,
      roleTitle: row.roleTitle,
      status: row.status,
      submittedAt: row.submittedAt?.toISOString() ?? null,
      latestReason: reasons.get(row.id) ?? null,
    }));
  },

  /* ── the decision ────────────────────────────────────────────────────── */

  /**
   * The status change and its event row, in one transaction.
   *
   * The current status sits in the WHERE clause as a lock. Zero rows back means
   * somebody changed it first — a double-clicked Verify produces one decision
   * and one honest "already changed" message, never two published cards.
   *
   * Returns false rather than throwing so the controller owns the error type.
   */
  async decide(params: {
    internshipId: string;
    actorId: string;
    /** null when an admin is acting — the ownership condition is dropped. */
    facultyId: string | null;
    action: keyof typeof NEXT_STATUS;
    reason: string | null;
  }): Promise<boolean> {
    const now = new Date();

    return db.transaction(async (tx) => {
      const [row] = await tx
        .update(internships)
        .set({
          status: NEXT_STATUS[params.action],
          updatedAt: now,
          // Explore sorts on verifiedAt. Forgetting it publishes a card that
          // sorts to the bottom forever.
          ...(params.action === "verify" ? { verifiedAt: now, verifiedBy: params.actorId } : {}),
        })
        .where(
          and(
            eq(internships.id, params.internshipId),
            eq(internships.status, "submitted"),
            params.facultyId
              ? eq(internships.assignedFacultyId, params.facultyId)
              : undefined,
          ),
        )
        .returning({ id: internships.id });

      if (!row) return false;

      await Events.record(tx, {
        internshipId: params.internshipId,
        actorId: params.actorId,
        action: params.action,
        reason: params.reason,
      });

      return true;
    });
  },

  /**
   * The three internship numbers on the admin dashboard, in ONE round trip.
   *
   * `count(*) filter (where …)` rather than three separate COUNTs: a dashboard
   * that opens one connection per tile is what saturates the pooler's client
   * limit and makes the page hang instead of load. The appeal count joined this
   * query rather than arriving as a fourth for exactly that reason.
   */
  async dashboardCounts(): Promise<{
    pendingVerifications: number;
    publishedInternships: number;
    pendingAppeals: number;
  }> {
    const [row] = await db
      .select({
        pendingVerifications: sql<number>`count(*) filter (where ${internships.status} = 'submitted')::int`,
        publishedInternships: sql<number>`count(*) filter (where ${internships.status} = 'verified')::int`,
        pendingAppeals: sql<number>`count(*) filter (where ${internships.status} = 'appealed')::int`,
      })
      .from(internships);

    return {
      pendingVerifications: row?.pendingVerifications ?? 0,
      publishedInternships: row?.publishedInternships ?? 0,
      pendingAppeals: row?.pendingAppeals ?? 0,
    };
  },
};

/* ── helpers ───────────────────────────────────────────────────────────── */

async function listDocuments(internshipId: string): Promise<DocumentRef[]> {
  const rows = await db
    .select({
      id: documents.id,
      docType: documents.docType,
      originalFilename: documents.originalFilename,
      sizeBytes: documents.sizeBytes,
    })
    .from(documents)
    .where(eq(documents.internshipId, internshipId))
    .orderBy(asc(documents.uploadedAt));

  return rows.map((row) => ({
    ...row,
    // Never a Storage URL. The route mints a short-lived signed link behind it.
    downloadUrl: `/api/documents/${row.id}/download`,
  }));
}

async function nameOf(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ fullName: users.fullName })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.fullName ?? null;
}

type InternshipRow = typeof internships.$inferSelect;

function toDetail(
  row: InternshipRow,
  extra: {
    companyName: string;
    facultyName: string | null;
    documents: DocumentRef[];
    timeline: InternshipDetail["timeline"];
    latestReason: string | null;
  },
): InternshipDetail {
  return {
    id: row.id,
    companyName: extra.companyName,
    roleTitle: row.roleTitle,
    status: row.status,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    latestReason: extra.latestReason,

    companyId: row.companyId,
    domain: row.domain,
    location: row.location,
    workMode: row.workMode,
    startDate: row.startDate,
    endDate: row.endDate,
    durationWeeks: row.durationWeeks,
    feeAmount: row.feeAmount,
    stipendAmount: row.stipendAmount,
    workNature: row.workNature,
    projectTitle: row.projectTitle,
    workSummary: row.workSummary,
    hadMentor: row.hadMentor,
    mentorFrequency: row.mentorFrequency,
    skillsBefore: row.skillsBefore ?? [],
    skillsAfter: row.skillsAfter ?? [],
    technologies: row.technologies ?? [],
    applicationSource: row.applicationSource,
    applicationProcess: row.applicationProcess,
    beginnerFriendly: row.beginnerFriendly,
    suitsWhom: row.suitsWhom,
    // The advisor sees the verdict before deciding. Verifying the card is what
    // makes it count, so it should not be the one field they cannot read.
    recommendsCompany: row.recommendsCompany,
    facultyName: extra.facultyName,
    documents: extra.documents,
    timeline: extra.timeline,

    // Student-facing affordances. A faculty member never edits a write-up,
    // and never appeals one either — an appeal is the student's own move.
    canEdit: false,
    canSubmit: false,
    canAppeal: false,
    appealCount: row.appealCount,
  };
}

/** Whole days, floored, never negative — the UI does no date maths. */
function daysSince(date: Date): number {
  const ms = Date.now() - date.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}
