import "server-only";

import { and, count, desc, eq, gt, gte, ilike, lte, or, sql } from "drizzle-orm";

import { db, companies, internships, users } from "@/db";
import type { AssignmentSource } from "@/db/schema/enums";
import * as Company from "./company.model";
import * as Document from "./document.model";
import * as StudentProfile from "./student-profile.model";
import * as VerificationEvent from "./verification-event.model";
import { isEditable, submitSchema, toFormShape } from "@/lib/validators/internship.schema";

import type {
  ExploreFilters,
  ExploreResult,
  InternshipDetail,
  InternshipListItem,
  InternshipStatus,
  RealityCard,
} from "@/types/contracts";
import type { DraftInput, SubmitInput } from "@/lib/validators/internship.schema";

/* ── Basic CRUD & Student Queries ───────────────────────────────────────── */

/** Internal use — for ownership and editability checks. Returns raw Drizzle row. */
export async function findById(id: string) {
  const [row] = await db
    .select()
    .from(internships)
    .where(eq(internships.id, id))
    .limit(1);
  return row ?? null;
}

/** 
 * For the student dashboard. Returns the single most recent internship (by creation),
 * joins the company for the name, and fetches the latest verification reason if any.
 */
export async function findLatestByStudent(
  studentId: string,
): Promise<InternshipListItem | null> {
  const [row] = await db
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
    .orderBy(desc(internships.createdAt))
    .limit(1);

  if (!row) return null;

  const latestReason = await VerificationEvent.getLatestReason(row.id);

  return {
    ...row,
    submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
    latestReason,
  };
}

/** 
 * For the 'My Internships' list view. 
 * Ordered newest first.
 */
export async function listByStudent(
  studentId: string,
): Promise<InternshipListItem[]> {
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
    .orderBy(desc(internships.createdAt));

  return rows.map((row) => ({
    ...row,
    submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
    latestReason: null,
  }));
}

/* ── Drafts & Submission ────────────────────────────────────────────────── */

/**
 * Inserts a blank draft using the placeholder company and inert defaults.
 * These satisfy NOT NULL constraints but fail submitSchema validation.
 */
export async function createDraft(studentId: string): Promise<{ id: string }> {
  const companyId = await Company.getOrCreatePlaceholder();
  const today = new Date().toISOString().slice(0, 10);

  const [row] = await db
    .insert(internships)
    .values({
      studentId,
      companyId,
      roleTitle: "Untitled internship",
      domain: "other",
      workMode: "onsite",
      startDate: today,
      endDate: today,
      durationWeeks: 0,
      workNature: "training_only",
      workSummary: "",
      hadMentor: false,
      status: "draft",
    })
    .returning({ id: internships.id });

  return row!;
}

/**
 * Saves partial progress.
 * Only accepts fields defined in `draftSchema`.
 */
export async function updateDraft(id: string, data: DraftInput): Promise<void> {
  await db
    .update(internships)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(internships.id, id));
}

/**
 * Submits the internship.
 * Assumes the caller has already run `submitSchema` and resolved the advisor.
 */
export async function submit(
  id: string,
  data: SubmitInput,
  faculty: { assignedFacultyId: string | null; assignmentSource: AssignmentSource | null },
  durationWeeks: number,
): Promise<void> {
  const now = new Date();
  
  await db
    .update(internships)
    .set({
      ...data,
      durationWeeks,
      assignedFacultyId: faculty.assignedFacultyId,
      assignmentSource: faculty.assignmentSource,
      status: "submitted",
      submittedAt: now,
      updatedAt: now,
    })
    .where(eq(internships.id, id));
}

/* ── Status Lifecycle ───────────────────────────────────────────────────── */

/**
 * Optimistic lock status change.
 * Returns the updated row on success, or null if the currentStatus did not match (409 Conflict).
 */
export async function setStatus(
  id: string,
  newStatus: InternshipStatus,
  expectedCurrentStatus: InternshipStatus,
): Promise<{ id: string } | null> {
  const [updated] = await db
    .update(internships)
    .set({
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(internships.id, id),
        eq(internships.status, expectedCurrentStatus)
      )
    )
    .returning({ id: internships.id });

  return updated ?? null;
}

/* ── Read: Detail View (Student) ────────────────────────────────────────── */

/**
 * Loads everything needed for the student detail view.
 * Computes `canEdit` and `canSubmit` business logic.
 */
export async function getDetail(id: string): Promise<InternshipDetail> {
  const [row] = await db
    .select({
      internship: internships,
      companyName: companies.name,
      facultyName: users.fullName,
    })
    .from(internships)
    .innerJoin(companies, eq(companies.id, internships.companyId))
    .leftJoin(users, eq(users.id, internships.assignedFacultyId))
    .where(eq(internships.id, id))
    .limit(1);

  if (!row) {
    throw new Error(`Internship not found: ${id}`);
  }

  const documents = await Document.listByInternship(id);
  const timeline = await VerificationEvent.listByInternship(id);
  const latestReason = await VerificationEvent.getLatestReason(id);

  const canEdit = isEditable(row.internship.status);
  const formShape = toFormShape(row.internship);
  const canSubmit = canEdit && submitSchema.safeParse(formShape).success;

  return {
    id: row.internship.id,
    companyId: row.internship.companyId,
    companyName: row.companyName,
    roleTitle: row.internship.roleTitle,
    status: row.internship.status,
    domain: row.internship.domain,
    location: row.internship.location,
    workMode: row.internship.workMode,
    startDate: row.internship.startDate,
    endDate: row.internship.endDate,
    durationWeeks: row.internship.durationWeeks,
    feeAmount: row.internship.feeAmount,
    stipendAmount: row.internship.stipendAmount,
    workNature: row.internship.workNature,
    projectTitle: row.internship.projectTitle,
    workSummary: row.internship.workSummary,
    hadMentor: row.internship.hadMentor,
    mentorFrequency: row.internship.mentorFrequency,
    skillsBefore: row.internship.skillsBefore ?? [],
    skillsAfter: row.internship.skillsAfter ?? [],
    technologies: row.internship.technologies ?? [],
    applicationSource: row.internship.applicationSource,
    applicationProcess: row.internship.applicationProcess,
    beginnerFriendly: row.internship.beginnerFriendly,
    suitsWhom: row.internship.suitsWhom,
    submittedAt: row.internship.submittedAt ? row.internship.submittedAt.toISOString() : null,
    latestReason,
    facultyName: row.facultyName,
    documents,
    timeline,
    canEdit,
    canSubmit,
  };
}

/* ── Read: Explore & Published ──────────────────────────────────────────── */

/**
 * Searches only 'verified' internships for the Explore page.
 * Implements complex filtering and sorting logic.
 */
export async function searchVerified(
  filters: ExploreFilters,
): Promise<ExploreResult> {
  const conditions = [eq(internships.status, "verified")];

  if (filters.q) {
    const term = `%${filters.q.trim()}%`;
    conditions.push(
      or(
        ilike(internships.roleTitle, term),
        ilike(companies.name, term)
      )!
    );
  }
  if (filters.domain) conditions.push(eq(internships.domain, filters.domain));
  if (filters.companyId) conditions.push(eq(internships.companyId, filters.companyId));
  if (filters.workMode) conditions.push(eq(internships.workMode, filters.workMode));
  
  if (filters.fee === "free") conditions.push(eq(internships.feeAmount, 0));
  else if (filters.fee === "paid") conditions.push(gt(internships.feeAmount, 0));

  if (filters.stipend === "no") conditions.push(eq(internships.stipendAmount, 0));
  else if (filters.stipend === "yes") conditions.push(gt(internships.stipendAmount, 0));

  if (filters.minWeeks) conditions.push(gte(internships.durationWeeks, filters.minWeeks));
  if (filters.maxWeeks) conditions.push(lte(internships.durationWeeks, filters.maxWeeks));
  if (filters.beginnerFriendly) conditions.push(eq(internships.beginnerFriendly, true));

  const whereClause = and(...conditions);

  // Sorting
  let orderBy;
  switch (filters.sort) {
    case "duration":
      orderBy = [desc(internships.durationWeeks), desc(internships.id)];
      break;
    case "stipend":
      // Explicit NULLS LAST to push unpaid/undisclosed to the bottom
      orderBy = [sql`${internships.stipendAmount} DESC NULLS LAST`, desc(internships.id)];
      break;
    case "recent":
    default:
      orderBy = [desc(internships.verifiedAt), desc(internships.id)];
      break;
  }

  const page = filters.page ?? 1;
  const pageSize = 12; 
  const offset = (page - 1) * pageSize;

  const [countResult] = await db
    .select({ value: count() })
    .from(internships)
    .innerJoin(companies, eq(companies.id, internships.companyId))
    .where(whereClause);
  const total = countResult?.value ?? 0;

  const rows = await db
    .select({
      internship: internships,
      companyName: companies.name,
      studentName: users.fullName,
    })
    .from(internships)
    .innerJoin(companies, eq(companies.id, internships.companyId))
    .innerJoin(users, eq(users.id, internships.studentId))
    .where(whereClause)
    .orderBy(...orderBy)
    .limit(pageSize)
    .offset(offset);

  // Map to ExploreCard shape concurrently fetching student batches
  const items = await Promise.all(
    rows.map(async (row) => {
      const year = new Date(row.internship.endDate).getFullYear();
      const studentBatch = await StudentProfile.getBatchLabel(row.internship.studentId);
      
      return {
        id: row.internship.id,
        companyName: row.companyName,
        roleTitle: row.internship.roleTitle,
        domain: row.internship.domain,
        location: row.internship.location,
        workMode: row.internship.workMode,
        durationWeeks: row.internship.durationWeeks,
        feeAmount: row.internship.feeAmount,
        stipendAmount: row.internship.stipendAmount,
        workNature: row.internship.workNature,
        beginnerFriendly: row.internship.beginnerFriendly,
        year,
        studentName: row.studentName,
        studentBatch,
      };
    })
  );

  return { items, total, page, pageSize };
}

/**
 * Loads a RealityCard for public viewing.
 * ONLY returns if status='verified'.
 */
export async function getPublishedById(id: string): Promise<RealityCard | null> {
  const [row] = await db
    .select({
      internship: internships,
      companyName: companies.name,
      studentName: users.fullName,
    })
    .from(internships)
    .innerJoin(companies, eq(companies.id, internships.companyId))
    .innerJoin(users, eq(users.id, internships.studentId))
    .where(and(eq(internships.id, id), eq(internships.status, "verified")))
    .limit(1);

  if (!row) return null;

  let verifiedByName = "Unknown";
  if (row.internship.verifiedBy) {
    const [v] = await db
      .select({ name: users.fullName })
      .from(users)
      .where(eq(users.id, row.internship.verifiedBy))
      .limit(1);
    if (v) verifiedByName = v.name;
  }

  const studentBatch = await StudentProfile.getBatchLabel(row.internship.studentId);
  const year = new Date(row.internship.endDate).getFullYear();

  return {
    id: row.internship.id,
    companyName: row.companyName,
    roleTitle: row.internship.roleTitle,
    domain: row.internship.domain,
    location: row.internship.location,
    workMode: row.internship.workMode,
    durationWeeks: row.internship.durationWeeks,
    feeAmount: row.internship.feeAmount,
    stipendAmount: row.internship.stipendAmount,
    workNature: row.internship.workNature,
    beginnerFriendly: row.internship.beginnerFriendly,
    year,
    studentName: row.studentName,
    studentBatch,
    startDate: row.internship.startDate,
    endDate: row.internship.endDate,
    projectTitle: row.internship.projectTitle,
    workSummary: row.internship.workSummary,
    hadMentor: row.internship.hadMentor,
    mentorFrequency: row.internship.mentorFrequency,
    skillsBefore: row.internship.skillsBefore ?? [],
    skillsAfter: row.internship.skillsAfter ?? [],
    technologies: row.internship.technologies ?? [],
    applicationSource: row.internship.applicationSource,
    applicationProcess: row.internship.applicationProcess,
    suitsWhom: row.internship.suitsWhom,
    verifiedAt: row.internship.verifiedAt!.toISOString(),
    verifiedByName,
  };
}

/**
 * Bulk loads RealityCards for the Compare view.
 */
export async function getPublishedByIds(ids: string[]): Promise<RealityCard[]> {
  if (!ids || ids.length === 0) return [];
  
  // We can just call getPublishedById concurrently since ids is capped at 3
  const results = await Promise.all(ids.map((id) => getPublishedById(id)));
  return results.filter((r): r is RealityCard => r !== null);
}
