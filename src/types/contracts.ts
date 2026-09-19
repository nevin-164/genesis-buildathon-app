/**
 * The contract between all six work packages.
 *
 * Frontend packages code against these shapes. Backend packages return them.
 * Treat this file as frozen: append your own section, never rename or reorder
 * what is already here, because someone else is already importing it.
 */

/* ─────────────── shared ─────────────── */

export type Role = "student" | "faculty" | "admin";

export type SessionUser = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  /**
   * Null until they confirm their address. Carried on the session so the gates
   * in `lib/auth/gates.ts` cost no extra query — the DAL has already loaded the
   * row this comes from.
   */
  emailVerifiedAt: Date | null;
};

/** Every Server Action returns this shape. Actions never throw to the UI. */
export type ActionState = {
  ok: boolean;
  /** One-line error or success text. */
  message?: string;
  /** Key = the form field's `name` attribute. */
  fieldErrors?: Record<string, string>;
};

export const initialActionState: ActionState = { ok: false };

export type InternshipStatus =
  | "draft"
  | "submitted"
  | "changes_requested"
  | "verified"
  | "rejected"
  /** Rejected, and contested by the student. With an administrator, not the advisor. */
  | "appealed";

export type WorkMode = "remote" | "hybrid" | "onsite";
export type WorkNature = "training_only" | "guided_project" | "real_work";
export type MentorFrequency = "daily" | "weekly" | "occasional" | "never";
/** How the student applied to the company. Not an internal approval stage. */
export type ApplicationSource =
  | "company_website"
  | "email"
  | "referral"
  | "linkedin"
  | "job_portal"
  | "college"
  | "other";

export type VerificationAction =
  | "verify"
  | "request_changes"
  | "reject"
  | "respond"
  /** The student contests a rejection. */
  | "appeal"
  /** The administrator agrees with the advisor. Back to rejected, and final. */
  | "uphold_appeal"
  /** The administrator overrules the advisor and publishes it. */
  | "overturn_appeal";

/** One entry in an internship's verification thread. */
export type TimelineEntry = {
  id: string;
  actorName: string;
  actorRole: Role;
  action: VerificationAction;
  reason: string | null;
  /** ISO 8601 */
  createdAt: string;
};

/**
 * An uploaded document. `downloadUrl` is always /api/documents/<id>/download —
 * a short-lived signed link is minted behind it, never a public URL.
 */
export type DocumentRef = {
  id: string;
  /** What the student called it, e.g. "Completion certificate". Free text. */
  docType: string;
  originalFilename: string;
  sizeBytes: number;
  downloadUrl: string;
};

/** Fills the cascading dropdowns on the registration page. */
export type OrgTree = {
  departments: { id: string; code: string; name: string }[];
  batches: { id: string; departmentId: string; name: string }[];
  classes: { id: string; batchId: string; name: string }[];
};

/* ─────────────── package 2 · student ─────────────── */

export type InternshipListItem = {
  id: string;
  companyName: string;
  roleTitle: string;
  status: InternshipStatus;
  /** ISO 8601 */
  submittedAt: string | null;
  /** newest change-request / rejection reason */
  latestReason: string | null;
};

export type InternshipDetail = InternshipListItem & {
  companyId: string;
  /** slug, e.g. "web" */
  domain: string;
  location: string | null;
  workMode: WorkMode;
  /** "YYYY-MM-DD" */
  startDate: string;
  endDate: string;
  durationWeeks: number;
  /** whole rupees. null = not disclosed, 0 = genuinely free */
  feeAmount: number | null;
  stipendAmount: number | null;
  workNature: WorkNature;
  projectTitle: string | null;
  workSummary: string;
  hadMentor: boolean;
  mentorFrequency: MentorFrequency | null;
  skillsBefore: string[];
  skillsAfter: string[];
  technologies: string[];
  applicationSource: ApplicationSource | null;
  applicationProcess: string | null;
  beginnerFriendly: boolean | null;
  suitsWhom: string | null;
  /** null = no advisor assigned yet */
  facultyName: string | null;
  documents: DocumentRef[];
  /** oldest first */
  timeline: TimelineEntry[];
  /** the backend decides these; the UI just obeys */
  canEdit: boolean;
  canSubmit: boolean;
  /**
   * Rejected, not yet appealed, and still inside the one-appeal allowance.
   * False on every other status — including `appealed`, where the appeal has
   * already been made.
   */
  canAppeal: boolean;
  /** 0 or 1. Once it is 1 the rejection stands whatever happens next. */
  appealCount: number;
};

export type ExploreFilters = {
  q?: string;
  domain?: string;
  companyId?: string;
  workMode?: WorkMode;
  /** did the student pay a fee? */
  fee?: "free" | "paid";
  stipend?: "yes" | "no";
  minWeeks?: number;
  maxWeeks?: number;
  beginnerFriendly?: boolean;
  /** default "recent" */
  sort?: "recent" | "duration" | "stipend";
  /** 1-based, default 1 */
  page?: number;
};

export type ExploreCard = {
  id: string;
  companyName: string;
  roleTitle: string;
  domain: string;
  location: string | null;
  workMode: WorkMode;
  durationWeeks: number;
  feeAmount: number | null;
  stipendAmount: number | null;
  workNature: WorkNature;
  beginnerFriendly: boolean | null;
  /** year the internship ended */
  year: number;
  studentName: string;
  /** e.g. "CSE 2022-2026" */
  studentBatch: string | null;
};

export type RealityCard = ExploreCard & {
  startDate: string;
  endDate: string;
  projectTitle: string | null;
  workSummary: string;
  hadMentor: boolean;
  mentorFrequency: MentorFrequency | null;
  skillsBefore: string[];
  skillsAfter: string[];
  technologies: string[];
  applicationSource: ApplicationSource | null;
  applicationProcess: string | null;
  suitsWhom: string | null;
  verifiedAt: string;
  verifiedByName: string;
};

export type ExploreResult = {
  items: ExploreCard[];
  total: number;
  page: number;
  /** fixed at 12 */
  pageSize: number;
};

export type CompanyOption = { id: string; name: string; location: string | null };

export type StudentDashboard = {
  /** the most recent one */
  internship: InternshipListItem | null;
  nextAction:
    | "add_internship"
    | "await_verification"
    | "fix_internship"
    | "published"
    | "rejected"
    /** Appealed, and waiting on an administrator rather than an advisor. */
    | "appeal_under_review";
};

/* ─────────────── package 3 · faculty ─────────────── */

export type FacultyCounts = {
  assignedStudents: number;
  /** assigned students with no internship at all */
  notSubmitted: number;
  pendingVerifications: number;
  changesRequested: number;
  verified: number;
  rejected: number;
  /** Rejected by you, and now being reviewed by an administrator. */
  underAppeal: number;
};

export type AssignedStudent = {
  id: string;
  fullName: string;
  email: string;
  registerNumber: string;
  /** Never null — every student is in a class. */
  className: string;
  /** null = nothing submitted yet */
  internshipStatus: InternshipStatus | null;
};

export type QueueItem = {
  /** internship id */
  id: string;
  studentName: string;
  registerNumber: string;
  companyName: string;
  roleTitle: string;
  /** ISO — the queue is oldest first */
  submittedAt: string;
  /** computed, so the UI does no date maths */
  waitingDays: number;
  /** how many documents are attached — an empty one is the first red flag */
  documentCount: number;
};

export type VerificationDetail = {
  internship: InternshipDetail;
  student: {
    id: string;
    fullName: string;
    registerNumber: string;
    className: string;
  };
};

export type StudentHistory = {
  student: AssignedStudent;
  internships: InternshipListItem[];
};

/* ─────────────── package 3 · admin ─────────────── */

/**
 * There is no "unassigned internships" or "classes without an advisor" here
 * any more. Both states are unrepresentable — `classes.advisor_id` and
 * `student_profiles.class_id` are NOT NULL — so a tile for either would read
 * zero forever.
 */
export type AdminCounts = {
  totalStudents: number;
  totalFaculty: number;
  totalClasses: number;
  pendingVerifications: number;
  publishedInternships: number;
  /** Rejections a student has contested. These wait on an admin, nobody else. */
  pendingAppeals: number;
};

export type AdminUserRow = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  isActive: boolean;
  /** students only — null on a faculty or admin row */
  registerNumber: string | null;
  className: string | null;
  batchName: string | null;
  departmentName: string | null;
  /** the advisor of their class */
  advisorName: string | null;
  /** faculty only — how many classes they are responsible for */
  advisedClassCount: number;
  createdAt: string;
};

/** The org filters are student-only: faculty and admin have no class. */
export type AdminUserFilters = {
  q?: string;
  role?: Role;
  isActive?: boolean;
  departmentId?: string;
  batchId?: string;
  classId?: string;
  page?: number;
};

export type FacultyOption = { id: string; fullName: string; email: string };

export type DepartmentRow = {
  id: string;
  code: string;
  name: string;
  batchCount: number;
};

export type BatchRow = {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  startYear: number;
  endYear: number;
  classCount: number;
};

/** `advisor` is never null — a class cannot be created without one. */
export type ClassRow = {
  id: string;
  name: string;
  batchId: string;
  batchName: string;
  departmentName: string;
  advisor: FacultyOption;
  studentCount: number;
};

export type ClassDetail = ClassRow & {
  students: { id: string; fullName: string; registerNumber: string }[];
};

/** A student who could be moved into a class, plus where they are today. */
export type StudentMoveOption = {
  id: string;
  fullName: string;
  registerNumber: string;
  currentClassName: string;
};

/* ─────────────── package D · AI internship report ─────────────── */
/*
 * Append-only, and inside a labelled block. Three packages add DTOs to this
 * file; non-overlapping appends to different regions merge without complaint,
 * whereas an edit to an existing type does not. Add yours in your own block at
 * the bottom, and never rename or reorder what is above.
 */

/** A generated report as the UI receives it. */
export type InternshipReportView = {
  /** Markdown. Render it as markdown — never insert it as raw HTML. */
  content: string;
  /** Which model wrote it. "placeholder" when generation is unconfigured. */
  model: string;
  /** ISO 8601 */
  generatedAt: string;
};

/* ─────────────── package E · rejection appeals ─────────────── */
/*
 * A rejection is no longer the end of the road. The student may contest it
 * once, attaching whatever proof the advisor said was missing, and an
 * administrator — never the advisor who rejected it — rules on that appeal.
 *
 * These shapes are the admin console's. The student side needs nothing new:
 * `InternshipDetail.canAppeal` and the `appeal` entries on `timeline` say
 * everything their screens render.
 */

/** One row of the admin appeal queue. Oldest first, like the faculty one. */
export type AppealQueueItem = {
  /** internship id */
  id: string;
  studentName: string;
  registerNumber: string;
  companyName: string;
  roleTitle: string;
  /** ISO — when the student appealed */
  appealedAt: string;
  /** computed, so the UI does no date maths */
  waitingDays: number;
  /** total attached, including anything added to support the appeal */
  documentCount: number;
  /** the advisor whose rejection is being contested */
  facultyName: string | null;
};

/** Everything an administrator needs to rule on one appeal. */
export type AppealDetail = {
  internship: InternshipDetail;
  student: {
    id: string;
    fullName: string;
    registerNumber: string;
    className: string;
  };
  appeal: {
    /** ISO */
    appealedAt: string;
    /** the student's case, in their own words */
    reason: string;
    /** what the advisor wrote when they rejected it */
    rejectionReason: string | null;
    /** who rejected it */
    facultyName: string | null;
  };
};

/** What an administrator can do with an appeal. There is no third option. */
export type AppealDecision = "overturn" | "uphold";
