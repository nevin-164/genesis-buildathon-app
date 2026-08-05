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

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "clarification_requested"
  | "approved"
  | "rejected";

export type ExperienceStatus =
  | "draft"
  | "submitted"
  | "changes_requested"
  | "verified"
  | "rejected";

export type WorkMode = "remote" | "hybrid" | "onsite";
export type WorkNature = "training_only" | "guided_project" | "real_work";
export type MentorFrequency = "daily" | "weekly" | "occasional" | "never";
export type ApplicationSource =
  | "company_website"
  | "email"
  | "referral"
  | "linkedin"
  | "job_portal"
  | "college"
  | "other";

export type ReviewAction =
  | "approve"
  | "request_clarification"
  | "reject"
  | "verify"
  | "request_changes"
  | "respond";

/** One entry in an application's or experience's decision thread. */
export type ReviewEntry = {
  id: string;
  actorName: string;
  actorRole: Role;
  action: ReviewAction;
  reason: string | null;
  /** ISO 8601 */
  createdAt: string;
};

/** An uploaded file. `downloadUrl` is always /api/evidence/<id>/download */
export type EvidenceRef = {
  id: string;
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

export type ApplicationListItem = {
  id: string;
  companyName: string;
  roleTitle: string;
  /** slug, e.g. "web" */
  domain: string;
  status: ApplicationStatus;
  /** "YYYY-MM-DD" */
  startDate: string;
  endDate: string;
  /** ISO 8601 */
  submittedAt: string | null;
  /** null = no advisor assigned yet */
  facultyName: string | null;
  /** newest clarification / rejection reason */
  latestReason: string | null;
};

export type ApplicationDetail = ApplicationListItem & {
  companyId: string;
  location: string | null;
  workMode: WorkMode;
  durationWeeks: number;
  /** whole rupees, null = none */
  feeAmount: number | null;
  stipendAmount: number | null;
  expectedWork: string | null;
  technologies: string[];
  applicationSource: ApplicationSource | null;
  offerLetter: EvidenceRef | null;
  /** oldest first */
  timeline: ReviewEntry[];
  /** the backend decides these; the UI just obeys */
  canEdit: boolean;
  canSubmit: boolean;
};

export type ExperienceListItem = {
  id: string;
  companyName: string;
  roleTitle: string;
  status: ExperienceStatus;
  submittedAt: string | null;
  latestReason: string | null;
};

export type ExperienceDetail = ExperienceListItem & {
  applicationId: string;
  companyId: string;
  domain: string;
  location: string | null;
  workMode: WorkMode;
  startDate: string;
  endDate: string;
  durationWeeks: number;
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
  certificate: EvidenceRef | null;
  timeline: ReviewEntry[];
  canEdit: boolean;
  canSubmit: boolean;
};

/** An approved application that has no experience row yet. */
export type ContributableApplication = {
  applicationId: string;
  companyName: string;
  roleTitle: string;
  startDate: string;
  endDate: string;
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
  application: ApplicationListItem | null;
  experience: ExperienceListItem | null;
  contributable: ContributableApplication | null;
  nextAction:
    | "submit_application"
    | "await_approval"
    | "respond_clarification"
    | "contribute_experience"
    | "await_verification"
    | "fix_experience"
    | "published"
    | "rejected";
};

/* ─────────────── package 3 · faculty ─────────────── */

export type FacultyCounts = {
  assignedStudents: number;
  /** assigned students with no application at all */
  notSubmitted: number;
  pendingApplications: number;
  clarificationRequested: number;
  approved: number;
  rejected: number;
  pendingVerifications: number;
};

export type AssignedStudent = {
  id: string;
  fullName: string;
  email: string;
  registerNumber: string;
  className: string | null;
  /** null = never applied */
  applicationStatus: ApplicationStatus | null;
  experienceStatus: ExperienceStatus | null;
};

export type QueueItem = {
  /** application id or experience id */
  id: string;
  studentName: string;
  registerNumber: string;
  companyName: string;
  roleTitle: string;
  /** ISO — the queue is oldest first */
  submittedAt: string;
  /** computed, so the UI does no date maths */
  waitingDays: number;
};

export type BriefFlag = { level: "warn" | "info"; label: string };

export type ApprovalBrief = {
  application: ApplicationDetail;
  student: {
    id: string;
    fullName: string;
    registerNumber: string;
    email: string;
    className: string | null;
    departmentName: string | null;
  };
  flags: BriefFlag[];
};

export type VerificationDetail = {
  experience: ExperienceDetail;
  student: {
    id: string;
    fullName: string;
    registerNumber: string;
    className: string | null;
  };
  /** what was approved, to compare against */
  approvedPlan: {
    roleTitle: string;
    companyName: string;
    startDate: string;
    endDate: string;
    feeAmount: number | null;
    stipendAmount: number | null;
  };
};

export type StudentHistory = {
  student: AssignedStudent;
  applications: ApplicationListItem[];
  experiences: ExperienceListItem[];
};

/* ─────────────── package 3 · admin ─────────────── */

export type AdminCounts = {
  totalStudents: number;
  totalFaculty: number;
  /** submitted with assigned_faculty_id IS NULL */
  unassignedApplications: number;
  classesWithoutAdvisor: number;
  pendingApplications: number;
  publishedExperiences: number;
};

export type AdminUserRow = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  isActive: boolean;
  /** students only */
  registerNumber: string | null;
  className: string | null;
  advisorName: string | null;
  createdAt: string;
};

export type AdminUserFilters = {
  q?: string;
  role?: Role;
  isActive?: boolean;
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

export type ClassRow = {
  id: string;
  name: string;
  batchId: string;
  batchName: string;
  departmentName: string;
  advisor: FacultyOption | null;
  studentCount: number;
};

export type ClassDetail = ClassRow & {
  students: { id: string; fullName: string; registerNumber: string }[];
};

export type UnassignedApplication = {
  applicationId: string;
  studentName: string;
  registerNumber: string;
  className: string | null;
  companyName: string;
  submittedAt: string;
};
