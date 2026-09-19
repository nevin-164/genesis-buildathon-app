"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import {
  BTN_DANGER,
  BTN_PRIMARY,
  BTN_SECONDARY,
  BTN_WARNING,
  CONTROL,
  EYEBROW,
  FAINT,
  INSET,
  LABEL,
  MUTED,
  PANEL_PADDED,
  SECTION_TITLE,
} from "@/components/staff/staff-ui";
import { cn } from "@/lib/cn";
import { initialActionState, type ActionState } from "@/types/contracts";

interface DecisionFormProps {
  /**
   * The Server Action this form posts to. A bare `<form method="POST">` never
   * reaches one — React has to own the submit for the action to run at all.
   */
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  itemId: string;
  idFieldName: "internshipId";
  primaryButtonText: string; // e.g. "Approve" or "Verify & publish"
  secondaryButtonText: string; // e.g. "Request clarification" or "Request changes"
  primaryActionValue: string; // e.g. "approve" or "verify"
  secondaryActionValue: string; // e.g. "request_clarification" or "request_changes"
  showVerificationCheckboxes?: boolean;
}

const CHECKS = [
  { name: "confirmIdentity", label: "This student really completed this internship" },
  { name: "confirmEvidence", label: "I have seen the completion certificate" },
  {
    name: "confirmNoPrivateInfo",
    label: "No private information (phone, address, ID numbers) is included",
  },
] as const;

export function DecisionForm({
  action,
  itemId,
  idFieldName,
  primaryButtonText,
  secondaryButtonText,
  primaryActionValue,
  secondaryActionValue,
  showVerificationCheckboxes = false,
}: DecisionFormProps) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const [reason, setReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRejectConfirmModal, setShowRejectConfirmModal] = useState(false);

  // Verification quality gate checkboxes
  const [confirmIdentity, setConfirmIdentity] = useState(false);
  const [confirmEvidence, setConfirmEvidence] = useState(false);
  const [confirmNoPrivateInfo, setConfirmNoPrivateInfo] = useState(false);

  /**
   * The modal closes here and nowhere else.
   *
   * "Confirm reject" is the form's submitter, and a submit button only submits
   * if it still has a form owner when the browser runs its activation
   * behaviour — which happens *after* the click handlers, and after React has
   * flushed the state they set. Closing the modal from that button's own
   * onClick therefore unmounts the submitter a moment too early: it is no
   * longer in the form, so the browser submits nothing, React never sees a
   * submit event, and the rejection is dropped without an error anywhere.
   *
   * So the modal stays mounted across the whole round trip and closes once the
   * action it started has settled. A success redirects and this never runs; a
   * failure lands back on the form with `state.message` on screen.
   */
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending) setShowRejectConfirmModal(false);
    wasPending.current = pending;
  }, [pending]);

  const checkState: Record<string, [boolean, (next: boolean) => void]> = {
    confirmIdentity: [confirmIdentity, setConfirmIdentity],
    confirmEvidence: [confirmEvidence, setConfirmEvidence],
    confirmNoPrivateInfo: [confirmNoPrivateInfo, setConfirmNoPrivateInfo],
  };

  const allCheckboxesTicked =
    !showVerificationCheckboxes ||
    (confirmIdentity && confirmEvidence && confirmNoPrivateInfo);

  /** The server's own verdict on the three boxes — first one wins, one line. */
  const checkboxError = CHECKS.map((check) => state.fieldErrors?.[check.name]).find(Boolean);

  const validateAction = (actionValue: string): boolean => {
    // Approve / Verify does not require reason, but verification requires checkboxes
    if (actionValue === primaryActionValue) {
      if (showVerificationCheckboxes && !allCheckboxesTicked) {
        setErrorMessage("You must confirm all three quality check boxes before verifying.");
        return false;
      }
      setErrorMessage(null);
      return true;
    }

    // Clarification/Changes or Reject require reason of at least 10 chars
    if (!reason || reason.trim().length < 10) {
      setErrorMessage(
        "A detailed reason (minimum 10 characters) is required when requesting changes, clarification, or rejecting.",
      );
      return false;
    }

    setErrorMessage(null);
    return true;
  };

  const handleButtonClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    actionValue: string,
  ) => {
    if (actionValue === "reject") {
      // Trigger confirmation modal for terminal action
      if (!reason || reason.trim().length < 10) {
        setErrorMessage("A detailed reason (minimum 10 characters) is required to reject.");
        e.preventDefault();
        return;
      }
      e.preventDefault();
      setShowRejectConfirmModal(true);
      return;
    }

    if (!validateAction(actionValue)) {
      e.preventDefault();
    }
  };

  return (
    <div className={PANEL_PADDED}>
      <form action={formAction} className="space-y-4">
        {/* Inside the form, not above it. These three are the only proof the
            server gets that the gate was passed — `verificationSchema` fails
            the whole `verify` action without them. A checkbox outside its form
            is submitted with nothing, so sitting one level up left every
            publish rejected as "Please fix the errors below", with the errors
            on controls the form was not sending. */}
        {showVerificationCheckboxes && (
          <div className={cn(INSET, "mb-6")}>
            <p className={EYEBROW}>Before publishing, confirm</p>

            <div className="mt-3 space-y-2.5">
              {CHECKS.map((check) => {
                const [checked, setChecked] = checkState[check.name];
                return (
                  <label
                    key={check.name}
                    className={cn(
                      "flex cursor-pointer items-start gap-2.5 text-sm",
                      checked ? "text-[#eaf2ec]" : MUTED,
                    )}
                  >
                    <input
                      type="checkbox"
                      name={check.name}
                      checked={checked}
                      onChange={(e) => setChecked(e.target.checked)}
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-[#26382d] bg-[#080e0b]",
                        "accent-[#c8ef5a] focus:ring-2 focus:ring-[#c8ef5a]/40 focus:ring-offset-0",
                      )}
                    />
                    <span>{check.label}</span>
                  </label>
                );
              })}
            </div>

            {!allCheckboxesTicked && (
              <p className="mt-3 text-xs font-semibold text-[#f5c563]">
                Check all three boxes above to unlock the &quot;{primaryButtonText}&quot; button.
              </p>
            )}

            {/* The client gate makes this unreachable in a working browser, so
                if it ever shows, the boxes stopped reaching the server again. */}
            {checkboxError && (
              <p className="mt-3 text-xs font-semibold text-[#f79393]">{checkboxError}</p>
            )}
          </div>
        )}

        <input type="hidden" name={idFieldName} value={itemId} />

        <div>
          <label htmlFor="decision-reason" className={LABEL}>
            Reason
          </label>
          <p className={cn("-mt-1 mb-1.5 text-xs", FAINT)}>
            Required to request clarification or changes, or to reject — minimum 10 characters.
          </p>
          <textarea
            id="decision-reason"
            name="reason"
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="Write clear instructions for the student…"
            className={CONTROL}
          />
          {(errorMessage ?? state.fieldErrors?.reason) && (
            <p className="mt-1.5 text-xs font-semibold text-[#f79393]">
              {errorMessage ?? state.fieldErrors?.reason}
            </p>
          )}
        </div>

        {showVerificationCheckboxes && (
          <p className={cn("text-xs font-medium italic", FAINT)}>
            Once verified, this becomes visible to every student on Explore.
          </p>
        )}

        {state.message && !state.ok && (
          <p className="text-sm font-semibold text-[#f79393]">{state.message}</p>
        )}

        <fieldset
          disabled={pending}
          className="flex flex-wrap items-center gap-3 border-t border-[#1b2a21] pt-5"
        >
          {/* Primary Action (Approve / Verify) */}
          <button
            type="submit"
            name="action"
            value={primaryActionValue}
            onClick={(e) => handleButtonClick(e, primaryActionValue)}
            disabled={pending || (showVerificationCheckboxes && !allCheckboxesTicked)}
            className={BTN_PRIMARY}
          >
            {primaryButtonText}
          </button>

          {/* Secondary Action (Request Clarification / Changes) */}
          <button
            type="submit"
            name="action"
            value={secondaryActionValue}
            onClick={(e) => handleButtonClick(e, secondaryActionValue)}
            className={BTN_WARNING}
          >
            {secondaryButtonText}
          </button>

          {/* Reject Action */}
          <button
            type="submit"
            name="action"
            value="reject"
            onClick={(e) => handleButtonClick(e, "reject")}
            className={cn(BTN_DANGER, "ml-auto")}
          >
            Reject
          </button>
        </fieldset>

        {/* Rejection Confirmation Dialog Modal */}
        {showRejectConfirmModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#050a07]/85 p-4 backdrop-blur-sm"
          >
            <div className="w-full max-w-md rounded-xl border border-[#26382d] bg-[#0d1611] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
              <h3 id="reject-title" className={SECTION_TITLE}>
                Confirm rejection
              </h3>
              <p className={cn("mt-2 text-sm leading-relaxed", MUTED)}>
                Are you sure you want to reject this submission? This action is
                terminal and cannot be undone by the student.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRejectConfirmModal(false)}
                  disabled={pending}
                  className={BTN_SECONDARY}
                >
                  Cancel
                </button>
                {/* No onClick: see the effect above — anything that unmounts
                    this button mid-click throws the submission away. Disabling
                    it is safe, because `pending` only turns true once React is
                    already handling the submit event. */}
                <button
                  type="submit"
                  name="action"
                  value="reject"
                  disabled={pending}
                  className={BTN_DANGER}
                >
                  {pending ? "Rejecting…" : "Confirm reject"}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
