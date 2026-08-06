import "server-only";

import { and, asc, count, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { authSessions, classes, db, studentProfiles, users } from "@/db";
import type { AdminUserRow, FacultyOption, Role } from "@/types/contracts";

/**
 * Admin-facing reads and writes on `users` and `student_profiles`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NAMING. `ARCHITECTURE.md` reserves `user.model.ts` for package 1, who create
 * it for login and whose file I extend. They have not written it yet, and if we
 * both create it git raises an add/add conflict — the one merge failure this
 * whole package is arranged to avoid. These functions live here until package 1
 * lands, at which point moving them is a rename.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Fixed, and shared with the UI through the `listUsers` return value. */
export const USERS_PAGE_SIZE = 20;

/** The two ways a student can have an advisor, joined separately to be COALESCEd. */
const overrideAdvisor = alias(users, "override_advisor");
const classAdvisor = alias(users, "class_advisor");

const userColumns = {
  id: users.id,
  fullName: users.fullName,
  email: users.email,
  role: users.role,
  isActive: users.isActive,
  createdAt: users.createdAt,
  registerNumber: studentProfiles.registerNumber,
  className: classes.name,
  overrideAdvisorName: overrideAdvisor.fullName,
  classAdvisorName: classAdvisor.fullName,
};

/**
 * `users` left-joined to everything a student row needs. Faculty and admin rows
 * simply come back with nulls in the student columns, which is exactly what
 * `AdminUserRow` says they should have.
 */
function baseQuery() {
  return db
    .select(userColumns)
    .from(users)
    .leftJoin(studentProfiles, eq(studentProfiles.userId, users.id))
    .leftJoin(classes, eq(classes.id, studentProfiles.classId))
    .leftJoin(overrideAdvisor, eq(overrideAdvisor.id, studentProfiles.advisorOverrideId))
    .leftJoin(classAdvisor, eq(classAdvisor.id, classes.advisorId));
}

export type UserFilters = {
  q?: string;
  role?: Role;
  isActive?: boolean;
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
      db
        .select({ value: count() })
        .from(users)
        .leftJoin(studentProfiles, eq(studentProfiles.userId, users.id))
        .where(where),
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
   * A student is two rows — the account and the profile carrying their register
   * number. One transaction, so a duplicate register number cannot leave a
   * student account behind with no profile.
   */
  async create(input: {
    role: "student" | "faculty";
    fullName: string;
    email: string;
    passwordHash: string;
    registerNumber?: string;
    classId: string | null;
  }): Promise<{ id: string }> {
    return db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          email: input.email,
          passwordHash: input.passwordHash,
          fullName: input.fullName,
          role: input.role,
        })
        .returning({ id: users.id });

      if (input.role === "student") {
        await tx.insert(studentProfiles).values({
          userId: user.id,
          registerNumber: input.registerNumber!,
          classId: input.classId,
        });
      }

      return { id: user.id };
    });
  },

  /** Role is not a parameter — it cannot change once history exists. */
  async update(
    id: string,
    input: {
      fullName: string;
      email: string;
      isStudent: boolean;
      registerNumber?: string;
      classId: string | null;
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
            classId: input.classId,
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
  overrideAdvisorName: string | null;
  classAdvisorName: string | null;
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
    // Same precedence as resolveAdvisor: a direct override beats the class.
    advisorName: row.overrideAdvisorName ?? row.classAdvisorName,
    createdAt: row.createdAt.toISOString(),
  };
}
