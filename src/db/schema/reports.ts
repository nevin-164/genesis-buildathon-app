import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { internships } from "./internships";
import { users } from "./users";

/**
 * A generated internship report. Markdown, written by the model from the
 * internship row the student already submitted and their advisor already
 * verified.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * APPEND-ONLY. Regenerating inserts a new row; the newest row is the current
 * report. Nothing is updated and nothing is deleted, which is the same rule the
 * rest of the schema follows, and it means a student who regenerates and
 * preferred the old one has not lost it.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The report is persisted rather than regenerated per page view because this is
 * the only row in the database that costs money to produce.
 */
export const internshipReports = pgTable(
  "internship_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    internshipId: uuid("internship_id")
      .notNull()
      .references(() => internships.id, { onDelete: "cascade" }),
    /** Markdown. Rendered on the report page; never inserted as raw HTML. */
    content: text("content").notNull(),
    /**
     * Which model wrote it, and which revision of the prompt asked. Both are
     * stored because a report generated last week and one generated today are
     * not the same artefact, and a student comparing them deserves to know why.
     */
    model: text("model").notNull(),
    promptVersion: integer("prompt_version").notNull().default(1),
    /**
     * Who pressed the button. Always the owning student today — the controller
     * allows nobody else — but recording it keeps the row honest if that ever
     * widens to an advisor.
     */
    generatedBy: uuid("generated_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // "Newest report for this internship" is the only read this table serves.
    index("internship_reports_internship_idx").on(t.internshipId, t.createdAt),
  ],
);

export type InternshipReport = typeof internshipReports.$inferSelect;
export type NewInternshipReport = typeof internshipReports.$inferInsert;
