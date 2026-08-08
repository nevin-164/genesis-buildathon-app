import Link from "next/link";

import { CompanyMark } from "@/components/student/primitives";
import { cn } from "@/lib/cn";
import type { RealityCard } from "@/types/contracts";

import { getCompareRows } from "./compare-rows";
import { formatFee, formatStipend } from "./MoneyLine";
import {
  CARD_ROLE,
  DISPLAY_COMPANY,
  EYEBROW,
  FOCUS_RING,
  INK,
  MOTION,
  MUTED,
  SECTION_TITLE,
} from "./explore-ui";

function CompareColumnHeader({ card }: { card: RealityCard }) {
  return (
    <div className="min-w-0 border-b border-[var(--il-border)] px-4 py-3 sm:px-5">
      <div className="flex min-w-0 gap-3">
        <CompanyMark name={card.companyName} size="sm" />
        <div className="min-w-0 flex-1">
          <p className={cn("break-words", DISPLAY_COMPANY)}>{card.companyName}</p>
          <p className={cn("mt-0.5 line-clamp-2 break-words", CARD_ROLE)}>{card.roleTitle}</p>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="min-w-0 rounded-lg border border-[var(--il-border)] bg-[var(--il-canvas)] px-2.5 py-2">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--il-muted)]">
            Fee
          </dt>
          <dd className={cn("mt-0.5 break-words font-bold leading-snug", INK)}>
            {formatFee(card.feeAmount)}
          </dd>
        </div>
        <div className="min-w-0 rounded-lg border border-[color-mix(in_srgb,var(--il-leaf)_35%,var(--il-border))] bg-[color-mix(in_srgb,var(--il-lime)_10%,var(--il-white))] px-2.5 py-2">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--il-muted)]">
            Stipend
          </dt>
          <dd className={cn("mt-0.5 break-words font-bold leading-snug", INK)}>
            {formatStipend(card.stipendAmount)}
          </dd>
        </div>
      </dl>
      <Link
        href={`/student/explore/${card.id}`}
        className={cn(
          "mt-3 inline-flex items-center gap-0.5 text-xs font-semibold",
          INK,
          "hover:text-[var(--il-moss)] hover:underline",
          MOTION,
          FOCUS_RING,
        )}
      >
        View Reality Card
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

function DesktopCompareMatrix({ cards }: { cards: RealityCard[] }) {
  const rows = getCompareRows(cards);
  const columnCount = cards.length;

  return (
    <div className="hidden min-w-0 max-w-full lg:block">
      <div className="max-w-full overflow-x-auto border-y border-[var(--il-border)]">
        <div
          className="grid min-w-[640px]"
          style={{
            gridTemplateColumns: `minmax(8.5rem, 10rem) repeat(${columnCount}, minmax(0, 1fr))`,
          }}
        >
          <div className="sticky left-0 z-20 border-b border-r border-[var(--il-border)] bg-[var(--il-canvas)]" />
          {cards.map((card) => (
            <div key={card.id} className="min-w-0 border-b border-[var(--il-border)]">
              <CompareColumnHeader card={card} />
            </div>
          ))}

          {rows.map((row, rowIndex) => (
            <div key={row.id} className="contents">
              <div
                className={cn(
                  "sticky left-0 z-10 border-b border-r border-[var(--il-border)] px-4 py-3",
                  rowIndex % 2 === 1 ? "bg-[color-mix(in_srgb,var(--il-canvas)_80%,var(--il-white))]" : "bg-[var(--il-canvas)]",
                  row.kind === "long" && "align-top",
                )}
              >
                <p className={cn("text-xs font-bold leading-snug", INK)}>{row.label}</p>
              </div>
              {cards.map((card) => (
                <div
                  key={`${row.id}-${card.id}`}
                  className={cn(
                    "min-w-0 border-b border-[var(--il-border)] px-4 py-3",
                    rowIndex % 2 === 1 && "bg-[color-mix(in_srgb,var(--il-canvas)_50%,var(--il-white))]",
                    row.kind === "long" && "align-top",
                  )}
                >
                  <p
                    className={cn(
                      "text-sm leading-relaxed break-words",
                      row.kind === "long" ? MUTED : INK,
                    )}
                  >
                    {row.getValue(card)}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileCompareCard({
  card,
  rows,
}: {
  card: RealityCard;
  rows: ReturnType<typeof getCompareRows>;
}) {
  return (
    <article
      className="min-w-0 overflow-hidden rounded-xl border border-[var(--il-border)]"
      aria-label={`Comparison details for ${card.companyName}`}
    >
      <CompareColumnHeader card={card} />
      <dl className="divide-y divide-[var(--il-border)] px-4 sm:px-5">
        {rows.map((row, rowIndex) => (
          <div
            key={row.id}
            className={cn(
              "grid gap-1.5 py-3",
              rowIndex % 2 === 1 && "bg-[color-mix(in_srgb,var(--il-canvas)_50%,var(--il-white))]",
            )}
          >
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--il-muted)]">
              {row.label}
            </dt>
            <dd
              className={cn(
                "text-sm leading-relaxed break-words",
                row.kind === "long" ? MUTED : INK,
              )}
            >
              {row.getValue(card)}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function MobileCompareStack({ cards }: { cards: RealityCard[] }) {
  const rows = getCompareRows(cards);

  return (
    <div className="space-y-4 lg:hidden">
      {cards.map((card) => (
        <MobileCompareCard key={card.id} card={card} rows={rows} />
      ))}
    </div>
  );
}

export function CompareResults({ cards }: { cards: RealityCard[] }) {
  if (cards.length < 2) return null;

  return (
    <section
      id="compare-results"
      className="min-w-0 scroll-mt-24 sm:scroll-mt-28"
      aria-labelledby="compare-results-heading"
    >
      <p className={EYEBROW}>Results</p>
      <h2 id="compare-results-heading" className={cn(SECTION_TITLE, "mt-1 text-lg sm:text-xl")}>
        Comparison
      </h2>
      <p className={cn("mt-1.5 text-sm", MUTED)}>
        Comparing {cards.length} verified experiences side by side.
      </p>

      <div className="mt-4 min-w-0">
        <DesktopCompareMatrix cards={cards} />
        <MobileCompareStack cards={cards} />
      </div>
    </section>
  );
}
