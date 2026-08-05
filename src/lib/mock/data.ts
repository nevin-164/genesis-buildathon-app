import "server-only";

import type {
  AdminCounts,
  AdminUserRow,
  AssignedStudent,
  BatchRow,
  ClassRow,
  CompanyOption,
  DepartmentRow,
  DocumentRef,
  ExploreCard,
  FacultyCounts,
  FacultyOption,
  InternshipDetail,
  InternshipListItem,
  OrgTree,
  QueueItem,
  RealityCard,
  StudentDashboard,
  TimelineEntry,
  UnassignedInternship,
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

const MOCK_DOCUMENTS: DocumentRef[] = [
  {
    id: "doc1",
    docType: "Completion certificate",
    originalFilename: "codecraft-certificate.pdf",
    sizeBytes: 245_760,
    downloadUrl: "/api/documents/doc1/download",
  },
  {
    id: "doc2",
    docType: "Logbook / weekly report",
    originalFilename: "weekly-log.pdf",
    sizeBytes: 512_000,
    downloadUrl: "/api/documents/doc2/download",
  },
];

const TIMELINE: TimelineEntry[] = [
  {
    id: "v1",
    actorName: "Dr. Meera Raghunathan",
    actorRole: "faculty",
    action: "request_changes",
    reason: "The certificate is attached but the stipend figure does not match it.",
    createdAt: "2026-04-03T09:15:00.000Z",
  },
  {
    id: "v2",
    actorName: "Priya Nair",
    actorRole: "student",
    action: "respond",
    reason: "Corrected — it was unpaid, I had confused it with the travel allowance.",
    createdAt: "2026-04-04T11:02:00.000Z",
  },
];

export const MOCK_INTERNSHIP_LIST: InternshipListItem[] = [
  {
    id: "i1",
    companyName: "CodeCraft Labs",
    roleTitle: "Machine Learning Intern",
    status: "submitted",
    submittedAt: "2026-04-02T10:00:00.000Z",
    latestReason: null,
  },
];

export const MOCK_INTERNSHIP_DETAIL: InternshipDetail = {
  ...MOCK_INTERNSHIP_LIST[0],
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
  facultyName: "Dr. Meera Raghunathan",
  documents: MOCK_DOCUMENTS,
  timeline: TIMELINE,
  canEdit: false,
  canSubmit: false,
};

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
  internship: MOCK_INTERNSHIP_LIST[0],
  nextAction: "await_verification",
};

export const MOCK_FACULTY_COUNTS: FacultyCounts = {
  assignedStudents: 32,
  notSubmitted: 11,
  pendingVerifications: 4,
  changesRequested: 3,
  verified: 14,
  rejected: 2,
};

export const MOCK_ASSIGNED_STUDENTS: AssignedStudent[] = [
  {
    id: "s1",
    fullName: "Anjali Menon",
    email: "anjali@example.com",
    registerNumber: "CS22001",
    className: "S6-CSE-A",
    internshipStatus: "submitted",
  },
  {
    id: "s2",
    fullName: "Arun Kumar",
    email: "arun@example.com",
    registerNumber: "CS22002",
    className: "S6-CSE-A",
    internshipStatus: "verified",
  },
  {
    id: "s3",
    fullName: "Divya Raj",
    email: "divya@example.com",
    registerNumber: "CS22003",
    className: "S6-CSE-A",
    internshipStatus: null,
  },
];

export const MOCK_QUEUE: QueueItem[] = [
  {
    id: "i1",
    studentName: "Anjali Menon",
    registerNumber: "CS22001",
    companyName: "TechNova Solutions",
    roleTitle: "Frontend Developer Intern",
    submittedAt: "2026-04-02T08:00:00.000Z",
    waitingDays: 6,
    documentCount: 2,
  },
  {
    id: "i4",
    studentName: "Rahul Das",
    registerNumber: "CS22015",
    companyName: "CodeCraft Labs",
    roleTitle: "Machine Learning Intern",
    submittedAt: "2026-04-05T08:00:00.000Z",
    waitingDays: 3,
    documentCount: 0,
  },
];

export const MOCK_VERIFICATION_DETAIL: VerificationDetail = {
  internship: MOCK_INTERNSHIP_DETAIL,
  student: {
    id: "s2",
    fullName: "Arun Kumar",
    registerNumber: "CS22002",
    className: "S6-CSE-A",
  },
};

export const MOCK_ADMIN_COUNTS: AdminCounts = {
  totalStudents: 214,
  totalFaculty: 18,
  unassignedInternships: 3,
  classesWithoutAdvisor: 2,
  pendingVerifications: 47,
  publishedInternships: 31,
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

export const MOCK_UNASSIGNED: UnassignedInternship[] = [
  {
    internshipId: "i5",
    studentName: "Rahul Das",
    registerNumber: "CS22015",
    className: null,
    companyName: "CodeCraft Labs",
    submittedAt: "2026-04-03T08:00:00.000Z",
  },
];
