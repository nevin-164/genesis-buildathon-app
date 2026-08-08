"use client";

import { useFormStatus } from "react-dom";

import { BTN_GHOST, BTN_PRIMARY, FOCUS_RING, MOTION } from "@/components/explore/explore-ui";
import { cn } from "@/lib/cn";
import type { ExperienceStatus } from "@/types/contracts";

export function ExperienceFormActions({
  canSubmit,
  hasCertificate,
  status,
}: {
  canSubmit: boolean;
  hasCertificate: boolean;
  status: ExperienceStatus;
}) {
  const { pending } = useFormStatus();
  const submitDisabled = pending || !canSubmit || !hasCertificate;
  const submitLabel =
    status === "changes_requested" ? "Resubmit for verification" : "Submit for verification";

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
      <button
        type="submit"
        name="intent"
        value="draft"
        disabled={pending}
        className={cn(
          BTN_GHOST,
          "min-h-11 w-full px-5 sm:w-auto",
          MOTION,
          FOCUS_RING,
          pending && "cursor-not-allowed opacity-60",
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
          BTN_PRIMARY,
          "min-h-11 w-full px-5 sm:w-auto",
          MOTION,
          FOCUS_RING,
          submitDisabled && "cursor-not-allowed opacity-60",
        )}
      >
        {pending ? "Submitting…" : submitLabel}
      </button>
    </div>
  );
}
