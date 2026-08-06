import "server-only";

import { asc, eq, sql } from "drizzle-orm";

import { batches, classes, db, departments, studentProfiles, users } from "@/db";
import type { BatchRow, ClassDetail, ClassRow, DepartmentRow } from "@/types/contracts";

/**
 * The organisation tree: department → batch → class.
 *
 * The bottom level carries the faculty advisor, which is what makes "my
 * assigned students" work at all. Everything a faculty member can see follows
 * from `classes.advisor_id`.
 *
 * The child counts are correlated subqueries rather than a join with GROUP BY,
 * so a department with no batches still comes back with `batchCount: 0` instead
 * of disappearing from the list.
 */

const batchCount = sql<number>`(
  select count(*)::int from ${batches} where ${batches.departmentId} = ${departments.id}
)`;

const classCount = sql<number>`(
  select count(*)::int from ${classes} where ${classes.batchId} = ${batches.id}
)`;

const studentCount = sql<number>`(
  select count(*)::int from ${studentProfiles} where ${studentProfiles.classId} = ${classes.id}
)`;

export const Org = {
  /* ── departments ─────────────────────────────────────────────────────── */

  async listDepartments(): Promise<DepartmentRow[]> {
    return db
      .select({
        id: departments.id,
        code: departments.code,
        name: departments.name,
        batchCount,
      })
      .from(departments)
      .orderBy(asc(departments.code));
  },

  async findDepartment(id: string): Promise<{ id: string } | null> {
    const [row] = await db
      .select({ id: departments.id })
      .from(departments)
      .where(eq(departments.id, id))
      .limit(1);
    return row ?? null;
  },

  async createDepartment(input: { code: string; name: string }): Promise<{ id: string }> {
    const [row] = await db.insert(departments).values(input).returning({ id: departments.id });
    return row;
  },

  async updateDepartment(id: string, input: { code: string; name: string }): Promise<boolean> {
    const [row] = await db
      .update(departments)
      .set(input)
      .where(eq(departments.id, id))
      .returning({ id: departments.id });
    return row !== undefined;
  },

  /* ── batches ─────────────────────────────────────────────────────────── */

  async listBatches(departmentId?: string): Promise<BatchRow[]> {
    return db
      .select({
        id: batches.id,
        name: batches.name,
        departmentId: batches.departmentId,
        departmentName: departments.name,
        startYear: batches.startYear,
        endYear: batches.endYear,
        classCount,
      })
      .from(batches)
      .innerJoin(departments, eq(departments.id, batches.departmentId))
      .where(departmentId ? eq(batches.departmentId, departmentId) : undefined)
      .orderBy(asc(departments.code), asc(batches.name));
  },

  async findBatch(id: string): Promise<{ id: string } | null> {
    const [row] = await db.select({ id: batches.id }).from(batches).where(eq(batches.id, id)).limit(1);
    return row ?? null;
  },

  async createBatch(input: {
    departmentId: string;
    name: string;
    startYear: number;
    endYear: number;
  }): Promise<{ id: string }> {
    const [row] = await db.insert(batches).values(input).returning({ id: batches.id });
    return row;
  },

  /**
   * A batch cannot move between departments. Its uniqueness is scoped to its
   * department, and its classes and their students came with it.
   */
  async updateBatch(
    id: string,
    input: { name: string; startYear: number; endYear: number },
  ): Promise<boolean> {
    const [row] = await db
      .update(batches)
      .set(input)
      .where(eq(batches.id, id))
      .returning({ id: batches.id });
    return row !== undefined;
  },

  /* ── classes — the level that carries the advisor ─────────────────────── */

  async listClasses(batchId?: string): Promise<ClassRow[]> {
    const rows = await db
      .select({
        id: classes.id,
        name: classes.name,
        batchId: classes.batchId,
        batchName: batches.name,
        departmentName: departments.name,
        advisorId: users.id,
        advisorName: users.fullName,
        advisorEmail: users.email,
        studentCount,
      })
      .from(classes)
      .innerJoin(batches, eq(batches.id, classes.batchId))
      .innerJoin(departments, eq(departments.id, batches.departmentId))
      .leftJoin(users, eq(users.id, classes.advisorId))
      .where(batchId ? eq(classes.batchId, batchId) : undefined)
      .orderBy(asc(departments.code), asc(batches.name), asc(classes.name));

    return rows.map(toClassRow);
  },

  async getClass(id: string): Promise<ClassDetail | null> {
    const [row] = await db
      .select({
        id: classes.id,
        name: classes.name,
        batchId: classes.batchId,
        batchName: batches.name,
        departmentName: departments.name,
        advisorId: users.id,
        advisorName: users.fullName,
        advisorEmail: users.email,
        studentCount,
      })
      .from(classes)
      .innerJoin(batches, eq(batches.id, classes.batchId))
      .innerJoin(departments, eq(departments.id, batches.departmentId))
      .leftJoin(users, eq(users.id, classes.advisorId))
      .where(eq(classes.id, id))
      .limit(1);

    if (!row) return null;

    const students = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        registerNumber: studentProfiles.registerNumber,
      })
      .from(studentProfiles)
      .innerJoin(users, eq(users.id, studentProfiles.userId))
      .where(eq(studentProfiles.classId, id))
      .orderBy(asc(studentProfiles.registerNumber));

    return { ...toClassRow(row), students };
  },

  async findClass(id: string): Promise<{ id: string } | null> {
    const [row] = await db.select({ id: classes.id }).from(classes).where(eq(classes.id, id)).limit(1);
    return row ?? null;
  },

  async createClass(input: {
    batchId: string;
    name: string;
    advisorId: string | null;
  }): Promise<{ id: string }> {
    const [row] = await db.insert(classes).values(input).returning({ id: classes.id });
    return row;
  },

  async updateClass(
    id: string,
    input: { name: string; advisorId: string | null },
  ): Promise<boolean> {
    const [row] = await db
      .update(classes)
      .set(input)
      .where(eq(classes.id, id))
      .returning({ id: classes.id });
    return row !== undefined;
  },

  /**
   * Set or clear the advisor, and nothing else.
   *
   * This must not touch a single internship row. The advisor is resolved once
   * at submit time and frozen; re-pointing an in-flight internship would take a
   * decision away from the faculty member reviewing it and leave the audit
   * trail naming someone who was never the assignee. New submissions pick up
   * the new advisor — existing ones keep theirs.
   */
  async setAdvisor(classId: string, advisorId: string | null): Promise<boolean> {
    const [row] = await db
      .update(classes)
      .set({ advisorId })
      .where(eq(classes.id, classId))
      .returning({ id: classes.id });
    return row !== undefined;
  },
};

type ClassSelectRow = {
  id: string;
  name: string;
  batchId: string;
  batchName: string;
  departmentName: string;
  advisorId: string | null;
  advisorName: string | null;
  advisorEmail: string | null;
  studentCount: number;
};

function toClassRow(row: ClassSelectRow): ClassRow {
  return {
    id: row.id,
    name: row.name,
    batchId: row.batchId,
    batchName: row.batchName,
    departmentName: row.departmentName,
    advisor:
      row.advisorId && row.advisorName && row.advisorEmail
        ? { id: row.advisorId, fullName: row.advisorName, email: row.advisorEmail }
        : null,
    studentCount: row.studentCount,
  };
}
