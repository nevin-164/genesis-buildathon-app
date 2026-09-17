"use client";

import { useActionState } from "react";

import { formMessage } from "@/components/staff/staff-ui";
import { initialActionState } from "@/types/contracts";

import type { FormAction } from "./action-form-types";

/**
 * A plain <form> wired to a Server Action that follows the project's
 * (prevState, formData) => ActionState signature.
 *
 * A bare `<form action={someAction}>` cannot be used with those actions —
 * React would pass FormData as the *first* argument. This wraps them in
 * useActionState so the signature lines up and the returned message is shown.
 */
export function ActionForm({
  action,
  children,
  className,
  pendingClassName = "opacity-60 pointer-events-none",
  showMessage = true,
}: {
  action: FormAction;
  children: React.ReactNode;
  className?: string;
  pendingClassName?: string;
  showMessage?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <div className="space-y-2">
      <form
        action={formAction}
        className={`${className ?? ""} ${pending ? pendingClassName : ""}`}
      >
        {children}
      </form>

      {showMessage && state.message && (
        <p className={formMessage(state.ok)}>{state.message}</p>
      )}
    </div>
  );
}
