"use client";

import { useFormStatus } from "react-dom";

import {
  BTN_LIME,
  BTN_PRIMARY,
  BTN_SECONDARY,
  FOCUS_RING,
  HOVER_LIFT,
  MOTION,
} from "@/components/student/student-ui";
import { cn } from "@/lib/cn";
import type { ExperienceStatus } from "@/types/contracts";

export function ExperienceFormActions({
  canSubmit,
  hasCertificate,
  status,
  disabled = false,
}: {
  canSubmit: boolean;
  hasCertificate: boolean;
  status: ExperienceStatus;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const formDisabled = pending || disabled;
  const submitDisabled = formDisabled || !canSubmit || !hasCertificate;
  const submitLabel =
    status === "changes_requested" ? "Resubmit for verification" : "Submit for verification";

  return (
    <>
      <button
        type="submit"
        name="intent"
        value="draft"
        disabled={formDisabled}
        className={cn(
          BTN_SECONDARY,
          "min-h-11 w-full px-5 font-semibold sm:w-auto",
          MOTION,
          FOCUS_RING,
          formDisabled && "cursor-not-allowed opacity-60",
        )}
      >
        {pending ? "Saving…" : "Save draft"}
      </button>
      <button
        type="submit"
        name="intent"
        value="submit"
        disabled={submitDisabled}
        className={cn(
          status === "changes_requested" ? BTN_LIME : BTN_PRIMARY,
          "min-h-11 w-full px-5 font-bold sm:w-auto",
          MOTION,
          HOVER_LIFT,
          FOCUS_RING,
          submitDisabled && "cursor-not-allowed opacity-60",
        )}
      >
        {pending ? "Submitting…" : submitLabel}
      </button>
    </>
  );
}
