import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { internshipApplications } from "./applications";
import { companies } from "./companies";
import {
  applicationSourceEnum,
  experienceStatusEnum,
  mentorFrequencyEnum,
  workModeEnum,
  workNatureEnum,
} from "./enums";
import { users } from "./users";

/**
 * The Reality Card — what actually happened. Public only when `status = 'verified'`.
 *
 * `applicationId` is UNIQUE NOT NULL, which on its own enforces three rules:
 * one experience per internship, no experience without an application, and
 * no experience without faculty approval (only approved applications spawn one).
 */
export const experiences = pgTable(
  "experiences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => internshipApplications.id, { onDelete: "restrict" }),

    // copied from the application at creation, then frozen
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "restrict" }),
    assignedFacultyId: uuid("assigned_faculty_id").references(() => users.id, {
      onDelete: "restrict",
    }),

    status: experienceStatusEnum("status").notNull().default("draft"),

    // basics — the actuals, which may differ from the plan
    roleTitle: text("role_title").notNull(),
    domain: text("domain").notNull(),
    workMode: workModeEnum("work_mode").notNull(),
    location: text("location"),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    durationWeeks: integer("duration_weeks").notNull(),

    // financial reality
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

    // application path
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
    uniqueIndex("experiences_application_key").on(t.applicationId),
    // Explore: partial indexes so only publishable rows are in them
    index("experiences_explore_idx").on(t.verifiedAt).where(sql`status = 'verified'`),
    index("experiences_explore_domain_idx")
      .on(t.domain)
      .where(sql`status = 'verified'`),
    index("experiences_explore_company_idx")
      .on(t.companyId)
      .where(sql`status = 'verified'`),
    // faculty verification queue
    index("experiences_faculty_idx").on(t.assignedFacultyId, t.status),
    index("experiences_student_idx").on(t.studentId),
  ],
);

export type Experience = typeof experiences.$inferSelect;
export type NewExperience = typeof experiences.$inferInsert;
