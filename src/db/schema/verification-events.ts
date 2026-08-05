import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { verificationActionEnum } from "./enums";
import { internships } from "./internships";
import { users } from "./users";

/**
 * One ordered thread per internship: every advisor decision and every message.
 *
 * Not a decisions-only log — the student's reply is action 'respond', which is
 * what makes this a conversation rather than a verdict. Named for the process,
 * not "reviews", because this product has no reviews in the star-rating sense
 * and never will.
 */
export const verificationEvents = pgTable(
  "verification_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    internshipId: uuid("internship_id")
      .notNull()
      .references(() => internships.id, { onDelete: "cascade" }),

    actorId: uuid("actor_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    action: verificationActionEnum("action").notNull(),
    /** Shown to the student. Compulsory on everything except `verify`. */
    reason: text("reason"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("verification_events_internship_idx").on(t.internshipId, t.createdAt),
    /**
     * The spec's "a reason is compulsory" rule, enforced where a controller bug
     * cannot bypass it. The length floor matters: `is not null` alone lets a
     * three-character brush-off through, which is the same as no reason at all.
     */
    check(
      "verification_events_reason_ck",
      sql`${t.action} = 'verify' or length(btrim(${t.reason})) >= 10`,
    ),
  ],
);

export type VerificationEvent = typeof verificationEvents.$inferSelect;
export type NewVerificationEvent = typeof verificationEvents.$inferInsert;
