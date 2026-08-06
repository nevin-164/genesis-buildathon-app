import "server-only";

import bcrypt from "bcryptjs";

import { requireRole } from "@/lib/auth/dal";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/auth/errors";
import { rethrowAsFieldError } from "@/lib/validators/db-errors";
import { parseOrThrow, parseValueOrThrow } from "@/lib/validators/parse";
import {
  createUserSchema,
  updateUserSchema,
  userFiltersSchema,
} from "@/lib/validators/admin.schema";
import { AdminUsers } from "@/models/admin-user.model";
import { AdminStats } from "@/models/admin-stats.model";
import { Org } from "@/models/org.model";
import type {
  AdminCounts,
  AdminUserFilters,
  AdminUserRow,
  FacultyOption,
} from "@/types/contracts";
import { z } from "zod";

/**
 * Account management.
 *
 * There is no delete function here and there must not be one. The business
 * foreign keys are ON DELETE RESTRICT, so a user with any history physically
 * cannot be removed — the database refuses. Deactivation is the only path.
 */

const BCRYPT_ROUNDS = 10;

export async function getAdminCounts(): Promise<AdminCounts> {
  await requireRole("admin");
  return AdminStats.counts();
}

export async function listUsers(
  filters: AdminUserFilters,
): Promise<{ items: AdminUserRow[]; total: number; pageSize: number }> {
  await requireRole("admin");
  const parsed = parseOrThrow(userFiltersSchema, filters);
  return AdminUsers.list(parsed);
}

export async function getUser(id: string): Promise<AdminUserRow> {
  await requireRole("admin");
  const user = await AdminUsers.findById(id);
  if (!user) throw new NotFoundError();
  return user;
}

/**
 * Creating an admin is not offered. Promoting someone is a deliberate,
 * out-of-band act, not a dropdown option on a form anyone can reach.
 *
 * Uniqueness of email and register number is enforced by the database, not by
 * a read-then-write here: between the check and the insert a second admin can
 * take the same value, and only the unique index actually stops that.
 */
export async function createUser(input: unknown): Promise<{ id: string }> {
  await requireRole("admin");
  const parsed = parseOrThrow(createUserSchema, input);

  await assertClassExists(parsed.classId);

  const passwordHash = await bcrypt.hash(parsed.password, BCRYPT_ROUNDS);

  try {
    return await AdminUsers.create({
      role: parsed.role,
      fullName: parsed.fullName,
      email: parsed.email,
      passwordHash,
      registerNumber: parsed.registerNumber,
      classId: parsed.classId,
    });
  } catch (error) {
    rethrowAsFieldError(error);
  }
}

/**
 * Name, email, and for students their register number and class.
 *
 * Role is deliberately absent. A student with internships must not become a
 * faculty member — their history would stop making sense, and they would end up
 * assigned to verify their own write-up.
 */
export async function updateUser(id: string, input: unknown): Promise<void> {
  await requireRole("admin");
  const parsed = parseOrThrow(updateUserSchema, input);

  const existing = await AdminUsers.findRole(id);
  if (!existing) throw new NotFoundError();

  const isStudent = existing.role === "student";
  if (isStudent && !parsed.registerNumber) {
    throw new ValidationError({ registerNumber: "A student needs a register number." });
  }

  await assertClassExists(parsed.classId);

  try {
    const updated = await AdminUsers.update(id, {
      fullName: parsed.fullName,
      email: parsed.email,
      isStudent,
      registerNumber: parsed.registerNumber,
      classId: parsed.classId,
    });
    if (!updated) throw new NotFoundError();
  } catch (error) {
    rethrowAsFieldError(error);
  }
}

/**
 * Deactivate or reactivate. The model bumps `session_version` and revokes the
 * refresh rows in the same transaction, which is what makes their current login
 * stop working immediately rather than in fifteen minutes.
 */
export async function setUserActive(id: string, isActive: boolean): Promise<void> {
  const actor = await requireRole("admin");

  // Locking yourself out of the only admin account is unrecoverable from the UI.
  if (id === actor.id && !isActive) {
    throw new ForbiddenError("You cannot deactivate your own account.");
  }

  const existing = await AdminUsers.findRole(id);
  if (!existing) throw new NotFoundError();

  const changed = await AdminUsers.setActive(id, isActive);
  if (!changed) throw new NotFoundError();
}

/** Also signs them out everywhere, by design. */
export async function resetUserPassword(id: string, newPassword: string): Promise<void> {
  await requireRole("admin");

  const password = parseValueOrThrow(
    z.string("Password must be at least 8 characters.").min(8, "Password must be at least 8 characters.").max(200),
    newPassword,
    "newPassword",
  );

  const existing = await AdminUsers.findRole(id);
  if (!existing) throw new NotFoundError();

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const changed = await AdminUsers.setPassword(id, passwordHash);
  if (!changed) throw new NotFoundError();
}

export async function listFacultyOptions(): Promise<FacultyOption[]> {
  await requireRole("faculty", "admin");
  return AdminUsers.listFacultyOptions();
}

/**
 * A bad class id would otherwise surface as a raw foreign-key violation. This
 * turns it into a field error on the control that produced it.
 */
async function assertClassExists(classId: string | null): Promise<void> {
  if (!classId) return;
  const found = await Org.findClass(classId);
  if (!found) throw new ValidationError({ classId: "That class no longer exists." });
}
