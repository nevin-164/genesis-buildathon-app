import "server-only";

import { requireRole } from "@/lib/auth/dal";
import { ForbiddenError, InvalidStateError, NotFoundError, ValidationError } from "@/lib/auth/errors";
import { hashPassword } from "@/lib/auth/password";
import { password as passwordSchema, updateUserSchema, userFiltersSchema } from "@/lib/validators/admin.schema";
import { parseIdOrNotFound, parseOrThrow, parseValueOrThrow } from "@/lib/validators/parse";
import { rethrowAsFieldError } from "@/lib/validators/db-errors";
import { AdminStats } from "@/models/admin-stats.model";
import { AdminUsers } from "@/models/admin-user.model";
import { Org } from "@/models/org.model";
import type {
  AdminCounts,
  AdminUserFilters,
  AdminUserRow,
  FacultyOption,
} from "@/types/contracts";

/**
 * Account management.
 *
 * There is no create function and there must not be one. Students and faculty
 * both register themselves at /register; an admin creating an account would
 * mean inventing a password and delivering it out of band, which is exactly the
 * problem self-registration solves. The only admin account is the seeded one.
 *
 * There is no delete function either. The business foreign keys are ON DELETE
 * RESTRICT, so a user with any history physically cannot be removed — the
 * database refuses. Deactivation is the only path.
 */

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
  const user = await AdminUsers.findById(parseIdOrNotFound(id));
  if (!user) throw new NotFoundError();
  return user;
}

/**
 * Name, email, and for students their register number and class.
 *
 * Role is deliberately absent. A student with internships must not become a
 * faculty member — their history would stop making sense, and they would end up
 * assigned to verify their own write-up.
 *
 * Both student fields are required for a student, because both columns are NOT
 * NULL. A blank class is a mis-filled form, not a request to unenrol them.
 */
export async function updateUser(id: string, input: unknown): Promise<void> {
  await requireRole("admin");
  const parsed = parseOrThrow(updateUserSchema, input);

  const existing = await AdminUsers.findRole(id);
  if (!existing) throw new NotFoundError();

  const isStudent = existing.role === "student";
  if (isStudent) {
    if (!parsed.registerNumber) {
      throw new ValidationError({ registerNumber: "A student needs a register number." });
    }
    if (!parsed.classId) {
      throw new ValidationError({ classId: "A student needs a class." });
    }
    await assertClassExists(parsed.classId);
  }

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
 *
 * Deactivating a faculty member who still advises a class is refused. This is
 * the one remaining way to strand a verification queue: the class keeps
 * pointing at them, every future submission from it routes to an account that
 * cannot sign in, and nothing in the UI would say so. Refusing here is the
 * whole replacement for the old repair queue — prevention instead of cleanup.
 */
export async function setUserActive(id: string, isActive: boolean): Promise<void> {
  const actor = await requireRole("admin");

  // Locking yourself out of the only admin account is unrecoverable from the UI.
  if (id === actor.id && !isActive) {
    throw new ForbiddenError("You cannot deactivate your own account.");
  }

  const existing = await AdminUsers.findRole(id);
  if (!existing) throw new NotFoundError();

  if (!isActive && existing.role === "faculty") {
    const advised = await AdminUsers.countClassesAdvisedBy(id);
    if (advised > 0) {
      throw new InvalidStateError(
        `This faculty member still advises ${advised} ${advised === 1 ? "class" : "classes"}. ` +
          "Hand those over to another advisor first, then deactivate them.",
      );
    }
  }

  const changed = await AdminUsers.setActive(id, isActive);
  if (!changed) throw new NotFoundError();
}

/**
 * Also signs them out everywhere, by design.
 *
 * This is the one password path an admin keeps — not account creation, but
 * unlocking somebody who cannot get in. It goes through the same `hashPassword`
 * helper as registration and login, so there is one cost factor in the codebase
 * rather than a lower one hiding on the admin side.
 */
export async function resetUserPassword(id: string, newPassword: string): Promise<void> {
  await requireRole("admin");

  const password = parseValueOrThrow(passwordSchema, newPassword, "newPassword");

  const existing = await AdminUsers.findRole(id);
  if (!existing) throw new NotFoundError();

  const changed = await AdminUsers.setPassword(id, await hashPassword(password));
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
async function assertClassExists(classId: string): Promise<void> {
  const found = await Org.findClass(classId);
  if (!found) throw new ValidationError({ classId: "That class no longer exists." });
}
