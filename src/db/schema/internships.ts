import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { companies } from "./companies";
import {
  applicationSourceEnum,
  assignmentSourceEnum,
  internshipStatusEnum,
  mentorFrequencyEnum,
  workModeEnum,
  workNatureEnum,
} from "./enums";
import { users } from "./users";

/**
 * The Reality Card — one row per internship, written by the student after it
 * happened and verified by their advisor. Public only when `status = 'verified'`.
 *
 * There is no pre-internship approval stage: any student may start one of these
 * at any time. This row is therefore STANDALONE — every fact the card renders
 * lives here, so it never joins to explain itself.
 */
export const internships = pgTable(
  "internships",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "restrict" }),
    /**
     * Resolved once at submit time and then frozen, so a later class change
     * cannot rewrite who owned an already-verified internship. NULL is allowed:
     * a student must never be blocked because an admin has not finished setting
     * the org tree up — the admin dashboard counts these and assigns one.
     */
    assignedFacultyId: uuid("assigned_faculty_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    /** How `assignedFacultyId` was decided. */
    assignmentSource: assignmentSourceEnum("assignment_source"),

    status: internshipStatusEnum("status").notNull().default("draft"),

    // basics — what the student actually did
    roleTitle: text("role_title").notNull(),
    domain: text("domain").notNull(), // stable slug from lib/constants
    workMode: workModeEnum("work_mode").notNull(),
    location: text("location"),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    /** Denormalised so Explore can sort and filter without date maths. */
    durationWeeks: integer("duration_weeks").notNull(),

    // financial reality, in whole rupees.
    // NULL = not disclosed, 0 = genuinely free. The difference matters.
    feeAmount: integer("fee_amount"),
    stipendAmount: integer("stipend_amount"),

    // work
    workNature: workNatureEnum("work_nature").notNull(),
    projectTitle: text("project_title"),
    workSummary: text("work_summary").notNull(),

    // mentorship
    hadMentor: boolean("had_mentor").notNull().default(false),
    mentorFrequency: mentorFrequencyEnum("mentor_frequency"),

    // learning
    skillsBefore: text("skills_before").array(),
    skillsAfter: text("skills_after").array(),
    technologies: text("technologies").array(),

    // how they got in at the company
    applicationSource: applicationSourceEnum("application_source"),
    applicationProcess: text("application_process"),

    // suitability — guidance, never a rating or a ranking
    beginnerFriendly: boolean("beginner_friendly"),
    suitsWhom: text("suits_whom"),

    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verifiedBy: uuid("verified_by").references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Explore: partial indexes so only publishable rows are in them
    index("internships_explore_idx").on(t.verifiedAt).where(sql`status = 'verified'`),
    index("internships_explore_domain_idx")
      .on(t.domain)
      .where(sql`status = 'verified'`),
    index("internships_explore_company_idx")
      .on(t.companyId)
      .where(sql`status = 'verified'`),
    // the faculty verification queue — the hottest read in the app
    index("internships_faculty_idx").on(t.assignedFacultyId, t.status),
    index("internships_student_idx").on(t.studentId),
  ],
);

export type Internship = typeof internships.$inferSelect;
export type NewInternship = typeof internships.$inferInsert;
