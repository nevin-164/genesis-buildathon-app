"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";

import {
  createCompanyIfMissingAction,
  searchCompaniesAction,
} from "@/app/(app)/student/application/actions";
import { ApplicationField } from "@/components/application/ApplicationField";
import { CONTROL, FOCUS_RING, INK, MOTION, MUTED, PANEL } from "@/components/explore/explore-ui";
import { cn } from "@/lib/cn";
import type { CompanyOption } from "@/types/contracts";

type CompanyAutocompleteProps = {
  initialCompanyId: string;
  initialCompanyName: string;
  error?: string;
  disabled?: boolean;
  onSelectedChange?: (company: { id: string; name: string } | null) => void;
};

export function CompanyAutocomplete({
  initialCompanyId,
  initialCompanyName,
  error,
  disabled = false,
  onSelectedChange,
}: CompanyAutocompleteProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(initialCompanyName);
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(
    initialCompanyId
      ? { id: initialCompanyId, name: initialCompanyName }
      : null,
  );
  const [results, setResults] = useState<CompanyOption[]>([]);
  const [open, setOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSearching, startSearch] = useTransition();
  const [isCreating, startCreate] = useTransition();

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (disabled) return;

    const trimmed = query.trim();
    if (selected && trimmed === selected.name) {
      setResults([]);
      return;
    }

    const timer = window.setTimeout(() => {
      startSearch(async () => {
        const companies = await searchCompaniesAction(trimmed);
        setResults(companies);
        setOpen(true);
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query, selected, disabled]);

  function selectCompany(company: CompanyOption) {
    if (selected?.id === company.id) {
      setStatusMessage("This company is already selected.");
      setOpen(false);
      return;
    }

    setSelected({ id: company.id, name: company.name });
    setQuery(company.name);
    setStatusMessage(null);
    setOpen(false);
    onSelectedChange?.({ id: company.id, name: company.name });
  }

  function clearSelection() {
    setSelected(null);
    setQuery("");
    setResults([]);
    setStatusMessage(null);
    onSelectedChange?.(null);
  }

  function handleCreateCompany() {
    const trimmed = query.trim();
    if (!trimmed) return;

    const exactMatch = results.find(
      (company) => company.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exactMatch) {
      selectCompany(exactMatch);
      setStatusMessage("Matched an existing company instead of creating a duplicate.");
      return;
    }

    startCreate(async () => {
      const created = await createCompanyIfMissingAction(trimmed);
      if (selected?.id === created.id) {
        setStatusMessage("This company is already selected.");
        return;
      }
      selectCompany(created);
    });
  }

  const trimmedQuery = query.trim();
  const showCreateOption =
    trimmedQuery.length > 0 &&
    !results.some((company) => company.name.toLowerCase() === trimmedQuery.toLowerCase());

  return (
    <ApplicationField
      label="Company"
      htmlFor="company-search"
      required
      error={error}
      hint="Search for your internship company. Add a new name only if it is not listed."
    >
      <input type="hidden" name="companyId" value={selected?.id ?? ""} />

      <div ref={rootRef} className="relative min-w-0">
        <div className="flex min-w-0 gap-2">
          <input
            id="company-search"
            type="search"
            value={query}
            autoComplete="organization"
            disabled={disabled}
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-describedby={statusMessage ? "company-status" : undefined}
            onChange={(event) => {
              setQuery(event.target.value);
              if (selected && event.target.value !== selected.name) {
                setSelected(null);
                onSelectedChange?.(null);
              }
              setStatusMessage(null);
            }}
            onFocus={() => {
              if (results.length > 0) setOpen(true);
            }}
            placeholder="Start typing a company name…"
            className={cn(CONTROL, MOTION, FOCUS_RING, error && "border-red-400")}
          />
          {selected && !disabled && (
            <button
              type="button"
              onClick={clearSelection}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center rounded-lg border border-[#dde5dc] px-3 text-xs font-semibold sm:min-h-0 sm:h-9",
                INK,
                "hover:bg-[#f4f8f5]",
                FOCUS_RING,
                MOTION,
              )}
            >
              Clear
            </button>
          )}
        </div>

        {open && !disabled && (
          <div
            id={listboxId}
            role="listbox"
            aria-label="Company suggestions"
            className={cn(
              PANEL,
              "absolute z-20 mt-1 max-h-60 w-full overflow-y-auto p-1 shadow-lg",
            )}
          >
            {isSearching && (
              <p className={cn("px-3 py-2 text-xs", MUTED)}>Searching companies…</p>
            )}

            {!isSearching && results.length === 0 && !showCreateOption && (
              <p className={cn("px-3 py-2 text-xs", MUTED)}>No companies found.</p>
            )}

            {results.map((company) => (
              <button
                key={company.id}
                type="button"
                role="option"
                aria-selected={selected?.id === company.id}
                disabled={selected?.id === company.id}
                onClick={() => selectCompany(company)}
                className={cn(
                  "flex w-full min-w-0 flex-col rounded-lg px-3 py-2 text-left",
                  "hover:bg-[#f4f8f5]",
                  selected?.id === company.id && "cursor-not-allowed opacity-60",
                  FOCUS_RING,
                  MOTION,
                )}
              >
                <span className={cn("text-sm font-medium break-words", INK)}>{company.name}</span>
                {company.location && (
                  <span className={cn("text-xs break-words", MUTED)}>{company.location}</span>
                )}
              </button>
            ))}

            {showCreateOption && (
              <button
                type="button"
                onClick={handleCreateCompany}
                disabled={isCreating}
                className={cn(
                  "mt-1 flex w-full min-w-0 items-center rounded-lg border border-dashed border-[#cdd8cf] px-3 py-2 text-left",
                  "hover:border-[#b8d4bc] hover:bg-[#f4f8f5]",
                  FOCUS_RING,
                  MOTION,
                )}
              >
                <span className={cn("text-sm font-semibold break-words", INK)}>
                  {isCreating ? "Adding company…" : `Add “${trimmedQuery}” as a new company`}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {statusMessage && (
        <p id="company-status" className={cn("text-xs", MUTED)} role="status">
          {statusMessage}
        </p>
      )}
    </ApplicationField>
  );
}
