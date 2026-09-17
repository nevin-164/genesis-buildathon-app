"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { cn } from "@/lib/cn";
import type { ExploreCard } from "@/types/contracts";

import {
  buildCompareQueryString,
  getActiveCompareIds,
  hasDuplicateSelections,
  labelForOption,
  type CompareUrlState,
} from "./compare-params";
import { CloseIcon } from "./explore-icons";
import {
  BTN_PRIMARY,
  CONTROL,
  FOCUS_RING,
  LABEL,
  MOTION,
  MUTED,
  PANEL,
  SECTION_HEADING,
} from "./explore-ui";

type SlotKey = "id1" | "id2" | "id3";

const SLOTS: { key: SlotKey; label: string; required: boolean }[] = [
  { key: "id1", label: "First experience", required: true },
  { key: "id2", label: "Second experience", required: true },
  { key: "id3", label: "Third experience (optional)", required: false },
];

export function CompareSelection({
  options,
  state,
}: {
  options: ExploreCard[];
  state: CompareUrlState;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const selectedCount = getActiveCompareIds(state).length;
  const canCompare = selectedCount >= 2 && !hasDuplicateSelections(state);

  function idsTakenByOtherSlots(slot: SlotKey): Set<string> {
    const taken = new Set<string>();
    for (const { key } of SLOTS) {
      if (key !== slot && state[key]) taken.add(state[key]);
    }
    return taken;
  }

  function updateSlot(slot: SlotKey, value: string) {
    const next: CompareUrlState = { ...state, [slot]: value };

    if (value) {
      const otherSlots = idsTakenByOtherSlots(slot);
      if (otherSlots.has(value)) {
        setValidationMessage("Each experience can only be selected once.");
        return;
      }
    }

    setValidationMessage(null);
    startTransition(() => {
      router.push(`/student/explore/compare${buildCompareQueryString(next)}`);
    });
  }

  function clearSlot(slot: SlotKey) {
    updateSlot(slot, "");
  }

  function handleCompareClick() {
    if (!canCompare) {
      setValidationMessage("Select at least two different experiences to compare.");
      return;
    }
    setValidationMessage(null);
    document.getElementById("compare-results")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section
      className={cn(PANEL, "min-w-0 p-4 sm:p-5")}
      aria-labelledby="compare-selection-heading"
    >
      <h2 id="compare-selection-heading" className={SECTION_HEADING}>
        Choose experiences
      </h2>
      <p className={cn("mt-1.5 text-sm leading-relaxed", MUTED)}>
        Pick two verified Reality Cards to compare side by side. Add a third only if
        you want a broader view.
      </p>

      <div
        role="status"
        aria-live="polite"
        className={cn(
          "mt-3 rounded-lg border px-3 py-2 text-sm",
          validationMessage
            ? "border-amber-200/80 bg-amber-50/70 text-amber-950"
            : "sr-only",
        )}
      >
        {validationMessage}
      </div>

      <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SLOTS.map(({ key, label, required }) => {
          const taken = idsTakenByOtherSlots(key);
          const selected = state[key];

          return (
            <div key={key} className="min-w-0">
              <label htmlFor={`compare-${key}`} className={LABEL}>
                {label}
                {required ? " (required)" : ""}
              </label>
              <div className="flex min-w-0 gap-2">
                <select
                  id={`compare-${key}`}
                  name={key}
                  value={selected}
                  disabled={isPending}
                  onChange={(event) => updateSlot(key, event.target.value)}
                  aria-label={label}
                  className={cn(CONTROL, "min-w-0 flex-1", MOTION, FOCUS_RING)}
                >
                  <option value="">Select an experience…</option>
                  {options.map((option) => (
                    <option
                      key={option.id}
                      value={option.id}
                      disabled={taken.has(option.id)}
                    >
                      {labelForOption(option)}
                    </option>
                  ))}
                </select>
                {selected && (
                  <button
                    type="button"
                    onClick={() => clearSlot(key)}
                    disabled={isPending}
                    aria-label={`Remove ${label.toLowerCase()}`}
                    className={cn(
                      "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#dde5dc]",
                      "text-[#8a968d] hover:bg-[#ecf8ee] hover:text-[#3d5210]",
                      MOTION,
                      FOCUS_RING,
                    )}
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleCompareClick}
          disabled={isPending || !canCompare}
          className={cn(
            BTN_PRIMARY,
            "inline-flex min-h-11 w-full items-center justify-center px-5 py-2.5 sm:w-auto",
            MOTION,
            FOCUS_RING,
          )}
        >
          {isPending ? "Updating…" : "Compare selected"}
        </button>
        <p className={cn("text-xs", MUTED)}>
          {selectedCount === 0
            ? "No experiences selected yet."
            : selectedCount === 1
              ? "One selected — choose one more to compare."
              : `${selectedCount} selected.`}
        </p>
      </div>
    </section>
  );
}
