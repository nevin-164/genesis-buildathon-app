"use client";

import { useState } from "react";

interface ConfirmButtonProps {
  buttonText: string;
  confirmTitle: string;
  confirmMessage: string;
  onConfirmAction: () => void | Promise<void>;
  variant?: "danger" | "warning" | "primary";
  disabled?: boolean;
}

export function ConfirmButton({
  buttonText,
  confirmTitle,
  confirmMessage,
  onConfirmAction,
  variant = "danger",
  disabled = false,
}: ConfirmButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleConfirm = async () => {
    setIsPending(true);
    try {
      await onConfirmAction();
    } finally {
      setIsPending(false);
      setIsOpen(false);
    }
  };

  const buttonClasses =
    variant === "danger"
      ? "bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-800"
      : variant === "warning"
      ? "bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-800"
      : "bg-blue-600 hover:bg-blue-500 text-white";

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${buttonClasses} disabled:opacity-50`}
      >
        {buttonText}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">{confirmTitle}</h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
              {confirmMessage}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirm}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                {isPending ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
