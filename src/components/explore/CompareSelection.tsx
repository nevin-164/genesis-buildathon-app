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

  SURFACE_ATTENTION,

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

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.getElementById("compare-results")?.scrollIntoView({

      behavior: prefersReducedMotion ? "auto" : "smooth",

    });

  }



  return (

    <section

      aria-labelledby="compare-selection-heading"

      className="min-w-0 rounded-xl border border-[var(--il-border)] bg-[var(--il-ivory)] p-4 sm:p-5"

    >

      <div className="min-w-0">

        <h2 id="compare-selection-heading" className="text-sm font-semibold text-[var(--il-ink)]">

          Choose experiences to compare

        </h2>

        <p className={cn("mt-1.5 max-w-prose text-sm leading-relaxed", MUTED)}>

          Pick two verified Reality Cards to compare side by side. Add a third only if you want a

          broader view.

        </p>

      </div>



      <div

        role="status"

        aria-live="polite"

        className={cn(

          "mt-3 rounded-lg border px-3 py-2 text-sm",

          validationMessage

            ? cn(SURFACE_ATTENTION, "text-[var(--il-ink)]")

            : "sr-only",

        )}

      >

        {validationMessage}

      </div>



      <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">

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

                  className={cn(CONTROL, "min-w-0 flex-1 text-sm", MOTION, FOCUS_RING)}

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

                      "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--il-border)]",

                      "text-[var(--il-muted)] hover:border-[color-mix(in_srgb,var(--il-leaf)_40%,var(--il-border))] hover:bg-[color-mix(in_srgb,var(--il-lime)_8%,var(--il-white))] hover:text-[var(--il-moss)]",

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



      <div className="mt-4 flex flex-col gap-3 border-t border-[var(--il-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">

        <p className={cn(MUTED, "text-xs font-medium")}>

          {selectedCount === 0

            ? "No experiences selected yet."

            : selectedCount === 1

              ? "One selected — choose one more to compare."

              : `${selectedCount} selected.`}

        </p>

        <button

          type="button"

          onClick={handleCompareClick}

          disabled={isPending || !canCompare}

          className={cn(

            BTN_PRIMARY,

            "inline-flex min-h-11 w-full items-center justify-center px-6 sm:w-auto",

            MOTION,

            FOCUS_RING,

          )}

        >

          {isPending ? "Updating…" : "Compare selected"}

        </button>

      </div>

    </section>

  );

}
