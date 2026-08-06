import Link from "next/link";

import { cn } from "@/lib/cn";

import { ChevronRightIcon } from "./explore-icons";
import { buildExploreQueryString, type ExploreUrlState } from "./explore-params";
import { BORDER, FOCUS_RING, INK, MOTION, MUTED, PANEL } from "./explore-ui";

const PAGE_BTN = cn(
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-2.5 text-xs font-medium sm:min-h-0 sm:h-8 sm:min-w-8",
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
      className={cn(PANEL, "flex flex-col items-center gap-2 px-3 py-2.5 sm:flex-row sm:justify-between")}
      aria-label="Pagination"
    >
      <p className={cn("text-[11px]", MUTED)}>
        Page {currentPage} of {totalPages}
      </p>

      <div className="flex w-full flex-wrap items-center justify-center gap-1 sm:w-auto sm:justify-end">
        {currentPage > 1 ? (
          <Link
            href={hrefForPage(currentPage - 1)}
            className={cn(
              PAGE_BTN,
              "gap-0.5 border bg-white",
              BORDER,
              INK,
              "hover:bg-[#f6f7f4]",
            )}
            aria-label="Previous page"
          >
            <ChevronRightIcon className="rotate-180" />
            <span className="hidden sm:inline">Prev</span>
          </Link>
        ) : (
          <span
            className={cn(PAGE_BTN, "cursor-not-allowed border border-[#e8ede6] bg-[#fafbf9] text-[#b0bab4]")}
            aria-hidden="true"
          >
            <ChevronRightIcon className="rotate-180" />
            <span className="hidden sm:inline">Prev</span>
          </span>
        )}

        <ol className="hidden items-center gap-0.5 sm:flex">
          {pages.map((page, index) =>
            page === "ellipsis" ? (
              <li key={`ellipsis-${index}`} className="px-1 text-xs text-[#b0bab4]" aria-hidden="true">
                …
              </li>
            ) : (
              <li key={page}>
                {page === currentPage ? (
                  <span
                    className={cn(
                      PAGE_BTN,
                      "bg-[#0f1812] font-semibold text-[#c8ef5a] shadow-sm",
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
                      "border bg-white",
                      BORDER,
                      INK,
                      "hover:bg-[#f6f7f4]",
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
              "gap-0.5 border bg-white",
              BORDER,
              INK,
              "hover:bg-[#f6f7f4]",
            )}
            aria-label="Next page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRightIcon />
          </Link>
        ) : (
          <span
            className={cn(PAGE_BTN, "cursor-not-allowed border border-[#e8ede6] bg-[#fafbf9] text-[#b0bab4]")}
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
