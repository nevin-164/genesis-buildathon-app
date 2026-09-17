"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { removeDocumentAction } from "@/app/(app)/student/internships/actions";
import { FOCUS_RING, MOTION } from "@/components/explore/explore-ui";
import { cn } from "@/lib/cn";

/**
 * Removing an attached document.
 *
 * A plain button rather than a <form>, because this panel sits inside the
 * internship form and a nested <form> is invalid HTML — the browser drops the
 * inner one, and the remove click would submit the whole internship instead.
 *
 * Two clicks: the first turns the button into a confirmation. Deleting a file
 * also deletes it from Storage, and there is nothing to undo it with.
 */
export function RemoveDocumentButton({
  documentId,
  internshipId,
  label,
}: {
  documentId: string;
  internshipId: string;
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await removeDocumentAction(documentId, internshipId);
      if (!result.ok) {
        setError(result.message ?? "That file could not be removed.");
        setConfirming(false);
        return;
      }
      router.refresh();
    });
  }

  if (error) {
    return (
      <span className="text-xs font-medium text-red-600" role="alert">
        {error}
      </span>
    );
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={pending}
        aria-label={`Remove ${label}`}
        className={cn(
          "text-xs font-semibold text-red-700 underline underline-offset-2 hover:text-red-900",
          "disabled:opacity-60",
          MOTION,
          FOCUS_RING,
        )}
      >
        Remove
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2 text-xs">
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className={cn(
          "font-semibold text-red-700 underline underline-offset-2 hover:text-red-900",
          "disabled:opacity-60",
          MOTION,
          FOCUS_RING,
        )}
      >
        {pending ? "Removing…" : "Confirm"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={pending}
        className={cn("text-[#5c6b62] hover:text-[#0f1812]", MOTION, FOCUS_RING)}
      >
        Cancel
      </button>
    </span>
  );
}
