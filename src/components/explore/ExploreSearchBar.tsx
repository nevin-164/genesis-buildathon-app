"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { cn } from "@/lib/cn";

import { CloseIcon, SearchIcon } from "./explore-icons";
import { buildExploreQueryString, type ExploreUrlState } from "./explore-params";
import { BTN_PRIMARY, FOCUS_RING, INK, MOTION, PANEL } from "./explore-ui";

export function ExploreSearchBar({ state }: { state: ExploreUrlState }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(state.q);

  function navigate(next: ExploreUrlState) {
    startTransition(() => {
      router.push(`/student/explore${buildExploreQueryString(next)}`);
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate({ ...state, q: q.trim(), page: 1 });
  }

  function clearSearch() {
    setQ("");
    navigate({ ...state, q: "", page: 1 });
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Search internship experiences"
      className={cn(PANEL, "p-1.5 sm:p-2")}
    >
      <label htmlFor="explore-search" className="sr-only">
        Search by company, role or domain
      </label>
      <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-stretch">
        <div
          className={cn(
            "relative flex min-w-0 flex-1 items-center rounded-lg border border-[#dde5dc] bg-[#fafbf9]",
            "focus-within:border-[#9eb89e] focus-within:ring-2 focus-within:ring-[#c8ef5a]/35",
            MOTION,
          )}
        >
          <SearchIcon className={cn("pointer-events-none absolute left-3 shrink-0 text-[#8a968d]")} />
          <input
            id="explore-search"
            name="q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by company, role or domain"
            autoComplete="off"
            className={cn(
              "min-w-0 flex-1 border-0 bg-transparent py-2.5 pl-10 text-sm font-medium",
              INK,
              "placeholder:font-normal placeholder:text-[#8a968d] focus:outline-none",
              q ? "pr-10" : "pr-3",
            )}
          />
          {q && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className={cn(
                "absolute right-1.5 flex h-9 w-9 items-center justify-center rounded-md sm:right-2 sm:h-7 sm:w-7",
                "text-[#8a968d] hover:bg-[#ecf8ee] hover:text-[#3d5210]",
                MOTION,
                FOCUS_RING,
              )}
            >
              <CloseIcon />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={isPending}
          className={cn(BTN_PRIMARY, "w-full sm:w-auto", MOTION, FOCUS_RING)}
        >
          {isPending ? "Searching…" : "Search"}
        </button>
      </div>
    </form>
  );
}
