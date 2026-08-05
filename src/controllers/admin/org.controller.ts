import "server-only";

import { requireRole } from "@/lib/auth/dal";
import * as Mock from "@/lib/mock/data";
import type { BatchRow, ClassDetail, ClassRow, DepartmentRow } from "@/types/contracts";

/** STUB — package 3 owns this file. Signatures are the contract with package 6. */

/* ── departments ── */

export async function listDepartments(): Promise<DepartmentRow[]> {
  await requireRole("admin");
  return Mock.MOCK_DEPARTMENTS;
}

export async function createDepartment(_input: unknown): Promise<{ id: string }> {
  await requireRole("admin");
  return { id: "d-new" };
}

export async function updateDepartment(_id: string, _input: unknown): Promise<void> {
  await requireRole("admin");
}

/* ── batches ── */

export async function listBatches(departmentId?: string): Promise<BatchRow[]> {
  await requireRole("admin");
  if (!departmentId) return Mock.MOCK_BATCHES;
  return Mock.MOCK_BATCHES.filter((b) => b.departmentId === departmentId);
}

export async function createBatch(_input: unknown): Promise<{ id: string }> {
  await requireRole("admin");
  return { id: "b-new" };
}

export async function updateBatch(_id: string, _input: unknown): Promise<void> {
  await requireRole("admin");
}

/* ── classes — the level that carries the faculty advisor ── */

export async function listClasses(batchId?: string): Promise<ClassRow[]> {
  await requireRole("admin");
  if (!batchId) return Mock.MOCK_CLASSES;
  return Mock.MOCK_CLASSES.filter((c) => c.batchId === batchId);
}

export async function getClass(id: string): Promise<ClassDetail> {
  await requireRole("admin");
  const row = Mock.MOCK_CLASSES.find((c) => c.id === id) ?? Mock.MOCK_CLASSES[0];
  return {
    ...row,
    students: Mock.MOCK_ASSIGNED_STUDENTS.map((s) => ({
      id: s.id,
      fullName: s.fullName,
      registerNumber: s.registerNumber,
    })),
  };
}

export async function createClass(_input: unknown): Promise<{ id: string }> {
  await requireRole("admin");
  return { id: "c-new" };
}

export async function updateClass(_id: string, _input: unknown): Promise<void> {
  await requireRole("admin");
}
