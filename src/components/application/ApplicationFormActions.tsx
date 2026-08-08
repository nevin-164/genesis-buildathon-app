"use client";

import { useFormStatus } from "react-dom";

import { BTN_GHOST, BTN_PRIMARY, FOCUS_RING, MOTION } from "@/components/explore/explore-ui";
import { cn } from "@/lib/cn";

export function ApplicationFormActions({
  canSubmit,
  disabled = false,
  hasOfferLetter = true,
}: {
  canSubmit: boolean;
  disabled?: boolean;
  hasOfferLetter?: boolean;
}) {
  const { pending } = useFormStatus();
  const formDisabled = pending || disabled;
  const submitDisabled = formDisabled || !canSubmit || !hasOfferLetter;

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
      <button
        type="submit"
        name="intent"
        value="draft"
        disabled={formDisabled}
        className={cn(
          BTN_GHOST,
          "min-h-11 w-full px-5 sm:w-auto",
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
          BTN_PRIMARY,
          "min-h-11 w-full px-5 sm:w-auto",
          MOTION,
          FOCUS_RING,
          submitDisabled && "cursor-not-allowed opacity-60",
        )}
      >
        {pending ? "Submitting…" : "Submit for approval"}
      </button>
    </div>
  );
}
