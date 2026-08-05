import { date, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { companies } from "./companies";
import {
  applicationSourceEnum,
  applicationStatusEnum,
  assignmentSourceEnum,
  workModeEnum,
} from "./enums";
import { users } from "./users";

/**
 * The pre-internship approval request. Never public — this row exists so the
 * assigned faculty advisor can approve the internship before it starts.
 */
export const internshipApplications = pgTable(
  "internship_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "restrict" }),

    status: applicationStatusEnum("status").notNull().default("draft"),

    /**
     * Resolved once at submit time and then frozen, so a later class change
     * cannot rewrite who owned an already-decided application.
     */
    assignedFacultyId: uuid("assigned_faculty_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    assignmentSource: assignmentSourceEnum("assignment_source"),

    // the plan
    roleTitle: text("role_title").notNull(),
    domain: text("domain").notNull(), // stable slug from lib/constants
    workMode: workModeEnum("work_mode").notNull(),
    location: text("location"),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    durationWeeks: integer("duration_weeks").notNull(),
    applicationSource: applicationSourceEnum("application_source"),

    // money, in whole rupees
    feeAmount: integer("fee_amount"),
    stipendAmount: integer("stipend_amount"),

    expectedWork: text("expected_work"),
    technologies: text("technologies").array(),

    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // the faculty approval queue — the hottest read in the app
    index("applications_faculty_idx").on(t.assignedFacultyId, t.status),
    index("applications_student_idx").on(t.studentId),
    index("applications_company_idx").on(t.companyId),
  ],
);

export type InternshipApplication = typeof internshipApplications.$inferSelect;
export type NewInternshipApplication = typeof internshipApplications.$inferInsert;
