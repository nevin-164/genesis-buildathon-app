"use client";

import { useState, useTransition } from "react";

const VARIANTS = {
  danger: "bg-red-600 hover:bg-red-500 text-white",
  warning: "bg-amber-600 hover:bg-amber-500 text-white",
  primary: "bg-blue-600 hover:bg-blue-500 text-white",
} as const;

export type ConfirmVariant = keyof typeof VARIANTS;

/**
 * A destructive-ish action behind an in-page confirmation panel.
 *
 * Deliberately not window.confirm — a native dialog blocks the whole tab and
 * cannot be styled or tested.
 */
export function ConfirmButton({
  buttonText,
  confirmTitle,
  confirmMessage,
  confirmLabel = "Yes, continue",
  variant = "danger",
  onConfirmAction,
}: {
  buttonText: string;
  confirmTitle: string;
  confirmMessage: string;
  confirmLabel?: string;
  variant?: ConfirmVariant;
  onConfirmAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors cursor-pointer shadow-sm whitespace-nowrap ${VARIANTS[variant]}`}
      >
        {buttonText}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-xl space-y-4">
            <h3 id="confirm-title" className="text-lg font-bold text-white">
              {confirmTitle}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {confirmMessage}
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => setOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-medium text-sm rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await onConfirmAction();
                    setOpen(false);
                  })
                }
                className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]}`}
              >
                {pending ? "Working…" : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
