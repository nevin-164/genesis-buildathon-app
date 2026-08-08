import Link from "next/link";

import { cn } from "@/lib/cn";

import { ChevronRightIcon } from "./explore-icons";
import { buildExploreQueryString, type ExploreUrlState } from "./explore-params";
import {
  BORDER,
  FOCUS_RING,
  INK,
  MOTION,
  MUTED,
} from "./explore-ui";

const PAGE_BTN = cn(
  "inline-flex min-h-9 min-w-9 items-center justify-center rounded-xl px-2.5 text-xs font-semibold",
  MOTION,
  FOCUS_RING,
);

export function Pagination({
  state,
  total,
  pageSize,
}: {
  state: ExploreUrlState;
  total: number;
  pageSize: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (totalPages <= 1) return null;

  const currentPage = state.page;
  const pages = buildPageNumbers(currentPage, totalPages);

  function hrefForPage(page: number): string {
    return `/student/explore${buildExploreQueryString({ ...state, page })}`;
  }

  return (
    <nav
      className="flex flex-col items-center gap-3 border-t border-[var(--il-border)] pt-5 sm:flex-row sm:justify-between"
      aria-label="Pagination"
    >
      <p className={cn("text-xs font-medium", MUTED)}>
        Page <span className={cn("font-semibold", INK)}>{currentPage}</span> of{" "}
        <span className={cn("font-semibold", INK)}>{totalPages}</span>
      </p>

      <div className="flex w-full flex-wrap items-center justify-center gap-1 sm:w-auto sm:justify-end">
        {currentPage > 1 ? (
          <Link
            href={hrefForPage(currentPage - 1)}
            className={cn(
              PAGE_BTN,
              "gap-0.5 border bg-[var(--il-white)]",
              BORDER,
              INK,
              "hover:border-[color-mix(in_srgb,var(--il-leaf)_40%,var(--il-border))] hover:bg-[color-mix(in_srgb,var(--il-lime)_6%,var(--il-white))]",
            )}
            aria-label="Previous page"
          >
            <ChevronRightIcon className="rotate-180" />
            <span className="hidden sm:inline">Prev</span>
          </Link>
        ) : (
          <span
            className={cn(
              PAGE_BTN,
              "cursor-not-allowed border border-[var(--il-border)] bg-[var(--il-canvas)] text-[color-mix(in_srgb,var(--il-muted)_78%,transparent)]",
            )}
            aria-hidden="true"
          >
            <ChevronRightIcon className="rotate-180" />
            <span className="hidden sm:inline">Prev</span>
          </span>
        )}

        <ol className="hidden items-center gap-1 sm:flex">
          {pages.map((page, index) =>
            page === "ellipsis" ? (
              <li
                key={`ellipsis-${index}`}
                className={cn("px-1 text-xs text-[color-mix(in_srgb,var(--il-muted)_78%,transparent)]")}
                aria-hidden="true"
              >
                …
              </li>
            ) : (
              <li key={page}>
                {page === currentPage ? (
                  <span
                    className={cn(
                      PAGE_BTN,
                      "bg-[var(--il-ink)] font-bold text-[var(--il-lime)] shadow-[inset_3px_0_0_var(--il-lime)]",
                    )}
                    aria-current="page"
                  >
                    {page}
                  </span>
                ) : (
                  <Link
                    href={hrefForPage(page)}
                    className={cn(
                      PAGE_BTN,
                      "border bg-[var(--il-white)]",
                      BORDER,
                      INK,
                      "hover:border-[color-mix(in_srgb,var(--il-leaf)_40%,var(--il-border))] hover:bg-[color-mix(in_srgb,var(--il-lime)_6%,var(--il-white))]",
                    )}
                    aria-label={`Page ${page}`}
                  >
                    {page}
                  </Link>
                )}
              </li>
            ),
          )}
        </ol>

        {currentPage < totalPages ? (
          <Link
            href={hrefForPage(currentPage + 1)}
            className={cn(
              PAGE_BTN,
              "gap-0.5 border bg-[var(--il-white)]",
              BORDER,
              INK,
              "hover:border-[color-mix(in_srgb,var(--il-leaf)_40%,var(--il-border))] hover:bg-[color-mix(in_srgb,var(--il-lime)_6%,var(--il-white))]",
            )}
            aria-label="Next page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRightIcon />
          </Link>
        ) : (
          <span
            className={cn(
              PAGE_BTN,
              "cursor-not-allowed border border-[var(--il-border)] bg-[var(--il-canvas)] text-[color-mix(in_srgb,var(--il-muted)_78%,transparent)]",
            )}
            aria-hidden="true"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRightIcon />
          </span>
        )}
      </div>
    </nav>
  );
}

function buildPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  if (current > 3) pages.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let p = start; p <= end; p++) pages.push(p);

  if (current < total - 2) pages.push("ellipsis");

  pages.push(total);
  return pages;
}
