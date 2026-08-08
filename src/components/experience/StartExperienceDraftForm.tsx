"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { createExperienceDraftAction } from "@/app/(app)/student/experience/actions";
import { BTN_PRIMARY, FOCUS_RING, MOTION } from "@/components/explore/explore-ui";
import { cn } from "@/lib/cn";
import { initialActionState, type ContributableApplication } from "@/types/contracts";

function StartReportButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        BTN_PRIMARY,
        "inline-flex min-h-11 w-full items-center justify-center px-5 sm:w-auto",
        MOTION,
        FOCUS_RING,
        pending && "cursor-not-allowed opacity-60",
      )}
    >
      {pending ? "Starting report…" : "Start report"}
    </button>
  );
}

export function StartExperienceDraftForm({
  contributable,
}: {
  contributable: ContributableApplication;
}) {
  const [state, formAction] = useActionState(createExperienceDraftAction, initialActionState);

  return (
    <form action={formAction} className="mt-4">
      <input type="hidden" name="applicationId" value={contributable.applicationId} />

      {!state.ok && state.message && (
        <p className="mb-3 text-sm font-medium text-red-600" role="alert">
          {state.message}
        </p>
      )}

      <StartReportButton />
    </form>
  );
}
