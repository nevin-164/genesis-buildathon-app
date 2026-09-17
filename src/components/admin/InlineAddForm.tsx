"use client";

import { useActionState } from "react";

import {
  BTN_PRIMARY,
  EYEBROW,
  formMessage,
  PANEL,
} from "@/components/staff/staff-ui";
import { cn } from "@/lib/cn";
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
    <div className={cn(PANEL, "space-y-3.5 p-5")}>
      <h2 className={EYEBROW}>{title}</h2>

      <form action={formAction} className="flex flex-wrap items-end gap-3">
        {children}

        <button type="submit" disabled={pending} className={BTN_PRIMARY}>
          {pending ? "Saving…" : submitLabel}
        </button>
      </form>

      {state.message && <p className={formMessage(state.ok)}>{state.message}</p>}

      {fieldErrors.length > 0 && (
        <ul className="space-y-0.5 text-xs text-[#f79393]">
          {fieldErrors.map(([field, message]) => (
            <li key={field}>
              <span className="font-mono text-[#ffb4b4]">{field}</span> — {message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
