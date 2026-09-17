import { z } from "zod";

import { email, page, text, uuid } from "./fields";

/**
 * Admin user management. Field names match the form controls.
 *
 * There is no create schema. Students and faculty both register themselves;
 * an admin creating an account would mean inventing a password and getting it
 * to the person somehow, which is the problem self-registration solves. The
 * only admin account is the one in the seed.
 */

const PASSWORD_MESSAGE = "Password must be at least 8 characters.";
export const password = z.string(PASSWORD_MESSAGE).min(8, PASSWORD_MESSAGE).max(200);

export const fullName = text(2, 100, "Full name must be 2 to 100 characters.");
export const registerNumber = text(2, 40, "Register number must be 2 to 40 characters.");

/**
 * Role is absent on purpose. A student with internships must not become a
 * faculty member — their history would make no sense, and the internships they
 * are assigned to verify would be their own.
 *
 * `registerNumber` and `classId` are optional here because the same schema
 * serves faculty edits, where neither field is rendered. The controller
 * requires both for a student.
 */
export const updateUserSchema = z.object({
  fullName,
  email,
  registerNumber: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    registerNumber.optional(),
  ),
  classId: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    uuid("Choose a valid class.").optional(),
  ),
});

export const resetPasswordSchema = z.object({
  userId: uuid(),
  newPassword: password,
});

/** Blank means "no filter", which is why each of these collapses to undefined. */
const optionalFilterUuid = z.preprocess(
  (v) => (typeof v === "string" && v.trim() !== "" ? v : undefined),
  z.uuid().optional(),
);

export const userFiltersSchema = z.object({
  q: z.preprocess((v) => {
    if (typeof v !== "string") return undefined;
    const trimmed = v.trim();
    return trimmed === "" ? undefined : trimmed;
  }, z.string().max(100).optional()),
  role: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.enum(["student", "faculty", "admin"]).optional(),
  ),
  isActive: z.preprocess((v) => {
    if (v === true || v === "true") return true;
    if (v === false || v === "false") return false;
    return undefined;
  }, z.boolean().optional()),
  departmentId: optionalFilterUuid,
  batchId: optionalFilterUuid,
  classId: optionalFilterUuid,
  page,
});

export type UpdateUserInput = z.output<typeof updateUserSchema>;
export type UserFiltersInput = z.output<typeof userFiltersSchema>;
