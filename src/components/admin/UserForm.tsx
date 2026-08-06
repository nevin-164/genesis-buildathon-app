"use client";

import { useActionState, useState } from "react";
import { initialActionState, type Role } from "@/types/contracts";

import type { FormAction } from "./action-form-types";

export type UserFormData = {
  id?: string;
  fullName?: string;
  email?: string;
  role?: Role;
  registerNumber?: string | null;
  className?: string | null;
  classId?: string | null;
  isActive?: boolean;
};

/**
 * Admin is absent on purpose, and the controller rejects it too. Promoting
 * someone is a deliberate, out-of-band act, not a dropdown option on a form.
 */
const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "faculty", label: "Faculty" },
];

const ROLE_LABELS: Record<Role, string> = {
  student: "Student",
  faculty: "Faculty",
  admin: "Administrator",
};

const INPUT =
  "w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500";

/**
 * Create and edit share one form. On edit the role is fixed — changing it
 * would orphan a student profile — so it renders as text plus a hidden input.
 */
export function UserForm({
  action,
  classOptions,
  isEdit = false,
  initialData,
}: {
  action: FormAction;
  classOptions: { id: string; name: string }[];
  isEdit?: boolean;
  initialData?: UserFormData;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const [role, setRole] = useState<Role>(initialData?.role ?? "student");

  const fieldError = (name: string) => state.fieldErrors?.[name];

  // The list rows carry a class name, not an id. Match it back when we can.
  const currentClassId =
    initialData?.classId ??
    classOptions.find((c) => c.name === initialData?.className)?.id ??
    "";

  return (
    <form
      action={formAction}
      className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-5"
    >
      {isEdit && initialData?.id && (
        <input type="hidden" name="userId" value={initialData.id} />
      )}

      {/* Full name */}
      <div>
        <label
          htmlFor="fullName"
          className="block text-xs font-medium text-slate-400 mb-1"
        >
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          defaultValue={initialData?.fullName ?? ""}
          placeholder="e.g. Anjali Menon"
          className={INPUT}
        />
        {fieldError("fullName") && (
          <p className="mt-1 text-xs text-red-400">{fieldError("fullName")}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-xs font-medium text-slate-400 mb-1"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={initialData?.email ?? ""}
          placeholder="name@example.com"
          className={INPUT}
        />
        {fieldError("email") && (
          <p className="mt-1 text-xs text-red-400">{fieldError("email")}</p>
        )}
      </div>

      {/* Role — editable on create, fixed on edit */}
      <div>
        <label
          htmlFor="role"
          className="block text-xs font-medium text-slate-400 mb-1"
        >
          Role
        </label>
        {isEdit ? (
          <>
            <p className="px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-300">
              {ROLE_LABELS[role]}
              <span className="ml-2 text-xs text-slate-500">
                (a role cannot be changed after the account exists)
              </span>
            </p>
            <input type="hidden" name="role" value={role} />
          </>
        ) : (
          <select
            id="role"
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className={`${INPUT} cursor-pointer`}
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
        {fieldError("role") && (
          <p className="mt-1 text-xs text-red-400">{fieldError("role")}</p>
        )}
      </div>

      {/* Student-only fields */}
      {role === "student" && (
        <div className="grid gap-5 sm:grid-cols-2 pt-2 border-t border-slate-800">
          <div>
            <label
              htmlFor="registerNumber"
              className="block text-xs font-medium text-slate-400 mb-1"
            >
              Register number
            </label>
            <input
              id="registerNumber"
              name="registerNumber"
              type="text"
              defaultValue={initialData?.registerNumber ?? ""}
              placeholder="e.g. CS22001"
              className={`${INPUT} font-mono`}
            />
            {fieldError("registerNumber") && (
              <p className="mt-1 text-xs text-red-400">
                {fieldError("registerNumber")}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="classId"
              className="block text-xs font-medium text-slate-400 mb-1"
            >
              Class
            </label>
            <select
              id="classId"
              name="classId"
              defaultValue={currentClassId}
              className={`${INPUT} cursor-pointer`}
            >
              <option value="">— Not enrolled yet —</option>
              {classOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              The class advisor becomes this student&apos;s verifier.
            </p>
          </div>
        </div>
      )}

      {/* Password — only when creating */}
      {!isEdit && (
        <div className="pt-2 border-t border-slate-800">
          <label
            htmlFor="password"
            className="block text-xs font-medium text-slate-400 mb-1"
          >
            Temporary password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="At least 8 characters"
            className={INPUT}
          />
          {fieldError("password") && (
            <p className="mt-1 text-xs text-red-400">{fieldError("password")}</p>
          )}
        </div>
      )}

      {state.message && (
        <p
          className={`text-sm font-medium ${
            state.ok ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {state.message}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition-colors cursor-pointer shadow-sm"
        >
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create user"}
        </button>
      </div>
    </form>
  );
}
