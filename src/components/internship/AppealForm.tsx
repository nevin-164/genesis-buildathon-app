"use client";

import { useActionState, useState } from "react";

import { appealRejectionAction } from "@/app/(app)/student/internships/actions";
import { INK, MUTED, MUTED_LIGHT, PANEL } from "@/components/explore/explore-ui";
import { Field, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/cn";
import { APPEAL_MIN } from "@/lib/validators/appeal.schema";
import { initialActionState } from "@/types/contracts";

/**
 * The student's case, and the last thing on the appeal screen.
 *
 * It sits below the documents panel on purpose. The order of the page is the
 * order of the work: read what your advisor said, attach what answers it, then
 * write why it answers it. A student who writes the argument first tends to
 * argue instead of evidencing, and an appeal with no new documents is the one
 * an administrator has no grounds to grant.
 *
 * Filing is one-way and the form says so before the button, not after it —
 * once this posts, nothing more can be attached and the packet is what the
 * administrator will rule on.
 */
export function AppealForm({
  internshipId,
  documentCount,
}: {
  internshipId: string;
  /** Only to warn about filing with no proof. It never blocks the submit. */
  documentCount: number;
}) {
  const [state, formAction] = useActionState(appealRejectionAction, initialActionState);
  const [appealMessage, setAppealMessage] = useState("");

  const trimmedLength = appealMessage.trim().length;
  const fieldError = state.fieldErrors?.appealMessage;

  return (
    <section
      id="write-appeal"
      className={cn(PANEL, "scroll-mt-28 p-4 sm:scroll-mt-32 sm:p-5")}
      aria-labelledby="write-appeal-heading"
    >
      <h2 id="write-appeal-heading" className={cn("text-base font-semibold", INK)}>
        Your appeal
      </h2>
      <p className={cn("mt-1 text-sm", MUTED)}>
        Answer your advisor&apos;s reason point by point, and say what the documents
        above show. An administrator who has never seen this internship will read
        this and decide.
      </p>

      {/*
        A warning, not a block. "You must attach something" would be the wrong
        rule: an appeal against a misread date needs no new file, and refusing
        to file it would be the app deciding a case it cannot judge.
      */}
      {documentCount === 0 && (
        <p
          className="mt-3 rounded-lg border border-amber-200/90 bg-amber-50/60 px-3 py-2.5 text-sm text-amber-900"
          role="status"
        >
          Nothing is attached. An appeal with no new proof is usually the same
          answer again — attach what your advisor said was missing before you file.
        </p>
      )}

      {!state.ok && state.message && !fieldError && (
        <p className="mt-3 text-sm font-medium text-red-600" role="alert">
          {state.message}
        </p>
      )}

      <form action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="internshipId" value={internshipId} />

        <Field
          label="Why this decision should be reconsidered"
          htmlFor="appealMessage"
          required
          error={fieldError}
        >
          <Textarea
            id="appealMessage"
            name="appealMessage"
            rows={8}
            required
            minLength={APPEAL_MIN}
            value={appealMessage}
            onChange={(event) => setAppealMessage(event.target.value)}
            error={fieldError}
            aria-describedby="appealMessage-count"
            placeholder="My advisor said the completion certificate was missing. I have now attached it, signed by my supervisor on…"
            className="min-h-[12rem] w-full resize-y"
          />
        </Field>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p
            id="appealMessage-count"
            className={cn(
              "text-xs",
              trimmedLength > 0 && trimmedLength < APPEAL_MIN ? "text-amber-800" : MUTED_LIGHT,
            )}
          >
            {trimmedLength} character{trimmedLength === 1 ? "" : "s"}
            {trimmedLength < APPEAL_MIN && ` (${APPEAL_MIN} minimum)`}
          </p>
          <SubmitButton pendingLabel="Filing…">File this appeal</SubmitButton>
        </div>

        <p className={cn("text-xs leading-relaxed", MUTED_LIGHT)}>
          You get one appeal on this internship. Once you file it, the documents
          and this message are what the administrator rules on, and nothing more
          can be attached.
        </p>
      </form>
    </section>
  );
}
