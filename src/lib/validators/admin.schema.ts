import { z } from "zod";

import { email, optionalUuid, page, text, uuid } from "./fields";

/** Admin user management. Field names match package 6's form controls. */

const PASSWORD_MESSAGE = "Password must be at least 8 characters.";
const password = z.string(PASSWORD_MESSAGE).min(8, PASSWORD_MESSAGE).max(200);

const fullName = text(2, 100, "Full name must be 2 to 100 characters.");
const registerNumber = text(2, 40, "Register number must be 2 to 40 characters.");

/**
 * An admin account is never created through the UI. Promoting someone to admin
 * is a deliberate, out-of-band act, not a dropdown option.
 */
export const createUserSchema = z
  .object({
    role: z.enum(["student", "faculty"], "Choose student or faculty."),
    fullName,
    email,
    password,
    registerNumber: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      registerNumber.optional(),
    ),
    classId: optionalUuid("Choose a valid class."),
  })
  .superRefine((value, ctx) => {
    if (value.role === "student" && !value.registerNumber) {
      ctx.addIssue({
        code: "custom",
        path: ["registerNumber"],
        message: "A student needs a register number.",
      });
    }
  });

/**
 * Role is absent on purpose. A student with internships must not become a
 * faculty member — their history would make no sense, and the internships they
 * are assigned to verify would be their own.
 */
export const updateUserSchema = z.object({
  fullName,
  email,
  registerNumber: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    registerNumber.optional(),
  ),
  classId: optionalUuid("Choose a valid class."),
});

export const resetPasswordSchema = z.object({
  userId: uuid(),
  newPassword: password,
});

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
  page,
});

export type CreateUserInput = z.output<typeof createUserSchema>;
export type UpdateUserInput = z.output<typeof updateUserSchema>;
export type UserFiltersInput = z.output<typeof userFiltersSchema>;
