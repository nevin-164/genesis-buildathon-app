"use client";

import { useState } from "react";

interface DecisionFormProps {
  actionUrl: string;
  itemId: string;
  idFieldName: "applicationId" | "experienceId";
  primaryButtonText: string; // e.g. "Approve" or "Verify & publish"
  secondaryButtonText: string; // e.g. "Request clarification" or "Request changes"
  primaryActionValue: string; // e.g. "approve" or "verify"
  secondaryActionValue: string; // e.g. "request_clarification" or "request_changes"
  showVerificationCheckboxes?: boolean;
  onActionSubmit?: (formData: FormData) => void;
}

export function DecisionForm({
  itemId,
  idFieldName,
  primaryButtonText,
  secondaryButtonText,
  primaryActionValue,
  secondaryActionValue,
  showVerificationCheckboxes = false,
}: DecisionFormProps) {
  const [reason, setReason] = useState("");
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRejectConfirmModal, setShowRejectConfirmModal] = useState(false);

  // Verification quality gate checkboxes
  const [confirmIdentity, setConfirmIdentity] = useState(false);
  const [confirmEvidence, setConfirmEvidence] = useState(false);
  const [confirmNoPrivateInfo, setConfirmNoPrivateInfo] = useState(false);

  const allCheckboxesTicked =
    !showVerificationCheckboxes ||
    (confirmIdentity && confirmEvidence && confirmNoPrivateInfo);

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
      setErrorMessage("A detailed reason (minimum 10 characters) is required when requesting changes, clarification, or rejecting.");
      return false;
    }

    setErrorMessage(null);
    return true;
  };

  const handleButtonClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    actionValue: string
  ) => {
    setSelectedAction(actionValue);

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
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      {showVerificationCheckboxes && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Before publishing, confirm:
          </p>
          <div className="space-y-2.5">
            <label className="flex items-center gap-2.5 text-sm text-slate-800 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                name="confirmIdentity"
                checked={confirmIdentity}
                onChange={(e) => setConfirmIdentity(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>This student really completed this internship</span>
            </label>
            <label className="flex items-center gap-2.5 text-sm text-slate-800 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                name="confirmEvidence"
                checked={confirmEvidence}
                onChange={(e) => setConfirmEvidence(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>I have seen the completion certificate</span>
            </label>
            <label className="flex items-center gap-2.5 text-sm text-slate-800 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                name="confirmNoPrivateInfo"
                checked={confirmNoPrivateInfo}
                onChange={(e) => setConfirmNoPrivateInfo(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>No private information (phone, address, ID numbers) is included</span>
            </label>
          </div>
          {!allCheckboxesTicked && (
            <p className="mt-3 text-xs font-medium text-amber-700 dark:text-amber-400">
              Check all three boxes above to unlock the &quot;{primaryButtonText}&quot; button.
            </p>
          )}
        </div>
      )}

      <form method="POST" className="space-y-4">
        <input type="hidden" name={idFieldName} value={itemId} />

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Reason <span className="font-normal text-slate-400 dark:text-slate-500">(required to request clarification/changes or reject — min 10 chars)</span>
          </label>
          <textarea
            name="reason"
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="Write clear instructions for the student..."
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
          />
          {errorMessage && (
            <p className="mt-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
              {errorMessage}
            </p>
          )}
        </div>

        {showVerificationCheckboxes && (
          <p className="text-xs font-medium italic text-slate-500 dark:text-slate-400">
            Once verified, this becomes visible to every student on Explore.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Primary Action (Approve / Verify) */}
          <button
            type="submit"
            name="action"
            value={primaryActionValue}
            onClick={(e) => handleButtonClick(e, primaryActionValue)}
            disabled={showVerificationCheckboxes && !allCheckboxesTicked}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            {primaryButtonText}
          </button>

          {/* Secondary Action (Request Clarification / Changes) */}
          <button
            type="submit"
            name="action"
            value={secondaryActionValue}
            onClick={(e) => handleButtonClick(e, secondaryActionValue)}
            className="rounded-lg border border-amber-300 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-900/60"
          >
            {secondaryButtonText}
          </button>

          {/* Reject Action */}
          <button
            type="submit"
            name="action"
            value="reject"
            onClick={(e) => handleButtonClick(e, "reject")}
            className="rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800"
          >
            Reject
          </button>
        </div>

        {/* Rejection Confirmation Dialog Modal */}
        {showRejectConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900 dark:border dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Confirm Rejection
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Are you sure you want to reject this submission? This action is terminal and cannot be undone by the student.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRejectConfirmModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  name="action"
                  value="reject"
                  onClick={() => setShowRejectConfirmModal(false)}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
