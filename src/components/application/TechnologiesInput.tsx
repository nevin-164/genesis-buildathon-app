"use client";

import { useState } from "react";

import { ApplicationField } from "@/components/application/ApplicationField";
import { CloseIcon } from "@/components/explore/explore-icons";
import { CONTROL, FOCUS_RING, INK, MOTION, MUTED } from "@/components/explore/explore-ui";
import { cn } from "@/lib/cn";

export function TechnologiesInput({
  initialValues,
  error,
  disabled = false,
}: {
  initialValues: string[];
  error?: string;
  disabled?: boolean;
}) {
  const [values, setValues] = useState<string[]>(initialValues);
  const [draft, setDraft] = useState("");

  function addTechnology(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const exists = values.some(
      (value) => value.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exists) {
      setDraft("");
      return;
    }
    setValues((current) => [...current, trimmed]);
    setDraft("");
  }

  function removeTechnology(value: string) {
    setValues((current) => current.filter((entry) => entry !== value));
  }

  return (
    <ApplicationField
      label="Technologies and tools"
      htmlFor="technology-draft"
      required
      error={error}
      hint="Press Enter or Add after each technology. Duplicates are ignored."
      className="sm:col-span-2"
    >
      <input type="hidden" name="technologies" value={JSON.stringify(values)} />

      <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
        <input
          id="technology-draft"
          type="text"
          value={draft}
          disabled={disabled}
          placeholder="e.g. React, Python, Figma"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTechnology(draft);
            }
          }}
          className={cn(CONTROL, MOTION, FOCUS_RING, error && "border-red-400")}
        />
        <button
          type="button"
          disabled={disabled || !draft.trim()}
          onClick={() => addTechnology(draft)}
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
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Selected technologies">
          {values.map((value) => (
            <li key={value}>
              <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#dde5dc] bg-[#fafbf9] py-1 pl-3 pr-1 text-xs font-medium text-[#0f1812]">
                <span className="break-words">{value}</span>
                {!disabled && (
                  <button
                    type="button"
                    aria-label={`Remove ${value}`}
                    onClick={() => removeTechnology(value)}
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
        <p className={cn("mt-2 text-xs", MUTED)}>No technologies added yet.</p>
      )}
    </ApplicationField>
  );
}
