import "server-only";

import { and, asc, count, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { authSessions, batches, classes, db, departments, studentProfiles, users } from "@/db";
import type { AdminUserRow, FacultyOption, Role } from "@/types/contracts";

/**
 * Admin-facing reads and writes on `users` and `student_profiles`.
 *
 * There is no `create` here, and there must not be one. Accounts are
 * self-registered — students and faculty both sign themselves up at /register —
 * so an admin-created account would mean inventing a password and sending it
 * out of band, which is the problem self-registration solves. The admin's job
 * on this table is to look, filter, correct and deactivate.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NAMING. `ARCHITECTURE.md` reserves `user.model.ts` for package 1, who create
 * it for login and whose file I extend. Two packages creating one filename is
 * an add/add conflict; two files over one table is not a problem.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Fixed, and shared with the UI through the `listUsers` return value. */
export const USERS_PAGE_SIZE = 20;

/**
 * How many classes this faculty member advises.
 *
 * A correlated subquery rather than a join with GROUP BY, so a faculty member
 * with no classes still comes back as 0 instead of vanishing from the list.
 * It doubles as the deactivation guard's counter — see `countClassesAdvisedBy`.
 */
const advisedClassCount = sql<number>`(
  select count(*)::int from ${classes} where ${classes.advisorId} = ${users.id}
)`;

/**
 * The student's advisor, reached through their class. Aliased because `users`
 * is already the driving table — without it Postgres cannot tell which `users`
 * the join means.
 */
const advisor = alias(users, "class_advisor");

const userColumns = {
  id: users.id,
  fullName: users.fullName,
  email: users.email,
  role: users.role,
  isActive: users.isActive,
  createdAt: users.createdAt,
  registerNumber: studentProfiles.registerNumber,
  className: classes.name,
  batchName: batches.name,
  departmentName: departments.name,
  advisorName: advisor.fullName,
  advisedClassCount,
};

/**
 * `users` left-joined to everything a student row needs. Faculty and admin rows
 * simply come back with nulls in the student columns, which is exactly what
 * `AdminUserRow` says they should have — the left joins are for *them*, not for
 * students, whose profile and class are both guaranteed.
 */
function baseQuery() {
  return db
    .select(userColumns)
    .from(users)
    .leftJoin(studentProfiles, eq(studentProfiles.userId, users.id))
    .leftJoin(classes, eq(classes.id, studentProfiles.classId))
    .leftJoin(batches, eq(batches.id, classes.batchId))
    .leftJoin(departments, eq(departments.id, batches.departmentId))
    .leftJoin(advisor, eq(advisor.id, classes.advisorId));
}

/** Same joins, no columns — so `list` can count with the identical WHERE. */
function countQuery() {
  return db
    .select({ value: count() })
    .from(users)
    .leftJoin(studentProfiles, eq(studentProfiles.userId, users.id))
    .leftJoin(classes, eq(classes.id, studentProfiles.classId))
    .leftJoin(batches, eq(batches.id, classes.batchId));
}

export type UserFilters = {
  q?: string;
  role?: Role;
  isActive?: boolean;
  /** Student-only. Narrows by where they sit in the org tree. */
  departmentId?: string;
  batchId?: string;
  classId?: string;
  page: number;
};

export const AdminUsers = {
  async list(
    filters: UserFilters,
  ): Promise<{ items: AdminUserRow[]; total: number; pageSize: number }> {
    const where = buildWhere(filters);
    const offset = (filters.page - 1) * USERS_PAGE_SIZE;

    const [rows, [totals]] = await Promise.all([
      baseQuery().where(where).orderBy(asc(users.fullName)).limit(USERS_PAGE_SIZE).offset(offset),
      countQuery().where(where),
    ]);

    return {
      items: rows.map(toAdminUserRow),
      total: totals?.value ?? 0,
      pageSize: USERS_PAGE_SIZE,
    };
  },

  async findById(id: string): Promise<AdminUserRow | null> {
    const [row] = await baseQuery().where(eq(users.id, id)).limit(1);
    return row ? toAdminUserRow(row) : null;
  },

  /** The light read a controller uses to check a role before acting. */
  async findRole(id: string): Promise<{ id: string; role: Role; isActive: boolean } | null> {
    const [row] = await db
      .select({ id: users.id, role: users.role, isActive: users.isActive })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return row ? { ...row, role: row.role as Role } : null;
  },

  /** Advisor dropdowns. Deactivated faculty are not offered — they cannot act. */
  async listFacultyOptions(): Promise<FacultyOption[]> {
    return db
      .select({ id: users.id, fullName: users.fullName, email: users.email })
      .from(users)
      .where(and(eq(users.role, "faculty"), eq(users.isActive, true)))
      .orderBy(asc(users.fullName));
  },

  /**
   * The deactivation guard's counter.
   *
   * `classes.advisor_id` is NOT NULL, so a faculty member cannot be quietly
   * detached from their classes — deactivating one who still holds any would
   * leave those classes pointing at somebody who can no longer sign in, and
   * every future submission from them would route to a dead account. The admin
   * has to hand the classes over first. This is the whole replacement for the
   * old "unassigned internships" repair queue: prevention, not repair.
   */
  async countClassesAdvisedBy(facultyId: string): Promise<number> {
    const [row] = await db
      .select({ value: count() })
      .from(classes)
      .where(eq(classes.advisorId, facultyId));
    return row?.value ?? 0;
  },

  /** Role is not a parameter — it cannot change once history exists. */
  async update(
    id: string,
    input: {
      fullName: string;
      email: string;
      isStudent: boolean;
      registerNumber?: string;
      classId?: string;
    },
  ): Promise<boolean> {
    return db.transaction(async (tx) => {
      const [row] = await tx
        .update(users)
        .set({ fullName: input.fullName, email: input.email, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning({ id: users.id });

      if (!row) return false;

      if (input.isStudent) {
        await tx
          .update(studentProfiles)
          .set({
            // Both are NOT NULL, so an absent value means "leave it alone",
            // never "clear it".
            ...(input.classId ? { classId: input.classId } : {}),
            ...(input.registerNumber ? { registerNumber: input.registerNumber } : {}),
          })
          .where(eq(studentProfiles.userId, id));
      }

      return true;
    });
  },

  /**
   * Deactivate or reactivate.
   *
   * Bumping `session_version` is the point of the whole operation: without it
   * an already-minted access token keeps working for its remaining 15 minutes,
   * so "deactivated" would mean "deactivated, eventually". Revoking the refresh
   * rows stops them minting a new one.
   */
  async setActive(id: string, isActive: boolean): Promise<boolean> {
    return db.transaction(async (tx) => {
      const [row] = await tx
        .update(users)
        .set({
          isActive,
          sessionVersion: sql`${users.sessionVersion} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning({ id: users.id });

      if (!row) return false;

      await revokeSessions(tx, id);
      return true;
    });
  },

  /** A password change signs them out everywhere, by design. */
  async setPassword(id: string, passwordHash: string): Promise<boolean> {
    return db.transaction(async (tx) => {
      const [row] = await tx
        .update(users)
        .set({
          passwordHash,
          sessionVersion: sql`${users.sessionVersion} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning({ id: users.id });

      if (!row) return false;

      await revokeSessions(tx, id);
      return true;
    });
  },

  /**
   * Dashboard totals, in ONE round trip rather than one per role.
   *
   * `count(*) filter (where …)` is the reason this is a single query. Firing a
   * separate COUNT per number is what made the admin dashboard open nine
   * concurrent connections and stall behind the pooler's client limit.
   *
   * Deactivated accounts are excluded — they are not part of the active college.
   */
  async roleCounts(): Promise<{ students: number; faculty: number }> {
    const [row] = await db
      .select({
        students: sql<number>`count(*) filter (where ${users.role} = 'student' and ${users.isActive})::int`,
        faculty: sql<number>`count(*) filter (where ${users.role} = 'faculty' and ${users.isActive})::int`,
      })
      .from(users);

    return { students: row?.students ?? 0, faculty: row?.faculty ?? 0 };
  },
};

type SessionExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function revokeSessions(tx: SessionExecutor, userId: string): Promise<void> {
  await tx
    .update(authSessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(authSessions.userId, userId), isNull(authSessions.revokedAt)));
}

function buildWhere(filters: UserFilters) {
  const clauses = [];

  if (filters.role) clauses.push(eq(users.role, filters.role));
  if (filters.isActive !== undefined) clauses.push(eq(users.isActive, filters.isActive));

  // Org filters are student-only by construction: the columns come through
  // `student_profiles`, so a faculty or admin row has null there and drops out.
  // Most specific wins — sending all three is harmless but only the class
  // narrows anything the batch has not already.
  if (filters.classId) clauses.push(eq(studentProfiles.classId, filters.classId));
  else if (filters.batchId) clauses.push(eq(classes.batchId, filters.batchId));
  else if (filters.departmentId) clauses.push(eq(batches.departmentId, filters.departmentId));

  if (filters.q) {
    // ilike is case-insensitive; escaping % and _ keeps a search for "100%" literal.
    const term = `%${filters.q.replace(/[%_\\]/g, "\\$&")}%`;
    clauses.push(
      or(
        ilike(users.fullName, term),
        ilike(users.email, term),
        ilike(studentProfiles.registerNumber, term),
      ),
    );
  }

  return clauses.length > 0 ? and(...clauses) : undefined;
}

type UserSelectRow = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  registerNumber: string | null;
  className: string | null;
  batchName: string | null;
  departmentName: string | null;
  advisorName: string | null;
  advisedClassCount: number;
};

function toAdminUserRow(row: UserSelectRow): AdminUserRow {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    role: row.role as Role,
    isActive: row.isActive,
    registerNumber: row.registerNumber,
    className: row.className,
    batchName: row.batchName,
    departmentName: row.departmentName,
    advisorName: row.advisorName,
    // Only meaningful for faculty. A student's subquery is 0 and the UI
    // shows their advisor instead.
    advisedClassCount: row.advisedClassCount,
    createdAt: row.createdAt.toISOString(),
  };
}
