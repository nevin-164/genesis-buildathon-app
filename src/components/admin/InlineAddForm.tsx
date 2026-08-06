"use client";

import { useActionState } from "react";
import { initialActionState } from "@/types/contracts";

import type { FormAction } from "./action-form-types";

/**
 * The "add a row" card that sits above every org-tree table. The page supplies
 * the fields as children, so this owns nothing but the frame, the submit
 * button and the result banner.
 */
export function InlineAddForm({
  action,
  title,
  submitLabel = "Create",
  children,
}: {
  action: FormAction;
  title: string;
  submitLabel?: string;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const fieldErrors = Object.entries(state.fieldErrors ?? {});

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {title}
      </h2>

      <form action={formAction} className="flex flex-wrap items-end gap-3">
        {children}

        <button
          type="submit"
          disabled={pending}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition-colors cursor-pointer shadow-sm whitespace-nowrap"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
      </form>

      {state.message && (
        <p
          className={`text-xs font-medium ${
            state.ok ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {state.message}
        </p>
      )}

      {fieldErrors.length > 0 && (
        <ul className="text-xs text-red-400 space-y-0.5">
          {fieldErrors.map(([field, message]) => (
            <li key={field}>
              <span className="font-mono text-red-300">{field}</span> — {message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
