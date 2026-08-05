import "server-only";

import type {
  AdminCounts,
  AdminUserRow,
  ApplicationDetail,
  ApplicationListItem,
  ApprovalBrief,
  AssignedStudent,
  BatchRow,
  ClassRow,
  CompanyOption,
  ContributableApplication,
  DepartmentRow,
  ExperienceDetail,
  ExperienceListItem,
  ExploreCard,
  FacultyCounts,
  FacultyOption,
  OrgTree,
  QueueItem,
  RealityCard,
  ReviewEntry,
  StudentDashboard,
  UnassignedApplication,
  VerificationDetail,
} from "@/types/contracts";

/**
 * TEMPORARY fake data so every screen renders before the real queries exist.
 *
 * Packages 2 and 3 delete this file once their controllers hit the database.
 * Nothing outside src/controllers/** should import it.
 */

export const MOCK_ORG_TREE: OrgTree = {
  departments: [
    { id: "d1", code: "CSE", name: "Computer Science and Engineering" },
    { id: "d2", code: "ME", name: "Mechanical Engineering" },
  ],
  batches: [
    { id: "b1", departmentId: "d1", name: "2022-2026" },
    { id: "b2", departmentId: "d1", name: "2023-2027" },
    { id: "b3", departmentId: "d2", name: "2022-2026" },
  ],
  classes: [
    { id: "c1", batchId: "b1", name: "S6-CSE-A" },
    { id: "c2", batchId: "b1", name: "S6-CSE-B" },
    { id: "c3", batchId: "b3", name: "S6-ME-A" },
  ],
};

export const MOCK_COMPANIES: CompanyOption[] = [
  { id: "co1", name: "TechNova Solutions", location: "Kochi" },
  { id: "co2", name: "CodeCraft Labs", location: "Bengaluru" },
  { id: "co3", name: "EmbedWorks", location: "Coimbatore" },
  { id: "co4", name: "CloudSprint", location: "Remote" },
  { id: "co5", name: "DataMinds Academy", location: "Chennai" },
];

export const MOCK_FACULTY: FacultyOption[] = [
  { id: "f1", fullName: "Dr. Meera Raghunathan", email: "meera@example.com" },
  { id: "f2", fullName: "Prof. Anil Kumar", email: "anil@example.com" },
];

const TIMELINE: ReviewEntry[] = [
  {
    id: "r1",
    actorName: "Dr. Meera Raghunathan",
    actorRole: "faculty",
    action: "request_clarification",
    reason: "Please attach the offer letter and confirm the stipend amount.",
    createdAt: "2026-01-03T09:15:00.000Z",
  },
  {
    id: "r2",
    actorName: "Priya Nair",
    actorRole: "student",
    action: "respond",
    reason: "Attached now. The stipend is confirmed at 8,000 per month.",
    createdAt: "2026-01-04T11:02:00.000Z",
  },
];

export const MOCK_APPLICATION_LIST: ApplicationListItem[] = [
  {
    id: "a1",
    companyName: "TechNova Solutions",
    roleTitle: "Frontend Developer Intern",
    domain: "web",
    status: "clarification_requested",
    startDate: "2026-01-06",
    endDate: "2026-03-01",
    submittedAt: "2026-01-02T08:00:00.000Z",
    facultyName: "Dr. Meera Raghunathan",
    latestReason: "Please attach the offer letter and confirm the stipend amount.",
  },
];

export const MOCK_APPLICATION_DETAIL: ApplicationDetail = {
  ...MOCK_APPLICATION_LIST[0],
  companyId: "co1",
  location: "Kochi",
  workMode: "onsite",
  durationWeeks: 8,
  feeAmount: null,
  stipendAmount: 8000,
  expectedWork: "Rebuilding the customer dashboard with React and TypeScript.",
  technologies: ["React", "TypeScript", "Figma"],
  applicationSource: "company_website",
  offerLetter: null,
  timeline: TIMELINE,
  canEdit: true,
  canSubmit: true,
};

export const MOCK_EXPERIENCE_LIST: ExperienceListItem[] = [
  {
    id: "e1",
    companyName: "CodeCraft Labs",
    roleTitle: "Machine Learning Intern",
    status: "submitted",
    submittedAt: "2026-04-02T10:00:00.000Z",
    latestReason: null,
  },
];

export const MOCK_EXPERIENCE_DETAIL: ExperienceDetail = {
  ...MOCK_EXPERIENCE_LIST[0],
  applicationId: "a2",
  companyId: "co2",
  domain: "ml",
  location: "Bengaluru",
  workMode: "remote",
  startDate: "2026-01-08",
  endDate: "2026-03-28",
  durationWeeks: 11,
  feeAmount: 15000,
  stipendAmount: null,
  workNature: "guided_project",
  projectTitle: "Customer churn prediction model",
  workSummary:
    "Built and evaluated a churn prediction model on anonymised customer data, then wrote a short report on which features mattered most.",
  hadMentor: true,
  mentorFrequency: "weekly",
  skillsBefore: ["Python"],
  skillsAfter: ["Python", "scikit-learn", "pandas", "model evaluation"],
  technologies: ["Python", "scikit-learn", "pandas", "Jupyter"],
  applicationSource: "linkedin",
  applicationProcess: "Applied on LinkedIn, one online test, then a short interview.",
  beginnerFriendly: true,
  suitsWhom: "Someone comfortable with Python who wants a first taste of applied ML.",
  certificate: null,
  timeline: [],
  canEdit: false,
  canSubmit: false,
};

export const MOCK_CONTRIBUTABLE: ContributableApplication[] = [
  {
    applicationId: "a3",
    companyName: "CloudSprint",
    roleTitle: "DevOps Intern",
    startDate: "2025-06-02",
    endDate: "2025-07-25",
  },
];

export const MOCK_EXPLORE_CARDS: ExploreCard[] = [
  {
    id: "x1",
    companyName: "TechNova Solutions",
    roleTitle: "Frontend Developer Intern",
    domain: "web",
    location: "Kochi",
    workMode: "onsite",
    durationWeeks: 8,
    feeAmount: null,
    stipendAmount: 8000,
    workNature: "real_work",
    beginnerFriendly: true,
    year: 2025,
    studentName: "Arun Kumar",
    studentBatch: "CSE 2021-2025",
  },
  {
    id: "x2",
    companyName: "DataMinds Academy",
    roleTitle: "Machine Learning Intern",
    domain: "ml",
    location: "Remote",
    workMode: "remote",
    durationWeeks: 12,
    feeAmount: 15000,
    stipendAmount: null,
    workNature: "training_only",
    beginnerFriendly: true,
    year: 2025,
    studentName: "Sneha Pillai",
    studentBatch: "CSE 2021-2025",
  },
  {
    id: "x3",
    companyName: "EmbedWorks",
    roleTitle: "Embedded Systems Intern",
    domain: "embedded-iot",
    location: "Coimbatore",
    workMode: "hybrid",
    durationWeeks: 6,
    feeAmount: null,
    stipendAmount: 5000,
    workNature: "guided_project",
    beginnerFriendly: false,
    year: 2024,
    studentName: "Rahul Das",
    studentBatch: "ME 2020-2024",
  },
];

export const MOCK_REALITY_CARD: RealityCard = {
  ...MOCK_EXPLORE_CARDS[0],
  startDate: "2025-01-06",
  endDate: "2025-03-01",
  projectTitle: "Customer dashboard redesign",
  workSummary:
    "Rebuilt the customer dashboard in React. Shipped three screens that are now in production, and wrote the tests for them.",
  hadMentor: true,
  mentorFrequency: "weekly",
  skillsBefore: ["React", "basic CSS"],
  skillsAfter: ["React", "TypeScript", "Tailwind", "Git workflow"],
  technologies: ["React", "TypeScript", "Vite", "Figma"],
  applicationSource: "company_website",
  applicationProcess: "Applied through the careers page, one portfolio review, one interview.",
  suitsWhom: "Anyone who has built a small React project and wants real production work.",
  verifiedAt: "2025-03-12T06:00:00.000Z",
  verifiedByName: "Dr. Meera Raghunathan",
};

export const MOCK_STUDENT_DASHBOARD: StudentDashboard = {
  application: MOCK_APPLICATION_LIST[0],
  experience: null,
  contributable: null,
  nextAction: "respond_clarification",
};

export const MOCK_FACULTY_COUNTS: FacultyCounts = {
  assignedStudents: 32,
  notSubmitted: 11,
  pendingApplications: 4,
  clarificationRequested: 3,
  approved: 14,
  rejected: 2,
  pendingVerifications: 2,
};

export const MOCK_ASSIGNED_STUDENTS: AssignedStudent[] = [
  {
    id: "s1",
    fullName: "Anjali Menon",
    email: "anjali@example.com",
    registerNumber: "CS22001",
    className: "S6-CSE-A",
    applicationStatus: "submitted",
    experienceStatus: null,
  },
  {
    id: "s2",
    fullName: "Arun Kumar",
    email: "arun@example.com",
    registerNumber: "CS22002",
    className: "S6-CSE-A",
    applicationStatus: "approved",
    experienceStatus: "submitted",
  },
  {
    id: "s3",
    fullName: "Divya Raj",
    email: "divya@example.com",
    registerNumber: "CS22003",
    className: "S6-CSE-A",
    applicationStatus: null,
    experienceStatus: null,
  },
];

export const MOCK_QUEUE: QueueItem[] = [
  {
    id: "a1",
    studentName: "Anjali Menon",
    registerNumber: "CS22001",
    companyName: "TechNova Solutions",
    roleTitle: "Frontend Developer Intern",
    submittedAt: "2026-01-02T08:00:00.000Z",
    waitingDays: 6,
  },
  {
    id: "a4",
    studentName: "Rahul Das",
    registerNumber: "CS22015",
    companyName: "CodeCraft Labs",
    roleTitle: "Machine Learning Intern",
    submittedAt: "2026-01-05T08:00:00.000Z",
    waitingDays: 3,
  },
];

export const MOCK_APPROVAL_BRIEF: ApprovalBrief = {
  application: MOCK_APPLICATION_DETAIL,
  student: {
    id: "s1",
    fullName: "Anjali Menon",
    registerNumber: "CS22001",
    email: "anjali@example.com",
    className: "S6-CSE-A",
    departmentName: "Computer Science and Engineering",
  },
  flags: [
    { level: "warn", label: "No offer letter attached" },
    { level: "info", label: "No verified experience from this company yet" },
  ],
};

export const MOCK_VERIFICATION_DETAIL: VerificationDetail = {
  experience: MOCK_EXPERIENCE_DETAIL,
  student: {
    id: "s2",
    fullName: "Arun Kumar",
    registerNumber: "CS22002",
    className: "S6-CSE-A",
  },
  approvedPlan: {
    roleTitle: "Machine Learning Intern",
    companyName: "CodeCraft Labs",
    startDate: "2026-01-08",
    endDate: "2026-03-28",
    feeAmount: 15000,
    stipendAmount: null,
  },
};

export const MOCK_ADMIN_COUNTS: AdminCounts = {
  totalStudents: 214,
  totalFaculty: 18,
  unassignedApplications: 3,
  classesWithoutAdvisor: 2,
  pendingApplications: 47,
  publishedExperiences: 31,
};

export const MOCK_ADMIN_USERS: AdminUserRow[] = [
  {
    id: "s1",
    fullName: "Anjali Menon",
    email: "anjali@example.com",
    role: "student",
    isActive: true,
    registerNumber: "CS22001",
    className: "S6-CSE-A",
    advisorName: "Dr. Meera Raghunathan",
    createdAt: "2025-08-01T00:00:00.000Z",
  },
  {
    id: "f1",
    fullName: "Dr. Meera Raghunathan",
    email: "meera@example.com",
    role: "faculty",
    isActive: true,
    registerNumber: null,
    className: null,
    advisorName: null,
    createdAt: "2025-07-20T00:00:00.000Z",
  },
  {
    id: "s4",
    fullName: "Sneha Pillai",
    email: "sneha@example.com",
    role: "student",
    isActive: false,
    registerNumber: "CS22021",
    className: "S6-CSE-B",
    advisorName: null,
    createdAt: "2025-08-01T00:00:00.000Z",
  },
];

export const MOCK_DEPARTMENTS: DepartmentRow[] = [
  { id: "d1", code: "CSE", name: "Computer Science and Engineering", batchCount: 2 },
  { id: "d2", code: "ME", name: "Mechanical Engineering", batchCount: 1 },
];

export const MOCK_BATCHES: BatchRow[] = [
  {
    id: "b1",
    name: "2022-2026",
    departmentId: "d1",
    departmentName: "Computer Science and Engineering",
    startYear: 2022,
    endYear: 2026,
    classCount: 2,
  },
];

export const MOCK_CLASSES: ClassRow[] = [
  {
    id: "c1",
    name: "S6-CSE-A",
    batchId: "b1",
    batchName: "2022-2026",
    departmentName: "Computer Science and Engineering",
    advisor: MOCK_FACULTY[0],
    studentCount: 32,
  },
  {
    id: "c2",
    name: "S6-CSE-B",
    batchId: "b1",
    batchName: "2022-2026",
    departmentName: "Computer Science and Engineering",
    advisor: null,
    studentCount: 28,
  },
];

export const MOCK_UNASSIGNED: UnassignedApplication[] = [
  {
    applicationId: "a5",
    studentName: "Rahul Das",
    registerNumber: "CS22015",
    className: null,
    companyName: "CodeCraft Labs",
    submittedAt: "2026-01-03T08:00:00.000Z",
  },
];
