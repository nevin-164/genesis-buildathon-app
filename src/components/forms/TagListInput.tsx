"use client";

import { useState } from "react";

import { ApplicationField } from "@/components/application/ApplicationField";
import { CloseIcon } from "@/components/explore/explore-icons";
import { CONTROL, FOCUS_RING, INK, MOTION, MUTED } from "@/components/explore/explore-ui";
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

      <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
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
            "inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-[#dde5dc] px-4 text-sm font-semibold sm:min-h-0 sm:h-9",
            INK,
            "hover:bg-[#f4f8f5] disabled:cursor-not-allowed disabled:opacity-50",
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
              <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#dde5dc] bg-[#fafbf9] py-1 pl-3 pr-1 text-xs font-medium text-[#0f1812]">
                <span className="break-words">{value}</span>
                {!disabled && (
                  <button
                    type="button"
                    aria-label={`Remove ${value}`}
                    onClick={() => removeValue(value)}
                    className={cn(
                      "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-[#ecf8ee]",
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
        <p className={cn("mt-2 text-xs", MUTED)}>{emptyMessage}</p>
      )}
    </ApplicationField>
  );
}
