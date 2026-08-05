"use client";

import { useActionState, useState } from "react";

import { replyToClarificationAction } from "@/app/(app)/student/application/actions";
import {
  INK,
  MUTED,
  MUTED_LIGHT,
  PANEL,
} from "@/components/explore/explore-ui";
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
      className={cn(PANEL, "scroll-mt-24 p-4 sm:p-5")}
      aria-labelledby="reply-to-faculty-heading"
    >
      <h2 id="reply-to-faculty-heading" className={cn("text-base font-semibold", INK)}>
        Reply to faculty
      </h2>
      <p className={cn("mt-1 text-sm", MUTED)}>
        Provide the requested information so your application can be reviewed.
      </p>

      {!hideFacultyMessage && facultyMessage && (
        <blockquote className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50/50 px-3 py-2.5 text-sm leading-relaxed text-[#3d4a42]">
          <p className={cn("text-[10px] font-semibold uppercase tracking-wide", MUTED_LIGHT)}>
            Faculty feedback
          </p>
          <p className="mt-1">{facultyMessage}</p>
        </blockquote>
      )}

      {state.ok && state.message && (
        <p
          className="mt-3 rounded-lg border border-[#b8d4bc] bg-[#ecf8ee] px-3 py-2 text-sm text-[#2d5038]"
          role="status"
        >
          {state.message}
        </p>
      )}

      {!state.ok && state.message && !fieldError && (
        <p className="mt-3 text-sm font-medium text-red-600" role="alert">
          {state.message}
        </p>
      )}

      <form action={formAction} className="mt-4 space-y-3">
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

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p
            id="replyMessage-count"
            className={cn(
              "text-xs",
              trimmedLength > 0 && trimmedLength < MIN_REPLY_LENGTH
                ? "text-amber-800"
                : MUTED_LIGHT,
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
