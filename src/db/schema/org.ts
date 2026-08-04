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

/** Level 3 — e.g. S6-CSE-A. */
export const classes = pgTable(
  "classes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // 'S6-CSE-A'
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("classes_batch_name_key").on(t.batchId, t.name),
    index("classes_batch_idx").on(t.batchId),
  ],
);

/** Level 4 — the group advisor link. This is what makes "my assigned students" work. */
export const groups = pgTable(
  "groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // 'G1'
    /** Nullable — a group can exist before an admin assigns an advisor. */
    advisorId: uuid("advisor_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("groups_class_name_key").on(t.classId, t.name),
    index("groups_class_idx").on(t.classId),
    index("groups_advisor_idx").on(t.advisorId),
  ],
);

/** 1:1 with users where role = 'student'. Students pick their group at registration. */
export const studentProfiles = pgTable(
  "student_profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    registerNumber: text("register_number").notNull(),
    /** Nullable so a student without a group is representable, not impossible. */
    groupId: uuid("group_id").references(() => groups.id, { onDelete: "set null" }),
    /** Direct admin assignment. Takes precedence over the group advisor. */
    advisorOverrideId: uuid("advisor_override_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("student_profiles_register_number_key").on(t.registerNumber),
    index("student_profiles_group_idx").on(t.groupId),
    index("student_profiles_advisor_override_idx").on(t.advisorOverrideId),
  ],
);

export type Department = typeof departments.$inferSelect;
export type Batch = typeof batches.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type StudentProfile = typeof studentProfiles.$inferSelect;
