/**
 * Development seed. Run with `npm run db:seed`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THIS TRUNCATES EVERY TABLE FIRST. Point it at a development database only.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The goal is that every screen and every branch has something real behind it,
 * so each work package can test its own part without waiting for the others:
 *
 *   registration       a full department → batch → class tree, every class
 *                      carrying a faculty advisor
 *   student            one student with two internships, one with none
 *   faculty            two advisors with queues, and the handover case — a
 *                      student whose class moved while her internships did not
 *   admin              a populated org tree with nothing stuck in it
 *   verification       all five statuses, and a thread with a reply in it
 *   auth               a live refresh-token family, plus a consumed token to
 *                      replay at reuse detection
 *
 * Two things about this file are deliberate and worth not "fixing":
 *
 * 1. It does NOT import `@/db`. That module starts with `import "server-only"`,
 *    which throws outside a React Server Component build — so a plain `tsx`
 *    script cannot use it. This file opens its own connection instead.
 * 2. It connects over DIRECT_URL (port 5432), not the pooler, because bulk
 *    inserts in one transaction are exactly what a transaction pooler is bad at.
 *
 * Every account is seeded with the same password, printed at the end of the run.
 * Sign in as any of them at /login.
 */

import { createHash } from "node:crypto";

import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  authSessions,
  batches,
  classes,
  companies,
  departments,
  documents,
  internships,
  studentProfiles,
  users,
  verificationEvents,
} from "./schema";

/* ── ids ──────────────────────────────────────────────────────────────────────
 * Fixed, readable uuids so you can bookmark /student/internships/<id> and so a
 * re-run puts everything back exactly where it was.
 */

const id = (group: string, n: number) =>
  `${group}-0000-4000-8000-${String(n).padStart(12, "0")}`;

/** The three accounts you will spend most of your time signed in as. */
const DEV_STUDENT = "11111111-1111-4111-8111-111111111111"; // Priya Nair
const DEV_FACULTY = "22222222-2222-4222-8222-222222222222"; // Dr. Meera Raghunathan
const DEV_ADMIN = "33333333-3333-4333-8333-333333333333"; // System Administrator

const U = (n: number) => id("10000000", n); // the other users
const DEPT = (n: number) => id("20000000", n);
const BATCH = (n: number) => id("30000000", n);
const CLASS = (n: number) => id("40000000", n);
const CO = (n: number) => id("50000000", n);
const INT = (n: number) => id("60000000", n);
const DOC = (n: number) => id("70000000", n);
const EV = (n: number) => id("80000000", n);
const SESSION = (n: number) => id("90000000", n);
const FAMILY = (n: number) => id("a0000000", n);

const FACULTY_ANIL = U(1);
const STUDENT_ARUN = U(2);
const STUDENT_RAHUL = U(3);
const STUDENT_DIVYA = U(4);
const STUDENT_SNEHA = U(5);
const STUDENT_MAYA = U(6);
const STUDENT_NIKHIL = U(7);
const STUDENT_AISHA = U(8);
const STUDENT_ROHAN = U(9);
const STUDENT_NEHA = U(10);
const STUDENT_VIVEK = U(11);

/** Every seeded account shares this. Never used outside a dev database. */
const PASSWORD = "InternLens#2026";

/**
 * Opaque refresh tokens, in the clear, so package 1 can test rotation without a
 * login page existing. Only their sha256 goes in the database — same as the real
 * thing. RT_CONSUMED was rotated hours ago: replaying it must revoke the family.
 */
const RT_ACTIVE = "bb".repeat(32);
const RT_CONSUMED = "aa".repeat(32);
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/**
 * `tsx` is not Next, so nothing loads .env for us. Read the same two files Next
 * would, in the same precedence order, and let a real shell variable still win
 * over both. Done here rather than with node's --env-file flag because that flag
 * prints a notice for every file that does not exist.
 */
function loadEnv() {
  if (typeof process.loadEnvFile !== "function") return; // node < 20.12
  const fromShell = { ...process.env };
  for (const file of [".env", ".env.local"]) {
    try {
      process.loadEnvFile(file);
    } catch {
      // not there, which is fine
    }
  }
  Object.assign(process.env, fromShell);
}

async function main() {
  loadEnv();
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DIRECT_URL (or DATABASE_URL) is not set. Put it in .env or .env.local next to package.json.",
    );
  }

  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client);

  console.log(`→ ${url.replace(/:\/\/[^@]*@/, "://***@")}`);

  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 3_600_000);
  const daysFromNow = (d: number) => new Date(now + d * 86_400_000);

  try {
    // TRUNCATE, not DELETE: the business foreign keys are ON DELETE RESTRICT, so
    // a plain delete would be refused. Listing every table keeps CASCADE from
    // silently reaching somewhere unexpected.
    console.log("· truncating");
    await db.execute(sql`
      truncate table
        verification_events, documents, internships,
        student_profiles, classes, batches, departments,
        companies, auth_sessions, users
      restart identity cascade
    `);

    const passwordHash = await bcrypt.hash(PASSWORD, 10);

    /* ── users ────────────────────────────────────────────────────────────── */
    console.log("· users");
    await db.insert(users).values([
      {
        id: DEV_ADMIN,
        email: "admin@example.com",
        passwordHash,
        fullName: "System Administrator",
        role: "admin",
        lastLoginAt: hoursAgo(3),
      },
      {
        id: DEV_FACULTY,
        email: "meera@example.com",
        passwordHash,
        fullName: "Dr. Meera Raghunathan",
        role: "faculty",
        lastLoginAt: hoursAgo(20),
      },
      {
        // A second advisor so ownership and cross-faculty scoping are testable.
        id: FACULTY_ANIL,
        email: "anil@example.com",
        passwordHash,
        fullName: "Prof. Anil Kumar",
        role: "faculty",
      },
      {
        id: DEV_STUDENT,
        email: "priya@example.com",
        passwordHash,
        fullName: "Priya Nair",
        role: "student",
        lastLoginAt: hoursAgo(2),
      },
      {
        id: STUDENT_ARUN,
        email: "arun@example.com",
        passwordHash,
        fullName: "Arun Kumar",
        role: "student",
      },
      {
        id: STUDENT_RAHUL,
        email: "rahul@example.com",
        passwordHash,
        fullName: "Rahul Das",
        role: "student",
      },
      {
        // Meera's student with no internship at all — the student empty state.
        id: STUDENT_DIVYA,
        email: "divya@example.com",
        passwordHash,
        fullName: "Divya Raj",
        role: "student",
      },
      {
        id: STUDENT_MAYA,
        email: "maya@example.com",
        passwordHash,
        fullName: "Maya Menon",
        role: "student",
      },
      {
        id: STUDENT_NIKHIL,
        email: "nikhil@example.com",
        passwordHash,
        fullName: "Nikhil Varma",
        role: "student",
      },
      {
        id: STUDENT_AISHA,
        email: "aisha@example.com",
        passwordHash,
        fullName: "Aisha Rahman",
        role: "student",
      },
      {
        id: STUDENT_ROHAN,
        email: "rohan@example.com",
        passwordHash,
        fullName: "Rohan Mathew",
        role: "student",
      },
      {
        id: STUDENT_NEHA,
        email: "neha@example.com",
        passwordHash,
        fullName: "Neha Krishnan",
        role: "student",
      },
      {
        id: STUDENT_VIVEK,
        email: "vivek@example.com",
        passwordHash,
        fullName: "Vivek Nair",
        role: "student",
      },
      {
        // Deactivated on purpose: her next request must bounce to /login, she
        // must still be visible in the admin list under isActive=false, and she
        // must not be counted as one of Meera's active students.
        id: STUDENT_SNEHA,
        email: "sneha@example.com",
        passwordHash,
        fullName: "Sneha Pillai",
        role: "student",
        isActive: false,
        sessionVersion: 2, // bumped when she was deactivated
      },
    ]);

    /* ── org tree — what registration's cascading dropdowns read ──────────── */
    console.log("· departments, batches, classes");
    await db.insert(departments).values([
      { id: DEPT(1), code: "CSE", name: "Computer Science and Engineering" },
      { id: DEPT(2), code: "ME", name: "Mechanical Engineering" },
    ]);

    // Three batches under CSE and one under ME, so picking a department actually
    // changes the second dropdown.
    await db.insert(batches).values([
      { id: BATCH(1), departmentId: DEPT(1), name: "2021-2025", startYear: 2021, endYear: 2025 },
      { id: BATCH(2), departmentId: DEPT(1), name: "2022-2026", startYear: 2022, endYear: 2026 },
      { id: BATCH(3), departmentId: DEPT(1), name: "2023-2027", startYear: 2023, endYear: 2027 },
      { id: BATCH(4), departmentId: DEPT(2), name: "2022-2026", startYear: 2022, endYear: 2026 },
    ]);

    // Every class has an advisor. `classes.advisor_id` is NOT NULL, and that is
    // the whole reason an internship can never arrive with nobody to verify it.
    await db.insert(classes).values([
      { id: CLASS(1), batchId: BATCH(1), name: "S8-CSE-A", advisorId: DEV_FACULTY },
      // Two classes in one batch, so picking a batch changes the third dropdown.
      { id: CLASS(2), batchId: BATCH(2), name: "S6-CSE-A", advisorId: FACULTY_ANIL },
      { id: CLASS(3), batchId: BATCH(2), name: "S6-CSE-B", advisorId: DEV_FACULTY },
      // Anil's second and third, so the admin users list shows a faculty member
      // carrying several classes and Meera is not the only advisor with any.
      { id: CLASS(4), batchId: BATCH(3), name: "S4-CSE-A", advisorId: FACULTY_ANIL },
      { id: CLASS(5), batchId: BATCH(4), name: "S6-ME-A", advisorId: FACULTY_ANIL },
    ]);

    /* ── student profiles — every advisor-resolution path ─────────────────── */
    console.log("· student profiles");
    //
    // There is no `advisor_override_id` any more. Resolution is one hop —
    // student -> class -> advisor — and both links are NOT NULL, so every one of
    // these students has a reviewer the moment they submit.
    await db.insert(studentProfiles).values([
      {
        // S6-CSE-A, so Anil advises her now. Her two internships are still
        // frozen to Meera — see the note on INT(3): that is the handover case.
        userId: DEV_STUDENT,
        registerNumber: "CS22001",
        classId: CLASS(2),
      },
      {
        // S8-CSE-A, so Meera advises him by the ordinary path.
        userId: STUDENT_ARUN,
        registerNumber: "CS21001",
        classId: CLASS(1),
      },
      {
        userId: STUDENT_RAHUL,
        registerNumber: "ME22015",
        classId: CLASS(5),
      },
      {
        // Meera's student with no internship at all: the student empty state and
        // FacultyCounts.notSubmitted both need this row to exist.
        userId: STUDENT_DIVYA,
        registerNumber: "CS22003",
        classId: CLASS(3),
      },
      {
        userId: STUDENT_MAYA,
        registerNumber: "CS21002",
        classId: CLASS(1),
      },
      {
        userId: STUDENT_NIKHIL,
        registerNumber: "CS21003",
        classId: CLASS(1),
      },
      {
        userId: STUDENT_AISHA,
        registerNumber: "CS22004",
        classId: CLASS(3),
      },
      {
        userId: STUDENT_ROHAN,
        registerNumber: "CS22005",
        classId: CLASS(3),
      },
      {
        userId: STUDENT_NEHA,
        registerNumber: "CS22006",
        classId: CLASS(3),
      },
      {
        userId: STUDENT_VIVEK,
        registerNumber: "CS22007",
        classId: CLASS(3),
      },
      {
        userId: STUDENT_SNEHA,
        registerNumber: "CS22021",
        classId: CLASS(3),
      },
    ]);

    /* ── companies ────────────────────────────────────────────────────────── */
    console.log("· companies");
    await db.insert(companies).values([
      {
        id: CO(1),
        name: "TechNova Solutions",
        website: "https://technova.example.com",
        location: "Kochi",
      },
      { id: CO(2), name: "CloudSprint", website: null, location: "Remote" },
      {
        id: CO(3),
        name: "DataMinds Academy",
        website: "https://dataminds.example.com",
        location: "Chennai",
      },
      { id: CO(4), name: "EmbedWorks", website: null, location: "Coimbatore" },
      { id: CO(5), name: "CodeCraft Labs", website: null, location: "Bengaluru" },
      {
        id: CO(6),
        name: "PixelForge Studios",
        website: "https://pixelforge.example.com",
        location: "Bengaluru",
      },
      {
        id: CO(7),
        name: "FinEdge Analytics",
        website: "https://finedge.example.com",
        location: "Kochi",
      },
      {
        id: CO(8),
        name: "SecureStack Technologies",
        website: "https://securestack.example.com",
        location: "Remote",
      },
      {
        id: CO(9),
        name: "GreenGrid Energy",
        website: "https://greengrid.example.com",
        location: "Pune",
      },
      {
        id: CO(10),
        name: "AppOrbit Labs",
        website: "https://apporbit.example.com",
        location: "Hyderabad",
      },
    ]);

    /* ── internships — all five statuses, all four assignment sources ─────── */
    console.log("· internships");
    await db.insert(internships).values([
      {
        // 1 · VERIFIED — the original Explore fixture.
        id: INT(1),
        studentId: STUDENT_ARUN,
        companyId: CO(1),
        assignedFacultyId: DEV_FACULTY,
        assignmentSource: "class",
        status: "verified",
        roleTitle: "Frontend Developer Intern",
        domain: "web",
        workMode: "onsite",
        location: "Kochi",
        startDate: "2025-01-06",
        endDate: "2025-03-01",
        durationWeeks: 8,
        feeAmount: null,
        stipendAmount: 8000,
        workNature: "real_work",
        projectTitle: "Customer dashboard redesign",
        workSummary:
          "Rebuilt the customer dashboard in React. Shipped three screens that are now in production and wrote the tests for them. Code went through review like everyone else's.",
        hadMentor: true,
        mentorFrequency: "weekly",
        skillsBefore: ["React", "basic CSS"],
        skillsAfter: ["React", "TypeScript", "Tailwind", "Git workflow"],
        technologies: ["React", "TypeScript", "Vite", "Figma"],
        applicationSource: "company_website",
        applicationProcess:
          "Applied through the careers page in October. One portfolio review over a call, then a 45-minute technical interview. No online test.",
        beginnerFriendly: true,
        suitsWhom:
          "Anyone who has built a small React project on their own and wants to see how production code is actually reviewed and shipped.",
        submittedAt: new Date("2025-03-05T10:00:00Z"),
        verifiedAt: new Date("2025-03-12T06:00:00Z"),
        verifiedBy: DEV_FACULTY,
      },
      {
        // 2 · DRAFT — never leaves the owner. Must not appear on Explore, in any
        // queue, or in another student's view. No advisor yet: resolution only
        // happens at submit.
        id: INT(2),
        studentId: STUDENT_ARUN,
        companyId: CO(2),
        assignedFacultyId: null,
        assignmentSource: null,
        status: "draft",
        roleTitle: "Platform Intern",
        domain: "cloud",
        workMode: "remote",
        location: null,
        startDate: "2025-06-02",
        endDate: "2025-07-25",
        durationWeeks: 8,
        feeAmount: null,
        stipendAmount: null,
        workNature: "guided_project",
        projectTitle: null,
        workSummary: "Half-written. Still need to dig out the dates and the certificate.",
        hadMentor: false,
        mentorFrequency: null,
        skillsBefore: [],
        skillsAfter: [],
        technologies: [],
        applicationSource: null,
        applicationProcess: null,
        beginnerFriendly: null,
        suitsWhom: null,
      },
      {
        // 3 · SUBMITTED — sits in Meera's verification queue.
        // The "you paid to watch videos" case: a fee and no stipend.
        id: INT(3),
        studentId: DEV_STUDENT,
        companyId: CO(3),
        // Priya's class (S6-CSE-A) is advised by Anil, but this was submitted
        // to Meera and stays with her — the frozen advisor a handover leaves
        // behind. It is why the faculty dashboard counts students and
        // verifications separately. `direct` is a historical source value.
        assignedFacultyId: DEV_FACULTY,
        assignmentSource: "direct",
        status: "submitted",
        roleTitle: "Machine Learning Intern",
        domain: "ml",
        workMode: "remote",
        location: null,
        startDate: "2026-05-04",
        endDate: "2026-07-24",
        durationWeeks: 12,
        feeAmount: 15000,
        stipendAmount: null,
        workNature: "training_only",
        projectTitle: "Customer churn prediction (from their template)",
        workSummary:
          "Recorded video modules for eight weeks, then built the churn model from a template they provided. Everyone in the cohort built the same one. No access to real data.",
        hadMentor: false,
        mentorFrequency: null,
        skillsBefore: ["Python"],
        skillsAfter: ["Python", "scikit-learn", "pandas"],
        technologies: ["Python", "scikit-learn", "pandas", "Jupyter"],
        applicationSource: "linkedin",
        applicationProcess:
          "Saw a sponsored post on LinkedIn, filled a Google Form, paid the fee the same week. There was no interview.",
        beginnerFriendly: true,
        suitsWhom:
          "Someone who wants a structured first look at ML and does not mind that the project is not real. Do not expect production work.",
        submittedAt: new Date("2026-07-28T09:30:00Z"),
      },
      {
        // 4 · CHANGES_REQUESTED — editable by the student, has a live thread.
        id: INT(4),
        studentId: DEV_STUDENT,
        companyId: CO(5),
        assignedFacultyId: DEV_FACULTY,
        assignmentSource: "direct",
        status: "changes_requested",
        roleTitle: "DevOps Intern",
        domain: "cloud",
        workMode: "hybrid",
        location: "Kochi",
        startDate: "2025-12-08",
        endDate: "2026-02-06",
        durationWeeks: 9,
        feeAmount: null,
        stipendAmount: 6000,
        workNature: "guided_project",
        projectTitle: "CI pipeline for the internal admin tool",
        workSummary:
          "Set up a GitHub Actions pipeline for their internal admin tool with a staging deploy. Paired with a senior engineer for the first three weeks, then worked mostly alone.",
        hadMentor: true,
        mentorFrequency: "occasional",
        skillsBefore: ["Git", "basic Linux"],
        skillsAfter: ["GitHub Actions", "Docker", "Linux", "shell scripting"],
        technologies: ["Docker", "GitHub Actions", "AWS", "Bash"],
        applicationSource: "referral",
        applicationProcess:
          "A senior from the 2021-2025 batch referred me. One informal call, no test.",
        beginnerFriendly: false,
        suitsWhom:
          "Someone already comfortable on the command line. If you have never used Docker you will spend the first month catching up.",
        submittedAt: new Date("2026-02-10T08:00:00Z"),
      },
      {
        // 5 · SUBMITTED, in Anil's queue — the ordinary path, resolved through
        // Rahul's class (S6-ME-A). This used to be the "no advisor" fixture for
        // the admin repair queue; that state is now refused by
        // `internships_assigned_when_submitted_ck`, and the queue is gone.
        //
        // Still seeded with zero documents, which is an advisor's first red flag,
        // and it gives Anil something to review so his queue is not empty.
        id: INT(5),
        studentId: STUDENT_RAHUL,
        companyId: CO(4),
        assignedFacultyId: FACULTY_ANIL,
        assignmentSource: "class",
        status: "submitted",
        roleTitle: "Embedded Systems Intern",
        domain: "embedded-iot",
        workMode: "onsite",
        location: "Coimbatore",
        startDate: "2026-04-06",
        endDate: "2026-05-15",
        durationWeeks: 6,
        feeAmount: 5000,
        stipendAmount: null,
        workNature: "guided_project",
        projectTitle: "Sensor logger on an ESP32",
        workSummary:
          "Built a temperature and humidity logger on an ESP32 that pushed readings to a local dashboard. The hardware was provided and the circuit was given to us.",
        hadMentor: true,
        mentorFrequency: "daily",
        skillsBefore: ["C"],
        skillsAfter: ["C", "ESP32", "I2C", "soldering"],
        technologies: ["C", "ESP32", "PlatformIO"],
        applicationSource: "college",
        applicationProcess: "The department circulated it. Everyone who applied got in.",
        beginnerFriendly: true,
        suitsWhom: "A first internship for someone who wants to touch hardware.",
        submittedAt: new Date("2026-05-20T11:00:00Z"),
      },
      {
        // 6 · REJECTED, and assignment_source 'manual' — historical data from
        // when an admin could attach an advisor after the fact. Rahul's class is
        // Anil's, so this also proves a decided internship stays with the
        // faculty member who decided it. Same company as #1, so Explore must
        // show one card for TechNova, not two.
        id: INT(6),
        studentId: STUDENT_RAHUL,
        companyId: CO(1),
        assignedFacultyId: DEV_FACULTY,
        assignmentSource: "manual",
        status: "rejected",
        roleTitle: "Web Development Intern",
        domain: "web",
        workMode: "remote",
        location: null,
        startDate: "2025-08-01",
        endDate: "2025-08-20",
        durationWeeks: 3,
        feeAmount: 2000,
        stipendAmount: null,
        workNature: "training_only",
        projectTitle: null,
        workSummary: "Three weeks of recorded HTML and CSS videos with a quiz at the end.",
        hadMentor: false,
        mentorFrequency: null,
        skillsBefore: ["HTML"],
        skillsAfter: ["HTML", "CSS"],
        technologies: ["HTML", "CSS"],
        applicationSource: "other",
        applicationProcess: "Found it on an Instagram ad.",
        beginnerFriendly: true,
        suitsWhom: null,
        submittedAt: new Date("2025-09-01T07:00:00Z"),
      },
      /* 7–14 · VERIFIED — varied Explore cards and filter combinations. */
      {
        id: INT(7),
        studentId: STUDENT_MAYA,
        companyId: CO(2),
        assignedFacultyId: DEV_FACULTY,
        assignmentSource: "class",
        status: "verified",
        roleTitle: "Site Reliability Engineering Intern",
        domain: "cloud",
        workMode: "remote",
        location: null,
        startDate: "2025-05-05",
        endDate: "2025-07-11",
        durationWeeks: 10,
        feeAmount: 0,
        stipendAmount: 18000,
        workNature: "real_work",
        projectTitle: "Service health and incident dashboard",
        workSummary:
          "Added service-level indicators to the production monitoring stack, created alerts for two customer-facing APIs, and documented the incident response checklist used by the support rotation.",
        hadMentor: true,
        mentorFrequency: "weekly",
        skillsBefore: ["Linux", "Git", "basic networking"],
        skillsAfter: ["Prometheus", "Grafana", "Docker", "incident response"],
        technologies: ["Prometheus", "Grafana", "Docker", "GitHub Actions"],
        applicationSource: "linkedin",
        applicationProcess:
          "Applied from a LinkedIn listing, completed a Linux troubleshooting exercise, and discussed the solution with two engineers in a technical interview.",
        beginnerFriendly: false,
        suitsWhom:
          "Students comfortable with Linux and command-line debugging who want hands-on exposure to production reliability work.",
        submittedAt: new Date("2025-07-15T08:30:00Z"),
        verifiedAt: new Date("2025-07-20T06:15:00Z"),
        verifiedBy: DEV_FACULTY,
      },
      {
        id: INT(8),
        studentId: STUDENT_NIKHIL,
        companyId: CO(6),
        assignedFacultyId: DEV_FACULTY,
        assignmentSource: "class",
        status: "verified",
        roleTitle: "Product Design Intern",
        domain: "ui-ux",
        workMode: "hybrid",
        location: "Bengaluru",
        startDate: "2025-06-02",
        endDate: "2025-07-25",
        durationWeeks: 8,
        feeAmount: 0,
        stipendAmount: 10000,
        workNature: "guided_project",
        projectTitle: "Onboarding usability improvement",
        workSummary:
          "Interviewed new users, mapped the onboarding journey, tested two interactive prototypes, and handed a revised mobile flow to engineering with annotated states and accessibility notes.",
        hadMentor: true,
        mentorFrequency: "daily",
        skillsBefore: ["Figma", "wireframing"],
        skillsAfter: ["user interviews", "prototyping", "design systems", "accessibility"],
        technologies: ["Figma", "FigJam", "Maze"],
        applicationSource: "college",
        applicationProcess:
          "Submitted a portfolio through the department placement cell, then completed a short redesign exercise and one portfolio discussion.",
        beginnerFriendly: true,
        suitsWhom:
          "A student with a small portfolio who wants a structured introduction to user research and product design collaboration.",
        submittedAt: new Date("2025-07-29T09:00:00Z"),
        verifiedAt: new Date("2025-08-03T05:45:00Z"),
        verifiedBy: DEV_FACULTY,
      },
      {
        id: INT(9),
        studentId: STUDENT_AISHA,
        companyId: CO(7),
        assignedFacultyId: DEV_FACULTY,
        assignmentSource: "class",
        status: "verified",
        roleTitle: "Data Analytics Intern",
        domain: "data",
        workMode: "onsite",
        location: "Kochi",
        startDate: "2025-08-04",
        endDate: "2025-10-24",
        durationWeeks: 12,
        feeAmount: 0,
        stipendAmount: 15000,
        workNature: "real_work",
        projectTitle: "Merchant retention reporting",
        workSummary:
          "Cleaned monthly transaction exports, defined retention cohorts with the product analyst, and delivered a Power BI dashboard that replaced a manually maintained spreadsheet report.",
        hadMentor: true,
        mentorFrequency: "weekly",
        skillsBefore: ["Python", "SQL"],
        skillsAfter: ["data modelling", "Power BI", "cohort analysis", "stakeholder reviews"],
        technologies: ["Python", "PostgreSQL", "Power BI", "pandas"],
        applicationSource: "company_website",
        applicationProcess:
          "Applied through the company careers page, completed a SQL task using a sample dataset, and attended one analytics case interview.",
        beginnerFriendly: true,
        suitsWhom:
          "Students who know basic SQL and spreadsheets and want to learn how business questions become repeatable analytics reports.",
        submittedAt: new Date("2025-10-28T10:20:00Z"),
        verifiedAt: new Date("2025-11-01T07:10:00Z"),
        verifiedBy: DEV_FACULTY,
      },
      {
        id: INT(10),
        studentId: STUDENT_ROHAN,
        companyId: CO(8),
        assignedFacultyId: DEV_FACULTY,
        assignmentSource: "class",
        status: "verified",
        roleTitle: "Security Operations Intern",
        domain: "cybersecurity",
        workMode: "remote",
        location: null,
        startDate: "2025-11-03",
        endDate: "2025-12-26",
        durationWeeks: 8,
        feeAmount: 0,
        stipendAmount: 0,
        workNature: "real_work",
        projectTitle: "Phishing alert triage playbook",
        workSummary:
          "Reviewed simulated phishing alerts, enriched indicators with public threat intelligence, and converted repeated investigation steps into a playbook reviewed by the security operations lead.",
        hadMentor: true,
        mentorFrequency: "weekly",
        skillsBefore: ["networking", "Linux"],
        skillsAfter: ["alert triage", "threat intelligence", "incident documentation"],
        technologies: ["Wazuh", "VirusTotal", "Wireshark", "Linux"],
        applicationSource: "email",
        applicationProcess:
          "Sent a focused cold email with a home-lab write-up, completed a log-analysis task, and had a technical discussion with the SOC lead.",
        beginnerFriendly: false,
        suitsWhom:
          "Students with networking fundamentals and a small security lab who are comfortable documenting evidence carefully.",
        submittedAt: new Date("2025-12-29T08:00:00Z"),
        verifiedAt: new Date("2026-01-04T06:30:00Z"),
        verifiedBy: DEV_FACULTY,
      },
      {
        id: INT(11),
        studentId: STUDENT_NEHA,
        companyId: CO(9),
        assignedFacultyId: DEV_FACULTY,
        assignmentSource: "class",
        status: "verified",
        roleTitle: "Renewable Energy Systems Intern",
        domain: "other",
        workMode: "hybrid",
        location: "Pune",
        startDate: "2026-01-05",
        endDate: "2026-03-13",
        durationWeeks: 10,
        feeAmount: 2500,
        stipendAmount: 12000,
        workNature: "guided_project",
        projectTitle: "Solar output forecasting prototype",
        workSummary:
          "Prepared weather and generation datasets, compared baseline forecasting approaches, and presented a reproducible notebook explaining where the prototype failed during cloudy periods.",
        hadMentor: true,
        mentorFrequency: "weekly",
        skillsBefore: ["Python", "statistics"],
        skillsAfter: ["time-series validation", "feature engineering", "technical presentation"],
        technologies: ["Python", "pandas", "scikit-learn", "Jupyter"],
        applicationSource: "job_portal",
        applicationProcess:
          "Applied through a student job portal, completed a take-home data-cleaning task, and presented the notebook during a video interview.",
        beginnerFriendly: true,
        suitsWhom:
          "Students with basic Python and statistics who want a mentored project using imperfect real-world sensor data.",
        submittedAt: new Date("2026-03-17T11:10:00Z"),
        verifiedAt: new Date("2026-03-25T07:00:00Z"),
        verifiedBy: DEV_FACULTY,
      },
      {
        id: INT(12),
        studentId: STUDENT_VIVEK,
        companyId: CO(10),
        assignedFacultyId: DEV_FACULTY,
        assignmentSource: "class",
        status: "verified",
        roleTitle: "Android Developer Intern",
        domain: "mobile",
        workMode: "hybrid",
        location: "Hyderabad",
        startDate: "2026-03-09",
        endDate: "2026-05-08",
        durationWeeks: 9,
        feeAmount: 0,
        stipendAmount: 14000,
        workNature: "real_work",
        projectTitle: "Offline-first field survey module",
        workSummary:
          "Implemented local form storage, background synchronization, and retry states for an Android survey app used in areas with unreliable connectivity, including unit tests for conflict handling.",
        hadMentor: true,
        mentorFrequency: "daily",
        skillsBefore: ["Kotlin", "Android basics"],
        skillsAfter: ["Room", "WorkManager", "offline sync", "unit testing"],
        technologies: ["Kotlin", "Jetpack Compose", "Room", "WorkManager"],
        applicationSource: "referral",
        applicationProcess:
          "A senior referred the application. The process included a small Kotlin assignment, a code review, and one conversation with the mobile team lead.",
        beginnerFriendly: false,
        suitsWhom:
          "Students who have already built a basic Android app and want responsibility for a production feature with code review.",
        submittedAt: new Date("2026-05-11T09:40:00Z"),
        verifiedAt: new Date("2026-05-18T06:20:00Z"),
        verifiedBy: DEV_FACULTY,
      },
      {
        id: INT(13),
        studentId: STUDENT_ARUN,
        companyId: CO(5),
        assignedFacultyId: DEV_FACULTY,
        assignmentSource: "class",
        status: "verified",
        roleTitle: "QA Automation Intern",
        domain: "testing",
        workMode: "remote",
        location: null,
        startDate: "2026-05-04",
        endDate: "2026-06-12",
        durationWeeks: 6,
        feeAmount: 0,
        stipendAmount: 7000,
        workNature: "guided_project",
        projectTitle: "Regression suite for the checkout flow",
        workSummary:
          "Mapped critical checkout scenarios, automated browser tests for payment and coupon paths, and configured the suite to publish screenshots and traces whenever a CI run failed.",
        hadMentor: true,
        mentorFrequency: "occasional",
        skillsBefore: ["JavaScript", "manual testing"],
        skillsAfter: ["Playwright", "test design", "CI debugging"],
        technologies: ["TypeScript", "Playwright", "GitHub Actions"],
        applicationSource: "college",
        applicationProcess:
          "Joined through a department referral, completed a short bug-report exercise, and discussed testing priorities with the engineering manager.",
        beginnerFriendly: true,
        suitsWhom:
          "Students who know basic JavaScript and enjoy investigating edge cases more than building interface features.",
        submittedAt: new Date("2026-06-17T08:25:00Z"),
        verifiedAt: new Date("2026-06-30T05:50:00Z"),
        verifiedBy: DEV_FACULTY,
      },
      {
        id: INT(14),
        studentId: STUDENT_RAHUL,
        companyId: CO(4),
        assignedFacultyId: FACULTY_ANIL,
        assignmentSource: "class",
        status: "verified",
        roleTitle: "Firmware Validation Intern",
        domain: "embedded-iot",
        workMode: "onsite",
        location: "Coimbatore",
        startDate: "2026-05-18",
        endDate: "2026-07-10",
        durationWeeks: 8,
        feeAmount: 0,
        stipendAmount: 9000,
        workNature: "real_work",
        projectTitle: "Automated sensor-board validation rig",
        workSummary:
          "Wrote firmware checks for sensor calibration, captured serial logs from failed boards, and built a repeatable validation script that technicians could run before assembly sign-off.",
        hadMentor: true,
        mentorFrequency: "daily",
        skillsBefore: ["C", "microcontrollers"],
        skillsAfter: ["hardware debugging", "serial protocols", "test automation"],
        technologies: ["C", "ESP32", "Python", "PlatformIO"],
        applicationSource: "company_website",
        applicationProcess:
          "Applied on the company website, demonstrated an ESP32 project, and completed a practical debugging session with a firmware engineer.",
        beginnerFriendly: false,
        suitsWhom:
          "Students comfortable with C and microcontroller basics who want experience debugging both firmware and physical hardware.",
        submittedAt: new Date("2026-07-14T10:00:00Z"),
        verifiedAt: new Date("2026-07-22T06:40:00Z"),
        verifiedBy: FACULTY_ANIL,
      },
      /* 15–20 · SUBMITTED — six current students in Meera's review queue. */
      {
        id: INT(15),
        studentId: STUDENT_MAYA,
        companyId: CO(1),
        assignedFacultyId: DEV_FACULTY,
        assignmentSource: "class",
        status: "submitted",
        roleTitle: "Backend Developer Intern",
        domain: "web",
        workMode: "onsite",
        location: "Kochi",
        startDate: "2026-05-04",
        endDate: "2026-06-26",
        durationWeeks: 8,
        feeAmount: 0,
        stipendAmount: 10000,
        workNature: "real_work",
        projectTitle: "Support ticket workflow API",
        workSummary:
          "Implemented REST endpoints for ticket assignment and status changes, added database indexes for the support dashboard, and wrote integration tests for permissions and invalid transitions.",
        hadMentor: true,
        mentorFrequency: "weekly",
        skillsBefore: ["Node.js", "SQL"],
        skillsAfter: ["API design", "PostgreSQL", "integration testing", "code review"],
        technologies: ["Node.js", "TypeScript", "PostgreSQL", "Vitest"],
        applicationSource: "company_website",
        applicationProcess:
          "Applied through the careers page, completed a small API exercise, and attended one technical and one team-fit interview.",
        beginnerFriendly: false,
        suitsWhom:
          "Students who have built a CRUD API and want to learn production validation, authorization, and database performance basics.",
        submittedAt: new Date("2026-08-02T08:15:00Z"),
      },
      {
        id: INT(16),
        studentId: STUDENT_NIKHIL,
        companyId: CO(2),
        assignedFacultyId: DEV_FACULTY,
        assignmentSource: "class",
        status: "submitted",
        roleTitle: "Cloud Operations Intern",
        domain: "cloud",
        workMode: "remote",
        location: null,
        startDate: "2026-06-01",
        endDate: "2026-07-10",
        durationWeeks: 6,
        feeAmount: 0,
        stipendAmount: 8000,
        workNature: "guided_project",
        projectTitle: "Preview environment automation",
        workSummary:
          "Created a workflow that deployed a disposable preview environment for each pull request, added cleanup jobs, and documented common deployment failures for future interns.",
        hadMentor: true,
        mentorFrequency: "weekly",
        skillsBefore: ["Git", "basic Linux"],
        skillsAfter: ["Docker", "CI/CD", "cloud deployment", "runbooks"],
        technologies: ["Docker", "GitHub Actions", "AWS", "Bash"],
        applicationSource: "linkedin",
        applicationProcess:
          "Applied from a LinkedIn post, explained a personal deployment project, and completed a short shell-script review during the interview.",
        beginnerFriendly: true,
        suitsWhom:
          "Students comfortable with Git and Linux who want a supervised first project in deployment automation.",
        submittedAt: new Date("2026-08-05T09:35:00Z"),
      },
      {
        id: INT(17),
        studentId: STUDENT_AISHA,
        companyId: CO(8),
        assignedFacultyId: DEV_FACULTY,
        assignmentSource: "class",
        status: "submitted",
        roleTitle: "Application Security Intern",
        domain: "cybersecurity",
        workMode: "remote",
        location: null,
        startDate: "2026-05-18",
        endDate: "2026-07-10",
        durationWeeks: 8,
        feeAmount: 0,
        stipendAmount: 15000,
        workNature: "real_work",
        projectTitle: "Dependency risk review workflow",
        workSummary:
          "Triaged dependency alerts across three repositories, reproduced two vulnerable paths in a sandbox, and proposed a documented upgrade workflow with ownership and severity rules.",
        hadMentor: true,
        mentorFrequency: "daily",
        skillsBefore: ["web development", "OWASP basics"],
        skillsAfter: ["dependency analysis", "threat modelling", "security reporting"],
        technologies: ["Semgrep", "Dependabot", "Burp Suite", "Docker"],
        applicationSource: "email",
        applicationProcess:
          "Sent a cold email with a security write-up, completed a vulnerable-code review, and discussed findings with an application security engineer.",
        beginnerFriendly: false,
        suitsWhom:
          "Students who already understand web applications and want careful, evidence-driven security work rather than introductory training.",
        submittedAt: new Date("2026-08-08T07:50:00Z"),
      },
      {
        id: INT(18),
        studentId: STUDENT_ROHAN,
        companyId: CO(9),
        assignedFacultyId: DEV_FACULTY,
        assignmentSource: "class",
        status: "submitted",
        roleTitle: "Mobile Developer Intern",
        domain: "mobile",
        workMode: "hybrid",
        location: "Pune",
        startDate: "2026-05-04",
        endDate: "2026-07-10",
        durationWeeks: 10,
        feeAmount: 0,
        stipendAmount: 12000,
        workNature: "real_work",
        projectTitle: "Solar maintenance inspection app",
        workSummary:
          "Built inspection forms with offline drafts, photo compression, and validation for field technicians, then fixed synchronization issues found during a pilot at two solar sites.",
        hadMentor: true,
        mentorFrequency: "weekly",
        skillsBefore: ["React", "JavaScript"],
        skillsAfter: ["React Native", "offline storage", "mobile debugging"],
        technologies: ["React Native", "TypeScript", "SQLite", "Expo"],
        applicationSource: "job_portal",
        applicationProcess:
          "Applied through a student job portal, submitted a small React Native screen, and reviewed the implementation with the mobile lead.",
        beginnerFriendly: true,
        suitsWhom:
          "Students with React fundamentals who want to learn mobile constraints through a mentored production feature.",
        submittedAt: new Date("2026-08-11T10:05:00Z"),
      },
      {
        id: INT(19),
        studentId: STUDENT_NEHA,
        companyId: CO(10),
        assignedFacultyId: DEV_FACULTY,
        assignmentSource: "class",
        status: "submitted",
        roleTitle: "Test Automation Intern",
        domain: "testing",
        workMode: "onsite",
        location: "Hyderabad",
        startDate: "2026-06-01",
        endDate: "2026-07-17",
        durationWeeks: 7,
        feeAmount: 0,
        stipendAmount: 9000,
        workNature: "guided_project",
        projectTitle: "Mobile release smoke-test suite",
        workSummary:
          "Converted the team's release checklist into automated device tests, recorded flaky cases with reproducible evidence, and added a concise report for each nightly test run.",
        hadMentor: true,
        mentorFrequency: "daily",
        skillsBefore: ["Java", "manual testing"],
        skillsAfter: ["Appium", "test automation", "failure analysis"],
        technologies: ["Java", "Appium", "Android", "GitHub Actions"],
        applicationSource: "college",
        applicationProcess:
          "The department shared the opening. Applicants completed a bug-report exercise and a short programming discussion before selection.",
        beginnerFriendly: true,
        suitsWhom:
          "Students with basic programming skills who enjoy systematic testing and want daily guidance from a QA engineer.",
        submittedAt: new Date("2026-08-14T08:40:00Z"),
      },
      {
        id: INT(20),
        studentId: STUDENT_VIVEK,
        companyId: CO(6),
        assignedFacultyId: DEV_FACULTY,
        assignmentSource: "class",
        status: "submitted",
        roleTitle: "UX Engineering Intern",
        domain: "ui-ux",
        workMode: "hybrid",
        location: "Bengaluru",
        startDate: "2026-06-08",
        endDate: "2026-07-17",
        durationWeeks: 6,
        feeAmount: 0,
        stipendAmount: 11000,
        workNature: "guided_project",
        projectTitle: "Accessible component prototype library",
        workSummary:
          "Translated design-system components into responsive prototypes, added keyboard and screen-reader behaviour, and documented implementation notes for the frontend engineering team.",
        hadMentor: true,
        mentorFrequency: "weekly",
        skillsBefore: ["Figma", "HTML", "CSS"],
        skillsAfter: ["design systems", "accessibility", "component documentation"],
        technologies: ["Figma", "Storybook", "React", "TypeScript"],
        applicationSource: "referral",
        applicationProcess:
          "A design-club alumnus referred the application. The process included a portfolio review and a small accessible-component exercise.",
        beginnerFriendly: true,
        suitsWhom:
          "Students who enjoy both design and frontend implementation and want a guided introduction to accessibility.",
        submittedAt: new Date("2026-08-17T09:20:00Z"),
      },
    ]);

    /* ── documents ────────────────────────────────────────────────────────── */
    // NOTE: nothing is uploaded to Supabase Storage by this seed, so these rows
    // list and count correctly but a download will 404 at the bucket. Upload a
    // real file through the app to exercise the signed-URL path end to end.
    console.log("· documents");
    await db.insert(documents).values([
      {
        id: DOC(1),
        internshipId: INT(1),
        docType: "Completion certificate",
        storagePath: `internship/${INT(1)}/${DOC(1)}.pdf`,
        originalFilename: "technova-completion-certificate.pdf",
        mimeType: "application/pdf",
        sizeBytes: 245_760,
        uploadedBy: STUDENT_ARUN,
      },
      {
        id: DOC(2),
        internshipId: INT(1),
        docType: "Offer letter",
        storagePath: `internship/${INT(1)}/${DOC(2)}.pdf`,
        originalFilename: "technova-offer.pdf",
        mimeType: "application/pdf",
        sizeBytes: 118_400,
        uploadedBy: STUDENT_ARUN,
      },
      {
        id: DOC(3),
        internshipId: INT(3),
        docType: "Completion certificate",
        storagePath: `internship/${INT(3)}/${DOC(3)}.pdf`,
        originalFilename: "dataminds-certificate.pdf",
        mimeType: "application/pdf",
        sizeBytes: 301_112,
        uploadedBy: DEV_STUDENT,
      },
      {
        // A doc_type that is NOT in DOCUMENT_TYPES, proving the column takes
        // whatever the student typed rather than a fixed vocabulary.
        id: DOC(4),
        internshipId: INT(4),
        docType: "Pipeline handover notes",
        storagePath: `internship/${INT(4)}/${DOC(4)}.pdf`,
        originalFilename: "handover.pdf",
        mimeType: "application/pdf",
        sizeBytes: 88_020,
        uploadedBy: DEV_STUDENT,
      },
      {
        // An image rather than a PDF, so the download route has both to handle.
        id: DOC(5),
        internshipId: INT(4),
        docType: "Logbook / weekly report",
        storagePath: `internship/${INT(4)}/${DOC(5)}.png`,
        originalFilename: "week-scan.png",
        mimeType: "image/png",
        sizeBytes: 1_204_880,
        uploadedBy: DEV_STUDENT,
      },
      {
        id: DOC(6),
        internshipId: INT(6),
        docType: "Completion certificate",
        storagePath: `internship/${INT(6)}/${DOC(6)}.pdf`,
        originalFilename: "certificate.pdf",
        mimeType: "application/pdf",
        sizeBytes: 61_004,
        uploadedBy: STUDENT_RAHUL,
      },
      {
        id: DOC(7),
        internshipId: INT(15),
        docType: "Completion certificate",
        storagePath: `internship/${INT(15)}/${DOC(7)}.pdf`,
        originalFilename: "technova-backend-certificate.pdf",
        mimeType: "application/pdf",
        sizeBytes: 214_300,
        uploadedBy: STUDENT_MAYA,
      },
      {
        id: DOC(8),
        internshipId: INT(15),
        docType: "Offer letter",
        storagePath: `internship/${INT(15)}/${DOC(8)}.pdf`,
        originalFilename: "technova-backend-offer.pdf",
        mimeType: "application/pdf",
        sizeBytes: 126_840,
        uploadedBy: STUDENT_MAYA,
      },
      {
        id: DOC(9),
        internshipId: INT(16),
        docType: "Project report",
        storagePath: `internship/${INT(16)}/${DOC(9)}.pdf`,
        originalFilename: "preview-environments-report.pdf",
        mimeType: "application/pdf",
        sizeBytes: 482_900,
        uploadedBy: STUDENT_NIKHIL,
      },
      {
        id: DOC(10),
        internshipId: INT(18),
        docType: "Completion certificate",
        storagePath: `internship/${INT(18)}/${DOC(10)}.pdf`,
        originalFilename: "greengrid-mobile-certificate.pdf",
        mimeType: "application/pdf",
        sizeBytes: 196_220,
        uploadedBy: STUDENT_ROHAN,
      },
      {
        id: DOC(11),
        internshipId: INT(19),
        docType: "Logbook / weekly report",
        storagePath: `internship/${INT(19)}/${DOC(11)}.pdf`,
        originalFilename: "apporbit-testing-logbook.pdf",
        mimeType: "application/pdf",
        sizeBytes: 358_740,
        uploadedBy: STUDENT_NEHA,
      },
      {
        id: DOC(12),
        internshipId: INT(20),
        docType: "Project report",
        storagePath: `internship/${INT(20)}/${DOC(12)}.pdf`,
        originalFilename: "accessible-components-report.pdf",
        mimeType: "application/pdf",
        sizeBytes: 527_610,
        uploadedBy: STUDENT_VIVEK,
      },
    ]);

    /* ── verification events ──────────────────────────────────────────────── */
    // Every reason here is >= 10 characters after trimming, because
    // verification_events_reason_ck refuses anything shorter.
    console.log("· verification events");
    await db.insert(verificationEvents).values([
      {
        id: EV(1),
        internshipId: INT(1),
        actorId: DEV_FACULTY,
        action: "verify",
        reason: null, // the one action allowed to have no reason
        createdAt: new Date("2025-03-12T06:00:00Z"),
      },
      {
        id: EV(2),
        internshipId: INT(4),
        actorId: DEV_FACULTY,
        action: "request_changes",
        reason:
          "The certificate is missing and the stipend figure does not match what the handover notes say. Please attach the certificate and check the amount.",
        createdAt: new Date("2026-02-14T09:15:00Z"),
      },
      {
        id: EV(3),
        internshipId: INT(4),
        actorId: DEV_STUDENT,
        action: "respond",
        reason:
          "Corrected the stipend — it was 6,000 a month, I had written the total. Still chasing the company for the certificate.",
        createdAt: new Date("2026-02-15T11:02:00Z"),
      },
      {
        id: EV(4),
        internshipId: INT(6),
        actorId: DEV_FACULTY,
        action: "reject",
        reason:
          "Three weeks of recorded videos with no project and no supervision does not meet the internship requirement. Please speak to me before registering for another paid course like this.",
        createdAt: new Date("2025-09-04T10:20:00Z"),
      },
      {
        id: EV(5),
        internshipId: INT(7),
        actorId: DEV_FACULTY,
        action: "verify",
        reason: null,
        createdAt: new Date("2025-07-20T06:15:00Z"),
      },
      {
        id: EV(6),
        internshipId: INT(8),
        actorId: DEV_FACULTY,
        action: "verify",
        reason: null,
        createdAt: new Date("2025-08-03T05:45:00Z"),
      },
      {
        id: EV(7),
        internshipId: INT(9),
        actorId: DEV_FACULTY,
        action: "verify",
        reason: null,
        createdAt: new Date("2025-11-01T07:10:00Z"),
      },
      {
        id: EV(8),
        internshipId: INT(10),
        actorId: DEV_FACULTY,
        action: "verify",
        reason: null,
        createdAt: new Date("2026-01-04T06:30:00Z"),
      },
      {
        id: EV(9),
        internshipId: INT(11),
        actorId: DEV_FACULTY,
        action: "verify",
        reason: null,
        createdAt: new Date("2026-03-25T07:00:00Z"),
      },
      {
        id: EV(10),
        internshipId: INT(12),
        actorId: DEV_FACULTY,
        action: "verify",
        reason: null,
        createdAt: new Date("2026-05-18T06:20:00Z"),
      },
      {
        id: EV(11),
        internshipId: INT(13),
        actorId: DEV_FACULTY,
        action: "verify",
        reason: null,
        createdAt: new Date("2026-06-30T05:50:00Z"),
      },
      {
        id: EV(12),
        internshipId: INT(14),
        actorId: FACULTY_ANIL,
        action: "verify",
        reason: null,
        createdAt: new Date("2026-07-22T06:40:00Z"),
      },
    ]);

    /* ── auth sessions ────────────────────────────────────────────────────── */
    // One family for Priya with a consumed parent and a live child, so rotation
    // and reuse detection are both testable before the login page exists.
    console.log("· auth sessions");
    await db.insert(authSessions).values([
      {
        id: SESSION(1),
        userId: DEV_STUDENT,
        familyId: FAMILY(1),
        tokenHash: sha256(RT_CONSUMED),
        expiresAt: daysFromNow(30),
        rotatedAt: hoursAgo(2), // well outside the 30-second grace window
      },
      {
        id: SESSION(2),
        userId: DEV_STUDENT,
        familyId: FAMILY(1),
        tokenHash: sha256(RT_ACTIVE),
        expiresAt: daysFromNow(30), // absolute, inherited from the parent
      },
    ]);

    console.log(`
✓ seeded

  11 students (1 deactivated) · 2 faculty · 1 admin
  2 departments · 4 batches · 5 classes  (every class has an advisor — NOT NULL)
  10 companies · 20 internships · 12 documents · 12 verification events · 2 sessions

  Statuses      draft 1 · submitted 8 · changes_requested 1 · verified 9 · rejected 1
  Advisor       'class' 16 · 'direct' 2 · 'manual' 1 · draft (none yet) 1
  Explore       shows 9 verified cards across 9 domains and varied filters
  Meera queue   shows 7 submissions: Priya's handover row plus 6 current students

  THE HANDOVER CASE, seeded deliberately: Priya's class is Anil's, but both of
  her internships are frozen to Meera. So Meera's dashboard shows fewer
  students than verifications, and Anil advises her without seeing her history.
  That is the split the faculty dashboard captions apart.

  Password for every account: ${PASSWORD}

    admin@example.com   System Administrator   nothing stuck — there is no repair queue
    meera@example.com   Dr. Meera Raghunathan  8 active students · 7 to verify
                                               + Priya's 2, frozen from before the handover
    anil@example.com    Prof. Anil Kumar       2 students · 1 to verify · 1 published
    priya@example.com   Priya Nair             2 internships (1 submitted, 1 needs fixing)
    arun@example.com    Arun Kumar             2 published cards, plus a private draft
    rahul@example.com   Rahul Das              1 published, 1 submitted, 1 rejected
    divya@example.com   Divya Raj              nothing yet — the student empty state
    maya@example.com through vivek@example.com each has 1 published + 1 submitted
    sneha@example.com   Sneha Pillai           DEACTIVATED — must bounce to /login

  Register numbers taken: CS21001-3 CS22001 CS22003-7 CS22021 ME22015

  Refresh tokens for package 1, in the clear (only the sha256 is stored):
    active   ${RT_ACTIVE}
    consumed ${RT_CONSUMED}   ← replaying this must revoke the family
`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("\n✗ seed failed\n", error);
  process.exit(1);
});
