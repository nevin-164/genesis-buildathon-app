"use client";

import { useActionState, useState } from "react";

import { replyToClarificationAction } from "@/app/(app)/student/application/actions";
import { Card, Field, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/cn";
import { initialActionState } from "@/types/contracts";

const MIN_REPLY_LENGTH = 10;

export function ClarificationBox({
  applicationId,
  facultyMessage,
}: {
  applicationId: string;
  facultyMessage: string | null;
}) {
  const [state, formAction] = useActionState(replyToClarificationAction, initialActionState);
  const [replyMessage, setReplyMessage] = useState("");

  const trimmedLength = replyMessage.trim().length;
  const fieldError = state.fieldErrors?.replyMessage;

  return (
    <Card className="border-amber-200 bg-amber-50/30">
      <h2 className="text-base font-semibold text-zinc-900">Faculty feedback</h2>
      <p className="mt-1 text-sm font-medium text-amber-900">A response is required</p>

      {facultyMessage && (
        <blockquote className="mt-3 rounded-md border border-amber-200/80 bg-white px-3 py-2.5 text-sm leading-relaxed text-zinc-700">
          {facultyMessage}
        </blockquote>
      )}

      {state.ok && state.message && (
        <p
          className="mt-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800"
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

        <Field
          label="Your response"
          htmlFor="replyMessage"
          required
          error={fieldError}
        >
          <Textarea
            id="replyMessage"
            name="replyMessage"
            rows={4}
            required
            minLength={MIN_REPLY_LENGTH}
            value={replyMessage}
            onChange={(event) => setReplyMessage(event.target.value)}
            error={fieldError}
            aria-describedby="replyMessage-count"
            className="min-h-[6rem] resize-y"
          />
        </Field>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p
            id="replyMessage-count"
            className={cn(
              "text-xs",
              trimmedLength > 0 && trimmedLength < MIN_REPLY_LENGTH
                ? "text-amber-700"
                : "text-zinc-500",
            )}
          >
            {trimmedLength} character{trimmedLength === 1 ? "" : "s"}
            {trimmedLength < MIN_REPLY_LENGTH && ` (${MIN_REPLY_LENGTH} minimum)`}
          </p>
          <SubmitButton pendingLabel="Sending…">Reply to faculty</SubmitButton>
        </div>
      </form>
    </Card>
  );
}
