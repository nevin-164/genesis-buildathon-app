"use client";

import { useState, useTransition } from "react";

import {
  BTN_DANGER,
  BTN_PRIMARY,
  BTN_SECONDARY,
  BTN_WARNING,
  MUTED,
  NOTICE_DANGER,
  SECTION_TITLE,
} from "@/components/staff/staff-ui";
import { cn } from "@/lib/cn";
import type { ActionState } from "@/types/contracts";

const VARIANTS = {
  danger: BTN_DANGER,
  warning: BTN_WARNING,
  primary: BTN_PRIMARY,
} as const;

export type ConfirmVariant = keyof typeof VARIANTS;

/**
 * A destructive-ish action behind an in-page confirmation panel.
 *
 * Deliberately not window.confirm — a native dialog blocks the whole tab and
 * cannot be styled or tested.
 *
 * A refused action keeps the panel open and shows why. Some of these are
 * genuinely refusable — deactivating a faculty member who still advises a
 * class comes back with instructions rather than a silent no-op — and closing
 * the dialog on failure would look exactly like success.
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
  onConfirmAction: () => Promise<ActionState | void>;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className={VARIANTS[variant]}
      >
        {buttonText}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#050a07]/85 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md space-y-4 rounded-xl border border-[#26382d] bg-[#0d1611] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
            <h3 id="confirm-title" className={SECTION_TITLE}>
              {confirmTitle}
            </h3>
            <p className={cn("text-sm leading-relaxed", MUTED)}>{confirmMessage}</p>

            {error && (
              <p role="alert" className={NOTICE_DANGER}>
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => setOpen(false)}
                className={BTN_SECONDARY}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await onConfirmAction();
                    if (result && !result.ok) {
                      setError(result.message ?? "That did not work. Please try again.");
                      return;
                    }
                    setError(null);
                    setOpen(false);
                  })
                }
                className={VARIANTS[variant]}
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
