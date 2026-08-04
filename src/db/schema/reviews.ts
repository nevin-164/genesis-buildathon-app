import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { internshipApplications } from "./applications";
import { reviewActionEnum } from "./enums";
import { experiences } from "./experiences";
import { users } from "./users";

/**
 * Every faculty decision and every clarification message, for both stages, in one
 * ordered thread per application or experience. A student's reply is action
 * 'respond', which is why this is not a decisions-only table.
 */
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id").references(() => internshipApplications.id, {
      onDelete: "cascade",
    }),
    experienceId: uuid("experience_id").references(() => experiences.id, {
      onDelete: "cascade",
    }),

    actorId: uuid("actor_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    action: reviewActionEnum("action").notNull(),
    /** Shown to the student. Compulsory on every action except approve/verify. */
    reason: text("reason"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("reviews_application_idx").on(t.applicationId, t.createdAt),
    index("reviews_experience_idx").on(t.experienceId, t.createdAt),
    check(
      "reviews_one_owner_ck",
      sql`(${t.applicationId} is not null) <> (${t.experienceId} is not null)`,
    ),
    /** The spec's "a reason is compulsory" rule, enforced where it cannot be bypassed. */
    check(
      "reviews_reason_required_ck",
      sql`${t.action} in ('approve', 'verify') or ${t.reason} is not null`,
    ),
  ],
);

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
