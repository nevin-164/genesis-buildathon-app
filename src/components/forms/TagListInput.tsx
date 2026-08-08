"use client";

import { useState } from "react";

import { ApplicationField } from "@/components/application/ApplicationField";
import { CloseIcon } from "@/components/explore/explore-icons";
import {
  BTN_SECONDARY,
  CHIP_ACTIVE,
  CONTROL,
  FOCUS_RING,
  MOTION,
  MUTED,
} from "@/components/student/student-ui";
import { cn } from "@/lib/cn";

export function TagListInput({
  name,
  label,
  htmlFor,
  initialValues,
  error,
  disabled = false,
  required = false,
  hint,
  placeholder = "Add an item and press Enter",
  emptyMessage = "No items added yet.",
  className,
}: {
  name: string;
  label: string;
  htmlFor: string;
  initialValues: string[];
  error?: string;
  disabled?: boolean;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}) {
  const [values, setValues] = useState<string[]>(initialValues);
  const [draft, setDraft] = useState("");

  function addValue(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (values.some((value) => value.toLowerCase() === trimmed.toLowerCase())) {
      setDraft("");
      return;
    }
    setValues((current) => [...current, trimmed]);
    setDraft("");
  }

  function removeValue(value: string) {
    setValues((current) => current.filter((entry) => entry !== value));
  }

  return (
    <ApplicationField
      label={label}
      htmlFor={htmlFor}
      required={required}
      error={error}
      hint={hint}
      className={className}
    >
      <input type="hidden" name={name} value={JSON.stringify(values)} />

      <div className="flex min-w-0 flex-col gap-2 border-b border-[var(--il-border)] pb-4 sm:flex-row">
        <input
          id={htmlFor}
          type="text"
          value={draft}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addValue(draft);
            }
          }}
          className={cn(CONTROL, MOTION, FOCUS_RING, error && "border-red-400")}
        />
        <button
          type="button"
          disabled={disabled || !draft.trim()}
          onClick={() => addValue(draft)}
          className={cn(
            BTN_SECONDARY,
            "min-h-11 shrink-0 px-4 sm:min-h-0 sm:h-11",
            "disabled:cursor-not-allowed disabled:opacity-50",
            FOCUS_RING,
            MOTION,
          )}
        >
          Add
        </button>
      </div>

      {values.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label={label}>
          {values.map((value) => (
            <li key={value}>
              <span
                className={cn(
                  "inline-flex max-w-full items-center gap-1 rounded-lg border py-1 pl-3 pr-1 text-xs font-semibold",
                  CHIP_ACTIVE,
                )}
              >
                <span className="break-words">{value}</span>
                {!disabled && (
                  <button
                    type="button"
                    aria-label={`Remove ${value}`}
                    onClick={() => removeValue(value)}
                    className={cn(
                      "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-[color-mix(in_srgb,var(--il-lime)_25%,transparent)]",
                      FOCUS_RING,
                    )}
                  >
                    <CloseIcon />
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={cn("mt-3 text-xs italic", MUTED)}>{emptyMessage}</p>
      )}
    </ApplicationField>
  );
}
