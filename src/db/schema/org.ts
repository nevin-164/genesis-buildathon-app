import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { users } from "./users";

/** Level 1 — e.g. CSE, ME. */
export const departments = pgTable(
  "departments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(), // 'CSE'
    name: text("name").notNull(), // 'Computer Science and Engineering'
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("departments_code_key").on(t.code)],
);

/** Level 2 — e.g. 2022-2026. */
export const batches = pgTable(
  "batches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // '2022-2026'
    startYear: integer("start_year").notNull(),
    endYear: integer("end_year").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("batches_department_name_key").on(t.departmentId, t.name),
    index("batches_department_idx").on(t.departmentId),
  ],
);

/**
 * Level 3 — e.g. S6-CSE-A. This is the bottom of the tree and the level that
 * carries the faculty advisor, so it is what makes "my assigned students" work.
 * One advisor per class; a faculty member may advise several classes.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * INVARIANT ONE: `advisor_id` is NOT NULL. A class without an advisor is a
 * class whose students submit internships nobody can verify, and the entire
 * admin repair queue that used to exist was there to clean up after it. Faculty
 * register themselves before the tree is built, so there is always somebody to
 * pick — the admin is never blocked by this.
 *
 * `restrict` rather than `set null`: the column cannot hold null any more, and
 * nothing in this system is hard-deleted anyway (deactivation is the only
 * removal path). Deactivating an advisor who still holds classes is refused in
 * `user.controller.deactivate` — that guard is what keeps this column honest.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const classes = pgTable(
  "classes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // 'S6-CSE-A'
    advisorId: uuid("advisor_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("classes_batch_name_key").on(t.batchId, t.name),
    index("classes_batch_idx").on(t.batchId),
    index("classes_advisor_idx").on(t.advisorId),
  ],
);

/**
 * 1:1 with users where role = 'student'. Students pick their class when they
 * register, and it is the only thing that decides who reviews their work.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * INVARIANT TWO: `class_id` is NOT NULL. Together with the advisor above, this
 * makes advisor resolution total — student → class → advisor always yields
 * somebody, so a submitted internship can never arrive unassigned.
 *
 * There used to be an `advisor_override_id` here, a per-student escape hatch
 * that beat the class advisor. It existed only to patch the holes these two
 * constraints now close, and it was the reason the faculty roster (which walked
 * the tree live) and the verification queue (which reads the frozen column on
 * the internship) could disagree about who advises whom. One path now.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const studentProfiles = pgTable(
  "student_profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    registerNumber: text("register_number").notNull(),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("student_profiles_register_number_key").on(t.registerNumber),
    index("student_profiles_class_idx").on(t.classId),
  ],
);

export type Department = typeof departments.$inferSelect;
export type Batch = typeof batches.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type StudentProfile = typeof studentProfiles.$inferSelect;
