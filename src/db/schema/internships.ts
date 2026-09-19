import { sql } from "drizzle-orm";
import {
  boolean,
  check,
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
     * cannot rewrite who owned an already-verified internship.
     *
     * Nullable only because a `draft` has not resolved one yet. From
     * `submitted` onwards it is guaranteed non-null by
     * `internships_assigned_when_submitted_ck` below, which is the database
     * half of "every class has an advisor, every student has a class".
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

    /**
     * The author's verdict ON THE COMPANY, not on this write-up.
     *
     *   true  → upvote: they would tell a junior to go
     *   false → downvote: they would tell a junior to stay away
     *   null  → they did not say (every row written before this column existed)
     *
     * Cast once, by the one person who was actually there, as part of writing
     * the card. It is NOT a reader poll — nobody who did not do the internship
     * can move this number, so what Explore reports is first-hand and nothing
     * else.
     *
     * Legitimacy comes free from the lifecycle rather than from a moderation
     * queue of its own: the aggregate counts `verified` rows only, so a verdict
     * does not count until an advisor has stood behind the internship carrying
     * it. One student, one verified internship, one vote per company visit.
     */
    recommendsCompany: boolean("recommends_company"),

    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    /**
     * Whoever published it. Usually the assigned advisor — but an administrator
     * who overturns a rejected appeal is the verifier of record for that card,
     * and the Reality Card names them, because that is who stood behind it.
     */
    verifiedBy: uuid("verified_by").references(() => users.id, { onDelete: "restrict" }),

    /**
     * When the student contested the rejection. Drives the admin appeal queue,
     * which is ordered oldest-first like the faculty one.
     */
    appealedAt: timestamp("appealed_at", { withTimezone: true }),
    /**
     * How many times this internship has been appealed. Capped at one by
     * `internships_appeal_count_ck` below, so an upheld rejection is genuinely
     * final and a student cannot loop the administrator forever.
     *
     * Raising the cap is a migration, and it should be — "how many appeals do
     * you get" is a policy decision, not a constant somebody edits in passing.
     */
    appealCount: integer("appeal_count").notNull().default(0),
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
    /**
     * The company verdict roll-up: `group by company_id` over the published
     * rows, counting true against false. Both columns are in the index and the
     * predicate throws away every unpublished row, so the count never touches
     * the heap.
     *
     * A partial index IS allowed here, unlike `internships_appeal_idx` — the
     * difference is not the predicate but its timing. `'verified'` is an enum
     * label that has existed since `0000_init`, so no migration needs to use it
     * in the same transaction that created it.
     */
    index("internships_company_verdict_idx")
      .on(t.companyId, t.recommendsCompany)
      .where(sql`status = 'verified'`),
    // the faculty verification queue — the hottest read in the app
    index("internships_faculty_idx").on(t.assignedFacultyId, t.status),
    /**
     * The admin appeal queue: `where status = 'appealed' order by appealed_at`.
     *
     * Composite rather than a partial index on `appealed_at` alone, and NOT by
     * preference — a partial index is the natural shape here, and Postgres
     * refuses it. An index predicate must be IMMUTABLE; `status = 'appealed'`
     * cannot be written in the migration that adds the label, and the
     * `status::text` form that works in a CHECK is rejected here because
     * `enum_out` is only STABLE (enum labels can be renamed).
     *
     * The composite covers the same query at least as well — status leads, so
     * the appealed rows are contiguous and already ordered by date within it.
     */
    index("internships_appeal_idx").on(t.status, t.appealedAt),
    index("internships_student_idx").on(t.studentId),

    /**
     * A draft has no advisor yet; anything past it must. This is the backstop
     * for the two NOT NULLs on the org tree — if a controller ever writes a
     * submission with no reviewer again, the insert fails here rather than
     * quietly creating a row nobody will ever look at.
     */
    check(
      "internships_assigned_when_submitted_ck",
      sql`${t.status} = 'draft' or ${t.assignedFacultyId} is not null`,
    ),

    /**
     * An appeal is always dated. Without this an `appealed` row with a null
     * `appealed_at` sorts to the top of the admin queue forever and reads as
     * having waited since the beginning of time.
     *
     * Written `status::text` rather than `${t.status} <> 'appealed'` on
     * purpose: Postgres refuses to use a brand-new enum label in the same
     * transaction that added it, and drizzle runs every pending migration in
     * ONE transaction — so the `ALTER TYPE` that adds `appealed` and this
     * constraint are unavoidably together. Casting to text sidesteps the enum
     * literal.
     *
     * A CHECK accepts the cast; an index predicate does not. See the comment
     * on `internships_appeal_idx` above for why that asymmetry exists.
     */
    check(
      "internships_appeal_dated_ck",
      sql`${t.status}::text <> 'appealed' or ${t.appealedAt} is not null`,
    ),

    /** One appeal, then the decision stands. See `appealCount` above. */
    check(
      "internships_appeal_count_ck",
      sql`${t.appealCount} >= 0 and ${t.appealCount} <= 1`,
    ),
  ],
);

export type Internship = typeof internships.$inferSelect;
export type NewInternship = typeof internships.$inferInsert;
