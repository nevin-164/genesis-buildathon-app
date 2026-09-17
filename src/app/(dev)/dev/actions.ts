"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { moveStudentToClass, setClassAdvisor } from "@/controllers/admin/assignment.controller";
import {
  createBatch,
  createClass,
  createDepartment,
  updateClass,
  updateDepartment,
} from "@/controllers/admin/org.controller";
import {
  resetUserPassword,
  setUserActive,
  updateUser,
} from "@/controllers/admin/user.controller";
import { verifyInternship } from "@/controllers/verification.controller";
import { toActionState } from "@/lib/api/action-state";

/**
 * Thin wrappers, exactly like the ones packages 5 and 6 will write — same
 * controllers, same `toActionState` mapping, same "redirect outside the try".
 *
 * The only difference is where the result goes: instead of `useActionState`
 * these bounce back with `?ok=&msg=`, which keeps every harness page a Server
 * Component with no client JavaScript at all.
 */

function str(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

function describe(state: ReturnType<typeof toActionState>): string {
  const fields = state.fieldErrors
    ? Object.entries(state.fieldErrors)
        .map(([field, message]) => `${field}: ${message}`)
        .join(" · ")
    : "";
  return [state.message, fields].filter(Boolean).join(" — ") || "Failed.";
}

/**
 * `redirect()` works by throwing, so it must live outside the try — a catch
 * would swallow it and the page would silently do nothing. This is the single
 * most common Next 16 mistake in an action.
 */
async function finish(path: string, run: () => Promise<unknown>): Promise<never> {
  let ok = true;
  let message = "Done.";

  try {
    await run();
  } catch (error) {
    ok = false;
    message = describe(toActionState(error));
  }

  revalidatePath(path);
  redirect(`${path}?ok=${ok}&msg=${encodeURIComponent(message)}`);
}

/* ── organisation ───────────────────────────────────────────────────────── */

const ORG = "/dev/admin/org";

export async function createDepartmentAction(form: FormData) {
  await finish(ORG, () => createDepartment(Object.fromEntries(form)));
}

export async function updateDepartmentAction(form: FormData) {
  await finish(ORG, () =>
    updateDepartment(str(form, "departmentId"), { code: str(form, "code"), name: str(form, "name") }),
  );
}

export async function createBatchAction(form: FormData) {
  await finish(ORG, () => createBatch(Object.fromEntries(form)));
}

export async function createClassAction(form: FormData) {
  await finish(ORG, () => createClass(Object.fromEntries(form)));
}

export async function updateClassAction(form: FormData) {
  await finish(ORG, () =>
    updateClass(str(form, "classId"), {
      name: str(form, "name"),
      advisorId: str(form, "advisorId"),
    }),
  );
}

/** No blank option: a class always has an advisor, so this is a handover. */
export async function setClassAdvisorAction(form: FormData) {
  await finish(ORG, () => setClassAdvisor(str(form, "classId"), str(form, "advisorId")));
}

/** Likewise a move, never a removal — every student is in exactly one class. */
export async function moveStudentAction(form: FormData) {
  await finish(ORG, () => moveStudentToClass(str(form, "studentId"), str(form, "classId")));
}

/* ── users ──────────────────────────────────────────────────────────────── */

const USERS = "/dev/admin/users";

/**
 * No createUserAction. Students and faculty register themselves at /register,
 * so the admin controller has no create function for this to wrap.
 */
export async function updateUserAction(form: FormData) {
  await finish(USERS, () =>
    updateUser(str(form, "userId"), {
      fullName: str(form, "fullName"),
      email: str(form, "email"),
      registerNumber: str(form, "registerNumber"),
      classId: str(form, "classId"),
    }),
  );
}

export async function setUserActiveAction(form: FormData) {
  await finish(USERS, () => setUserActive(str(form, "userId"), str(form, "isActive") === "true"));
}

export async function resetPasswordAction(form: FormData) {
  await finish(USERS, () => resetUserPassword(str(form, "userId"), str(form, "newPassword")));
}

/* ── verification ───────────────────────────────────────────────────────── */

/**
 * The three buttons submit one form, each carrying its own `action` value —
 * exactly the shape package 5's DecisionForm produces.
 */
export async function verifyAction(form: FormData) {
  const internshipId = str(form, "internshipId");
  await finish(`/dev/faculty/verify/${internshipId}`, () =>
    verifyInternship(internshipId, {
      action: form.get("action"),
      reason: form.get("reason"),
      confirmIdentity: form.get("confirmIdentity"),
      confirmEvidence: form.get("confirmEvidence"),
      confirmNoPrivateInfo: form.get("confirmNoPrivateInfo"),
    }),
  );
}
