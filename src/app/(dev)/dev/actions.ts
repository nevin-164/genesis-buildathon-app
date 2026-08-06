"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  assignInternshipFaculty,
  moveStudentToClass,
  setClassAdvisor,
  setStudentAdvisorOverride,
} from "@/controllers/admin/assignment.controller";
import {
  createBatch,
  createClass,
  createDepartment,
  updateClass,
  updateDepartment,
} from "@/controllers/admin/org.controller";
import {
  createUser,
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

/** An empty select means "none", which is a real value, not a missing one. */
function nullable(form: FormData, key: string): string | null {
  const value = str(form, key).trim();
  return value === "" ? null : value;
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
      advisorId: nullable(form, "advisorId"),
    }),
  );
}

export async function setClassAdvisorAction(form: FormData) {
  await finish(ORG, () => setClassAdvisor(str(form, "classId"), nullable(form, "advisorId")));
}

/* ── users ──────────────────────────────────────────────────────────────── */

const USERS = "/dev/admin/users";

export async function createUserAction(form: FormData) {
  await finish(USERS, () => createUser(Object.fromEntries(form)));
}

export async function updateUserAction(form: FormData) {
  await finish(USERS, () =>
    updateUser(str(form, "userId"), {
      fullName: str(form, "fullName"),
      email: str(form, "email"),
      registerNumber: str(form, "registerNumber"),
      classId: nullable(form, "classId"),
    }),
  );
}

export async function setUserActiveAction(form: FormData) {
  await finish(USERS, () => setUserActive(str(form, "userId"), str(form, "isActive") === "true"));
}

export async function resetPasswordAction(form: FormData) {
  await finish(USERS, () => resetUserPassword(str(form, "userId"), str(form, "newPassword")));
}

/* ── assignment ─────────────────────────────────────────────────────────── */

const ASSIGN = "/dev/admin/assignments";

export async function assignInternshipAction(form: FormData) {
  await finish(ASSIGN, () =>
    assignInternshipFaculty(str(form, "internshipId"), str(form, "facultyId")),
  );
}

export async function setAdvisorOverrideAction(form: FormData) {
  await finish(ASSIGN, () =>
    setStudentAdvisorOverride(str(form, "studentId"), nullable(form, "advisorId")),
  );
}

export async function moveStudentAction(form: FormData) {
  await finish(ASSIGN, () => moveStudentToClass(str(form, "studentId"), nullable(form, "classId")));
}

export async function setClassAdvisorFromAssignmentsAction(form: FormData) {
  await finish(ASSIGN, () => setClassAdvisor(str(form, "classId"), nullable(form, "advisorId")));
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
