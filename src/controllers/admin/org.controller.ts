import "server-only";

import { requireRole } from "@/lib/auth/dal";
import { InvalidStateError, NotFoundError, ValidationError } from "@/lib/auth/errors";
import { rethrowAsFieldError } from "@/lib/validators/db-errors";
import {
  batchSchema,
  classSchema,
  classUpdateSchema,
  departmentSchema,
} from "@/lib/validators/org.schema";
import { parseOrThrow } from "@/lib/validators/parse";
import { AdminUsers } from "@/models/admin-user.model";
import { Org } from "@/models/org.model";
import { StudentProfiles } from "@/models/student-profile.model";
import type {
  BatchRow,
  ClassDetail,
  ClassRow,
  DepartmentRow,
  FacultyOption,
} from "@/types/contracts";

import { moveStudentToClass, setClassAdvisor } from "./assignment.controller";

/**
 * The organisation tree: department → batch → class.
 *
 * This has to land before anything else works. Students pick their class when
 * they register, so until a tree exists nobody can sign up; and the advisor
 * lives on the class, so until one is set no faculty member sees a single
 * student.
 *
 * Uniqueness is a database index in every case. `rethrowAsFieldError` turns the
 * violation into a message under the right control instead of a 500.
 */

/* ── departments ───────────────────────────────────────────────────────── */

export async function listDepartments(): Promise<DepartmentRow[]> {
  await requireRole("admin");
  return Org.listDepartments();
}

export async function createDepartment(input: unknown): Promise<{ id: string }> {
  await requireRole("admin");
  const parsed = parseOrThrow(departmentSchema, input);
  try {
    return await Org.createDepartment(parsed);
  } catch (error) {
    rethrowAsFieldError(error);
  }
}

export async function updateDepartment(id: string, input: unknown): Promise<void> {
  await requireRole("admin");
  const parsed = parseOrThrow(departmentSchema, input);
  try {
    const updated = await Org.updateDepartment(id, parsed);
    if (!updated) throw new NotFoundError();
  } catch (error) {
    rethrowAsFieldError(error);
  }
}

/* ── batches ───────────────────────────────────────────────────────────── */

export async function listBatches(departmentId?: string): Promise<BatchRow[]> {
  await requireRole("admin");
  return Org.listBatches(departmentId);
}

export async function createBatch(input: unknown): Promise<{ id: string }> {
  await requireRole("admin");
  const parsed = parseOrThrow(batchSchema, input);

  const department = await Org.findDepartment(parsed.departmentId);
  if (!department) throw new ValidationError({ departmentId: "That department no longer exists." });

  try {
    return await Org.createBatch(parsed);
  } catch (error) {
    rethrowAsFieldError(error);
  }
}

/**
 * A batch cannot be moved to another department. Its name is only unique within
 * one, and its classes and their students came with it.
 */
export async function updateBatch(id: string, input: unknown): Promise<void> {
  await requireRole("admin");
  const parsed = parseOrThrow(batchSchema, input);
  try {
    const updated = await Org.updateBatch(id, {
      name: parsed.name,
      startYear: parsed.startYear,
      endYear: parsed.endYear,
    });
    if (!updated) throw new NotFoundError();
  } catch (error) {
    rethrowAsFieldError(error);
  }
}

/* ── classes — the level that carries the advisor ───────────────────────── */

export async function listClasses(batchId?: string): Promise<ClassRow[]> {
  await requireRole("admin");
  return Org.listClasses(batchId);
}

export async function getClass(id: string): Promise<ClassDetail> {
  await requireRole("admin");
  const found = await Org.getClass(id);
  if (!found) throw new NotFoundError();
  return found;
}

export async function createClass(input: unknown): Promise<{ id: string }> {
  await requireRole("admin");
  const parsed = parseOrThrow(classSchema, input);

  const batch = await Org.findBatch(parsed.batchId);
  if (!batch) throw new ValidationError({ batchId: "That batch no longer exists." });

  await assertIsFaculty(parsed.advisorId);

  try {
    return await Org.createClass(parsed);
  } catch (error) {
    rethrowAsFieldError(error);
  }
}

export async function updateClass(id: string, input: unknown): Promise<void> {
  await requireRole("admin");
  const parsed = parseOrThrow(classUpdateSchema, input);

  await assertIsFaculty(parsed.advisorId);

  try {
    const updated = await Org.updateClass(id, parsed);
    if (!updated) throw new NotFoundError();
  } catch (error) {
    rethrowAsFieldError(error);
  }
}

/**
 * The advisor column takes any user id as far as the foreign key is concerned,
 * so the role check has to happen here. Without it a student can be made the
 * advisor of their own class.
 */
async function assertIsFaculty(advisorId: string | null): Promise<void> {
  if (!advisorId) return;
  const user = await AdminUsers.findRole(advisorId);
  if (!user || user.role !== "faculty") {
    throw new ValidationError({ advisorId: "Choose an active faculty member." });
  }
  if (!user.isActive) {
    throw new ValidationError({ advisorId: "That faculty account is deactivated." });
  }
}

/* ── the class screens' own reads and writes ────────────────────────────── */

/**
 * The advisor dropdown on the class screens. Same list as
 * `user.controller.listFacultyOptions`, re-exported here so a class screen
 * imports only from the org controller.
 */
export async function listFacultyOptions(): Promise<FacultyOption[]> {
  await requireRole("admin");
  return AdminUsers.listFacultyOptions();
}

/**
 * Set or clear a class's advisor from the class detail screen. Null removes it.
 *
 * Delegates to the assignment controller rather than writing the column here:
 * that is where the "must be an active faculty member" rule lives, and this
 * must not become a second copy of it that drifts.
 */
export async function updateClassAdvisor(
  classId: string,
  advisorId: string | null,
): Promise<void> {
  await setClassAdvisor(classId, advisorId);
}

/**
 * Detach a student from a class. Nothing is deleted — the account and its
 * history stay, the student just stops resolving an advisor through this class.
 *
 * The class id is checked against where the student actually is. Without that,
 * a stale page would silently pull someone out of a class they had already
 * been moved to.
 */
export async function removeStudentFromClass(
  classId: string,
  studentId: string,
): Promise<void> {
  await requireRole("admin");

  const routing = await StudentProfiles.routingFor(studentId);
  if (!routing) throw new NotFoundError();
  if (routing.classId !== classId) {
    throw new InvalidStateError("That student is no longer in this class. Reload and try again.");
  }

  await moveStudentToClass(studentId, null);
}
