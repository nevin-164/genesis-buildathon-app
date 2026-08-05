"use client";

import { useActionState, ReactNode } from "react";
import { type ActionState } from "@/lib/api/action-state";

interface InlineAddFormProps {
  action: (_prev: ActionState, formData: FormData) => Promise<ActionState>;
  title: string;
  children: ReactNode;
  submitLabel?: string;
}

const initialState: ActionState = { ok: true };

export function InlineAddForm({
  action,
  title,
  children,
  submitLabel = "Add",
}: InlineAddFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 mb-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
        {title}
      </h3>

      {state?.message && !state.ok && (
        <div className="mb-3 p-2 text-xs bg-red-950/80 border border-red-800 text-red-300 rounded">
          {state.message}
        </div>
      )}

      <form action={formAction} className="flex flex-wrap items-end gap-3">
        {children}
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm rounded-lg transition-colors shadow-sm cursor-pointer"
        >
          {isPending ? "Adding..." : submitLabel}
        </button>
      </form>
    </div>
  );
}
