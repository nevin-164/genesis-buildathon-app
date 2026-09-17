"use client";

import { useActionState } from "react";

import {
  BTN_PRIMARY,
  CONTROL,
  CONTROL_SELECT,
  DIVIDER,
  FAINT,
  FIELD_ERROR,
  FIELD_HINT,
  formMessage,
  LABEL,
  MUTED,
  PANEL_PADDED,
} from "@/components/staff/staff-ui";
import { cn } from "@/lib/cn";
import { initialActionState, type Role } from "@/types/contracts";

import type { FormAction } from "./action-form-types";

export type UserFormData = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  registerNumber?: string | null;
  className?: string | null;
  classId?: string | null;
};

const ROLE_LABELS: Record<Role, string> = {
  student: "Student",
  faculty: "Faculty",
  admin: "Administrator",
};

/**
 * Edit only. There is no create form and no password field.
 *
 * Students and faculty both register themselves, so the only account an admin
 * could create is one whose password they would then have to send to somebody
 * — which is the thing self-registration exists to avoid. Correcting a name,
 * an email or a misfiled class is what is left.
 *
 * The role renders as fixed text. Changing it would orphan a student profile
 * and could make somebody the verifier of their own write-up.
 */
export function UserForm({
  action,
  classOptions,
  user,
}: {
  action: FormAction;
  classOptions: { id: string; name: string }[];
  user: UserFormData;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  const fieldError = (name: string) => state.fieldErrors?.[name];
  const isStudent = user.role === "student";

  // The list rows carry a class name, not an id. Match it back when we can.
  const currentClassId =
    user.classId ?? classOptions.find((option) => option.name === user.className)?.id ?? "";

  return (
    <form action={formAction} className={cn(PANEL_PADDED, "space-y-5")}>
      <input type="hidden" name="userId" value={user.id} />

      <div>
        <label htmlFor="fullName" className={LABEL}>
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          defaultValue={user.fullName}
          placeholder="e.g. Anjali Menon"
          className={CONTROL}
        />
        {fieldError("fullName") && <p className={FIELD_ERROR}>{fieldError("fullName")}</p>}
      </div>

      <div>
        <label htmlFor="email" className={LABEL}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={user.email}
          placeholder="name@example.com"
          className={CONTROL}
        />
        {fieldError("email") && <p className={FIELD_ERROR}>{fieldError("email")}</p>}
      </div>

      <div>
        <span className={LABEL}>Role</span>
        <p
          className={cn(
            "rounded-lg border border-[#1b2a21] bg-[#080e0b] px-3 py-2 text-sm",
            MUTED,
          )}
        >
          {ROLE_LABELS[user.role]}
          <span className={cn("ml-2 text-xs", FAINT)}>
            (a role cannot be changed after the account exists)
          </span>
        </p>
      </div>

      {isStudent && (
        <div className={cn("grid gap-5 border-t pt-5 sm:grid-cols-2", DIVIDER)}>
          <div>
            <label htmlFor="registerNumber" className={LABEL}>
              Register number
            </label>
            <input
              id="registerNumber"
              name="registerNumber"
              type="text"
              required
              defaultValue={user.registerNumber ?? ""}
              placeholder="e.g. CS22001"
              className={cn(CONTROL, "font-mono")}
            />
            {fieldError("registerNumber") && (
              <p className={FIELD_ERROR}>{fieldError("registerNumber")}</p>
            )}
          </div>

          <div>
            <label htmlFor="classId" className={LABEL}>
              Class
            </label>
            {/*
              No blank option. A student is always in a class — the column is
              NOT NULL — and moving them here only redirects what they submit
              next; anything already submitted stays with its current reviewer.
            */}
            <select
              id="classId"
              name="classId"
              required
              defaultValue={currentClassId}
              className={CONTROL_SELECT}
            >
              {classOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <p className={FIELD_HINT}>
              The class advisor verifies this student&apos;s next submission.
            </p>
            {fieldError("classId") && <p className={FIELD_ERROR}>{fieldError("classId")}</p>}
          </div>
        </div>
      )}

      {state.message && (
        <p className={cn(formMessage(state.ok), "text-sm")}>{state.message}</p>
      )}

      <div className={cn("flex items-center gap-3 border-t pt-5", DIVIDER)}>
        <button type="submit" disabled={pending} className={BTN_PRIMARY}>
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
