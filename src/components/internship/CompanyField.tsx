"use client";

import { useEffect, useId, useState } from "react";

import { searchCompaniesAction } from "@/app/(app)/student/internships/actions";
import { CONTROL } from "@/components/explore/explore-ui";
import { Field } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { CompanyOption } from "@/types/contracts";

/**
 * The company box: free text, with suggestions.
 *
 * It is deliberately not a closed dropdown. A student can be the first person
 * in the college to intern somewhere, and a picker that only offers what is
 * already recorded would make that unrecordable. The suggestions exist so the
 * common employers are spelled the same way — the server resolves the typed
 * name case-insensitively, so "Zoho" and "zoho" land on one row rather than
 * splitting the same company across Explore.
 *
 * A native `<datalist>` rather than a hand-rolled popover: it gets keyboard
 * behaviour, mobile behaviour and screen-reader behaviour for free, and it
 * cannot trap focus.
 */
export function CompanyField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const listId = useId();
  const [suggestions, setSuggestions] = useState<CompanyOption[]>([]);

  useEffect(() => {
    const query = value.trim();

    // Debounced, and every in-flight result is dropped if the box moved on —
    // without the flag a slow early request can overwrite a newer one. Both
    // branches sit inside the timer rather than in the effect body, so a
    // keystroke never triggers a synchronous cascading render.
    let current = true;
    const timer = setTimeout(() => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }
      searchCompaniesAction(query).then((results) => {
        if (current) setSuggestions(results);
      });
    }, 250);

    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [value]);

  return (
    <Field
      label="Company"
      htmlFor="companyName"
      required
      error={error}
      hint="Pick a suggestion if the company is already listed."
    >
      <input
        id="companyName"
        name="companyName"
        list={listId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
        maxLength={200}
        placeholder="e.g. Zoho Corporation"
        aria-invalid={error ? true : undefined}
        className={cn(CONTROL, "h-10", error && "border-red-500")}
      />
      <datalist id={listId}>
        {suggestions.map((company) => (
          <option key={company.id} value={company.name}>
            {company.location ?? ""}
          </option>
        ))}
      </datalist>
    </Field>
  );
}
