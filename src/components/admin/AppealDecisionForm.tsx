"use client";

import { useActionState, useState } from "react";

import {
  BTN_DANGER,
  BTN_PRIMARY,
  CONTROL,
  EYEBROW,
  FAINT,
  INSET,
  LABEL,
  MUTED,
  PANEL_PADDED,
} from "@/components/staff/staff-ui";
import { cn } from "@/lib/cn";
import { DECISION_MIN } from "@/lib/validators/appeal.schema";
import { initialActionState, type ActionState } from "@/types/contracts";

/**
 * The administrator's ruling on one appeal.
 *
 * Two buttons and no third, because there is no third outcome — sending it back
 * to the advisor who already answered is a loop with no new information in it.
 *
 * Deliberately NOT the faculty `DecisionForm` with different labels. That form
 * is built around one primary action plus two ways of sending work back; this
 * is a binary verdict where one branch publishes over a colleague's decision.
 * Sharing the component would have meant a third and fourth optional prop
 * switching behaviour on, which is how one form ends up serving neither screen.
 */
export function AppealDecisionForm({
  internshipId,
  action,
  advisorName,
}: {
  internshipId: string;
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  /** Named in the confirmations, so the reader knows whom they are overruling. */
  advisorName: string | null;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const [reason, setReason] = useState("");
  const [confirmEvidence, setConfirmEvidence] = useState(false);
  const [confirmAdvisorConsidered, setConfirmAdvisorConsidered] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  const checks = [
    {
      name: "confirmEvidence",
      label: "I have opened the attached documents myself",
      checked: confirmEvidence,
      set: setConfirmEvidence,
    },
    {
      name: "confirmAdvisorConsidered",
      label: advisorName
        ? `I have considered ${advisorName}'s reason for rejecting it`
        : "I have considered the advisor's reason for rejecting it",
      checked: confirmAdvisorConsidered,
      set: setConfirmAdvisorConsidered,
    },
  ] as const;

  const reasonReady = reason.trim().length >= DECISION_MIN;
  const confirmationsReady = confirmEvidence && confirmAdvisorConsidered;

  /** The server's own verdict on the boxes — first one wins, one line. */
  const checkboxError =
    state.fieldErrors?.confirmEvidence ?? state.fieldErrors?.confirmAdvisorConsidered;

  /**
   * Both rulings need words. This is the one place the appeal form is stricter
   * than the faculty one, where `verify` needs none: an administrator is either
   * overruling a colleague or refusing a student, and both are decisions
   * somebody will ask about later.
   */
  function guard(event: React.MouseEvent<HTMLButtonElement>) {
    if (reasonReady) {
      setClientError(null);
      return;
    }
    event.preventDefault();
    setClientError(
      `Write your reasoning first — at least ${DECISION_MIN} characters. The student and their advisor both read it.`,
    );
  }

  return (
    <div className={PANEL_PADDED}>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="internshipId" value={internshipId} />

        {/* Inside the form, not above it. A checkbox outside its form is
            submitted with nothing, and `appealDecisionSchema` fails the whole
            overturn without them. */}
        <div className={INSET}>
          <p className={EYEBROW}>Before overturning, confirm</p>

          <div className="mt-3 space-y-2.5">
            {checks.map((check) => (
              <label
                key={check.name}
                className={cn(
                  "flex cursor-pointer items-start gap-2.5 text-sm",
                  check.checked ? "text-[#eaf2ec]" : MUTED,
                )}
              >
                <input
                  type="checkbox"
                  name={check.name}
                  checked={check.checked}
                  onChange={(event) => check.set(event.target.checked)}
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-[#26382d] bg-[#080e0b]",
                    "accent-[#c8ef5a] focus:ring-2 focus:ring-[#c8ef5a]/40 focus:ring-offset-0",
                  )}
                />
                <span>{check.label}</span>
              </label>
            ))}
          </div>

          <p className={cn("mt-3 text-xs leading-relaxed", FAINT)}>
            Upholding the rejection needs neither box — only the reason. These two
            are the gate on publishing a card the advisor said should not be
            published.
          </p>

          {checkboxError && (
            <p className="mt-3 text-xs font-semibold text-[#f79393]">{checkboxError}</p>
          )}
        </div>

        <div>
          <label htmlFor="appeal-reason" className={LABEL}>
            Your reasoning
          </label>
          <p className={cn("-mt-1 mb-1.5 text-xs", FAINT)}>
            Required either way, and both the student and their advisor read it.
            Minimum {DECISION_MIN} characters.
          </p>
          <textarea
            id="appeal-reason"
            name="reason"
            rows={4}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              if (clientError) setClientError(null);
            }}
            placeholder="The certificate attached with the appeal answers the reason for the rejection…"
            className={CONTROL}
          />
          {(clientError ?? state.fieldErrors?.reason) && (
            <p className="mt-1.5 text-xs font-semibold text-[#f79393]">
              {clientError ?? state.fieldErrors?.reason}
            </p>
          )}
        </div>

        {state.message && !state.ok && (
          <p className="text-sm font-semibold text-[#f79393]">{state.message}</p>
        )}

        <fieldset
          disabled={pending}
          className="flex flex-wrap items-center gap-3 border-t border-[#1b2a21] pt-5"
        >
          <button
            type="submit"
            name="decision"
            value="overturn"
            onClick={guard}
            disabled={pending || !confirmationsReady}
            className={BTN_PRIMARY}
          >
            Overturn and publish
          </button>

          <button
            type="submit"
            name="decision"
            value="uphold"
            onClick={guard}
            className={cn(BTN_DANGER, "ml-auto")}
          >
            Uphold the rejection
          </button>
        </fieldset>

        <p className={cn("text-xs leading-relaxed italic", FAINT)}>
          Overturning publishes this internship on Explore immediately and records
          you as the verifier. Upholding is final — the student has no second
          appeal.
        </p>
      </form>
    </div>
  );
}
