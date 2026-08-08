"use client";

import { useActionState, useState } from "react";

import { replyToClarificationAction } from "@/app/(app)/student/application/actions";
import { INSET_MINT, META, SECTION_TITLE } from "@/components/student/student-ui";
import { QuoteBlock } from "@/components/student/primitives";
import { Field, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/cn";
import { initialActionState } from "@/types/contracts";

const MIN_REPLY_LENGTH = 10;

export function ClarificationBox({
  applicationId,
  facultyMessage,
  hideFacultyMessage = false,
}: {
  applicationId: string;
  facultyMessage: string | null;
  hideFacultyMessage?: boolean;
}) {
  const [state, formAction] = useActionState(replyToClarificationAction, initialActionState);
  const [replyMessage, setReplyMessage] = useState("");

  const trimmedLength = replyMessage.trim().length;
  const fieldError = state.fieldErrors?.replyMessage;

  return (
    <section
      id="reply-to-faculty"
      className="scroll-mt-28 border-t border-[var(--il-border)] pt-8 sm:scroll-mt-32"
      aria-labelledby="reply-to-faculty-heading"
    >
      <h2 id="reply-to-faculty-heading" className={SECTION_TITLE}>
        Reply to faculty
      </h2>
      <p className={cn("mt-1.5 max-w-prose text-sm leading-relaxed", META)}>
        Provide the requested information so your application can be reviewed.
      </p>

      {!hideFacultyMessage && facultyMessage && (
        <div className="mt-4 max-w-prose">
          <QuoteBlock label="Faculty feedback">{facultyMessage}</QuoteBlock>
        </div>
      )}

      {state.ok && state.message && (
        <p
          className={cn(INSET_MINT, "mt-4 px-3.5 py-2.5 text-sm text-[var(--il-moss)]")}
          role="status"
        >
          {state.message}
        </p>
      )}

      {!state.ok && state.message && !fieldError && (
        <p className="mt-4 text-sm font-medium text-[var(--il-error)]" role="alert">
          {state.message}
        </p>
      )}

      <form action={formAction} className="mt-5 space-y-4">
        <input type="hidden" name="applicationId" value={applicationId} />

        <Field label="Your response" htmlFor="replyMessage" required error={fieldError}>
          <Textarea
            id="replyMessage"
            name="replyMessage"
            rows={6}
            required
            minLength={MIN_REPLY_LENGTH}
            value={replyMessage}
            onChange={(event) => setReplyMessage(event.target.value)}
            error={fieldError}
            aria-describedby="replyMessage-count"
            className="min-h-[9rem] w-full resize-y"
          />
        </Field>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--il-border)] pt-4">
          <p
            id="replyMessage-count"
            className={cn(
              "text-xs",
              trimmedLength > 0 && trimmedLength < MIN_REPLY_LENGTH
                ? "text-[var(--il-amber)]"
                : META,
            )}
          >
            {trimmedLength} character{trimmedLength === 1 ? "" : "s"}
            {trimmedLength < MIN_REPLY_LENGTH && ` (${MIN_REPLY_LENGTH} minimum)`}
          </p>
          <SubmitButton pendingLabel="Sending…">Reply to faculty</SubmitButton>
        </div>
      </form>
    </section>
  );
}
