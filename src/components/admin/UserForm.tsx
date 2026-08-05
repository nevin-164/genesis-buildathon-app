"use client";

import { useState, useActionState } from "react";
import { type ActionState } from "@/lib/api/action-state";
import { AdminUserRow } from "./UserTable";

interface ClassOption {
  id: string;
  name: string;
}

interface UserFormProps {
  action: (_prev: ActionState, formData: FormData) => Promise<ActionState>;
  initialData?: Partial<AdminUserRow>;
  classOptions?: ClassOption[];
  isEdit?: boolean;
}

const initialState: ActionState = { ok: true };

export function UserForm({
  action,
  initialData,
  classOptions = [],
  isEdit = false,
}: UserFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [role, setRole] = useState<"student" | "faculty">(
    (initialData?.role as "student" | "faculty") ?? "student"
  );

  return (
    <form action={formAction} className="space-y-6 bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
      {state?.message && !state.ok && (
        <div className="p-3 text-xs bg-red-950/80 border border-red-800 text-red-300 rounded-lg">
          {state.message}
        </div>
      )}

      {/* ROLE SELECTION */}
      <div>
        <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
          Role
        </label>
        {isEdit ? (
          <div className="text-sm font-bold text-white capitalize bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 max-w-xs">
            {initialData?.role}
          </div>
        ) : (
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="student"
                checked={role === "student"}
                onChange={() => setRole("student")}
                className="text-blue-600 bg-slate-950 border-slate-700"
              />
              Student
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="faculty"
                checked={role === "faculty"}
                onChange={() => setRole("faculty")}
                className="text-blue-600 bg-slate-950 border-slate-700"
              />
              Faculty
            </label>
          </div>
        )}
      </div>

      {initialData?.id && (
        <input type="hidden" name="userId" value={initialData.id} />
      )}

      {/* FULL NAME */}
      <div>
        <label htmlFor="fullName" className="block text-xs font-medium text-slate-300 mb-1">
          Full Name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          minLength={2}
          maxLength={100}
          defaultValue={initialData?.fullName ?? ""}
          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
        />
        {state?.fieldErrors?.fullName && (
          <p className="mt-1 text-xs text-red-400">{state.fieldErrors.fullName}</p>
        )}
      </div>

      {/* EMAIL */}
      <div>
        <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-1">
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={initialData?.email ?? ""}
          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
        />
        {state?.fieldErrors?.email && (
          <p className="mt-1 text-xs text-red-400">{state.fieldErrors.email}</p>
        )}
      </div>

      {/* PASSWORD (Only on Create) */}
      {!isEdit && (
        <div>
          <label htmlFor="password" className="block text-xs font-medium text-slate-300 mb-1">
            Password (Min 8 characters)
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
          />
          {state?.fieldErrors?.password && (
            <p className="mt-1 text-xs text-red-400">{state.fieldErrors.password}</p>
          )}
        </div>
      )}

      {/* STUDENT SPECIFIC FIELDS */}
      {role === "student" && (
        <>
          <div>
            <label htmlFor="registerNumber" className="block text-xs font-medium text-slate-300 mb-1">
              Register Number
            </label>
            <input
              id="registerNumber"
              name="registerNumber"
              type="text"
              defaultValue={initialData?.registerNumber ?? ""}
              placeholder="e.g. CS22001"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
            />
            {state?.fieldErrors?.registerNumber && (
              <p className="mt-1 text-xs text-red-400">{state.fieldErrors.registerNumber}</p>
            )}
          </div>

          <div>
            <label htmlFor="classId" className="block text-xs font-medium text-slate-300 mb-1">
              Class (Optional)
            </label>
            <select
              id="classId"
              name="classId"
              defaultValue={initialData?.className ?? ""}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">(No class assigned)</option>
              {classOptions.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
            {state?.fieldErrors?.classId && (
              <p className="mt-1 text-xs text-red-400">{state.fieldErrors.classId}</p>
            )}
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
      >
        {isPending ? "Saving..." : isEdit ? "Update User" : "Create User"}
      </button>
    </form>
  );
}
