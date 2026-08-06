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
 *   registration       a full department → batch → class tree, including a class
 *                      with an advisor and a class without one
 *   student            one student with two internships, one with none
 *   faculty            one advisor with a full queue, one with nothing at all
 *   admin              an internship with no advisor and classes with no advisor
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
        // A second advisor with nothing assigned to them, so the faculty empty
        // state is reachable without deleting anything.
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

    await db.insert(classes).values([
      { id: CLASS(1), batchId: BATCH(1), name: "S8-CSE-A", advisorId: DEV_FACULTY },
      // Two classes in one batch, so picking a batch changes the third dropdown.
      { id: CLASS(2), batchId: BATCH(2), name: "S6-CSE-A", advisorId: FACULTY_ANIL },
      { id: CLASS(3), batchId: BATCH(2), name: "S6-CSE-B", advisorId: DEV_FACULTY },
      // These two are advisor-less on purpose: they are what makes
      // AdminCounts.classesWithoutAdvisor equal 2. Register into one of them and
      // your internship will submit with no advisor — which is allowed.
      { id: CLASS(4), batchId: BATCH(3), name: "S4-CSE-A", advisorId: null },
      { id: CLASS(5), batchId: BATCH(4), name: "S6-ME-A", advisorId: null },
    ]);

    /* ── student profiles — every advisor-resolution path ─────────────────── */
    console.log("· student profiles");
    await db.insert(studentProfiles).values([
      {
        // 'direct': her class advisor is Anil, but the override sends her to
        // Meera. This is the row that proves override beats class.
        userId: DEV_STUDENT,
        registerNumber: "CS22001",
        classId: CLASS(2),
        advisorOverrideId: DEV_FACULTY,
      },
      {
        // 'class': no override, resolves through S8-CSE-A to Meera.
        userId: STUDENT_ARUN,
        registerNumber: "CS21001",
        classId: CLASS(1),
        advisorOverrideId: null,
      },
      {
        // Nothing resolves — his class has no advisor and he has no override.
        userId: STUDENT_RAHUL,
        registerNumber: "ME22015",
        classId: CLASS(5),
        advisorOverrideId: null,
      },
      {
        // Meera's student with no internship at all: the student empty state and
        // FacultyCounts.notSubmitted both need this row to exist.
        userId: STUDENT_DIVYA,
        registerNumber: "CS22003",
        classId: CLASS(3),
        advisorOverrideId: null,
      },
      {
        userId: STUDENT_SNEHA,
        registerNumber: "CS22021",
        classId: CLASS(3),
        advisorOverrideId: null,
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
    ]);

    /* ── internships — all five statuses, all four assignment sources ─────── */
    console.log("· internships");
    await db.insert(internships).values([
      {
        // 1 · VERIFIED — the only row Explore will show.
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
        // 5 · SUBMITTED WITH NO ADVISOR — the admin's repair queue.
        // Also seeded with zero documents, which is the advisor's first red flag.
        id: INT(5),
        studentId: STUDENT_RAHUL,
        companyId: CO(4),
        assignedFacultyId: null,
        assignmentSource: null,
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
        // 6 · REJECTED, and assignment_source 'manual' — an admin attached Meera
        // to it after the fact, which is the repair path in §4. Same company as
        // #1, so Explore must show one card for TechNova, not two.
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

  5 students (1 deactivated) · 2 faculty · 1 admin
  2 departments · 4 batches · 5 classes  (S4-CSE-A and S6-ME-A have no advisor)
  5 companies · 6 internships · 6 documents · 4 verification events · 2 sessions

  Statuses      draft 1 · submitted 2 · changes_requested 1 · verified 1 · rejected 1
  Advisor       'class' 1 · 'direct' 2 · 'manual' 1 · unresolved 2
  Explore       shows exactly 1 card (the verified one)

  Password for every account: ${PASSWORD}

    admin@example.com   System Administrator   1 unassigned internship, 2 classes to staff
    meera@example.com   Dr. Meera Raghunathan  3 students · 1 to verify · 1 awaiting reply
    anil@example.com    Prof. Anil Kumar       0 students — the faculty empty state
    priya@example.com   Priya Nair             2 internships (1 submitted, 1 needs fixing)
    arun@example.com    Arun Kumar             the published card, plus a private draft
    rahul@example.com   Rahul Das              1 with no advisor, 1 rejected
    divya@example.com   Divya Raj              nothing yet — the student empty state
    sneha@example.com   Sneha Pillai           DEACTIVATED — must bounce to /login

  Register numbers taken: CS21001 CS22001 CS22003 CS22021 ME22015
  Register a new student into S4-CSE-A or S6-ME-A to get an advisor-less one.

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
