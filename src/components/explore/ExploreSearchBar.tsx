"use client";



import { useRouter } from "next/navigation";

import { useState, useTransition, type FormEvent } from "react";



import { cn } from "@/lib/cn";



import { CloseIcon, SearchIcon } from "./explore-icons";

import { buildExploreQueryString, type ExploreUrlState } from "./explore-params";

import {

  BTN_PRIMARY,

  FOCUS_RING,

  INK,

  MOTION,

  MUTED,

  SEARCH_PANEL,

} from "./explore-ui";



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

      className={cn(

        SEARCH_PANEL,

        "flex h-[3.125rem] min-w-0 items-stretch overflow-hidden p-1.5 sm:h-[3.25rem]",

      )}

    >

      <label htmlFor="explore-search" className="sr-only">

        Search by company, role or domain

      </label>



      <div className="relative flex min-w-0 flex-1 items-center">

        <SearchIcon className="pointer-events-none absolute left-3 shrink-0 text-[var(--il-muted)]" />

        <input

          id="explore-search"

          name="q"

          type="search"

          value={q}

          onChange={(e) => setQ(e.target.value)}

          placeholder="Search by company, role or domain"

          autoComplete="off"

          className={cn(

            "h-full min-w-0 flex-1 border-0 bg-transparent py-0 pl-10 text-sm font-medium",

            INK,

            "placeholder:font-normal placeholder:text-[var(--il-muted)] focus:outline-none",

            q ? "pr-10" : "pr-3",

          )}

        />

        {q && (

          <button

            type="button"

            onClick={clearSearch}

            aria-label="Clear search"

            className={cn(

              "absolute right-1 flex h-8 w-8 items-center justify-center rounded-lg",

              MUTED,

              "hover:bg-[color-mix(in_srgb,var(--il-lime)_12%,var(--il-white))] hover:text-[var(--il-moss)]",

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

        className={cn(

          BTN_PRIMARY,

          "inline-flex h-full shrink-0 items-center rounded-xl px-5 text-sm font-semibold sm:px-6",

          MOTION,

          FOCUS_RING,

        )}

      >

        {isPending ? "Searching…" : "Search"}

      </button>

    </form>

  );

}
