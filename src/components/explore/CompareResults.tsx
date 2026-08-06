import Link from "next/link";

import { cn } from "@/lib/cn";
import type { RealityCard } from "@/types/contracts";

import { companyMonogram, getCompareRows } from "./compare-rows";
import { formatFee, formatStipend } from "./MoneyLine";
import {
  CARD_ROLE,
  DISPLAY_COMPANY,
  DISPLAY_SECTION,
  FOCUS_RING,
  INK,
  MOTION,
  MUTED,
  MUTED_LIGHT,
  PANEL,
} from "./explore-ui";

function CompareColumnHeader({ card }: { card: RealityCard }) {
  return (
    <div className="min-w-0 border-b border-[#e4ebe4] bg-[#f4f8f5] px-3 py-3 sm:px-4 sm:py-4">
      <div className="flex min-w-0 gap-2.5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0f1812] text-[10px] font-bold text-[#c8ef5a]"
          aria-hidden="true"
        >
          {companyMonogram(card.companyName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("break-words text-sm font-bold leading-snug", DISPLAY_COMPANY)}>
            {card.companyName}
          </p>
          <p className={cn("mt-0.5 line-clamp-2 break-words text-xs", CARD_ROLE)}>
            {card.roleTitle}
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-md border border-[#dde5dc] bg-white px-2 py-1.5">
          <p className={cn("text-[9px] font-medium uppercase tracking-wide", MUTED_LIGHT)}>Fee</p>
          <p className={cn("mt-0.5 font-semibold leading-snug", INK)}>{formatFee(card.feeAmount)}</p>
        </div>
        <div className="rounded-md border border-[#dde5dc] bg-white px-2 py-1.5">
          <p className={cn("text-[9px] font-medium uppercase tracking-wide", MUTED_LIGHT)}>Stipend</p>
          <p className={cn("mt-0.5 font-semibold leading-snug", INK)}>
            {formatStipend(card.stipendAmount)}
          </p>
        </div>
      </div>
      <Link
        href={`/student/explore/${card.id}`}
        className={cn(
          "mt-3 inline-flex text-xs font-semibold underline-offset-2 hover:underline",
          INK,
          MOTION,
          FOCUS_RING,
        )}
      >
        View full Reality Card
      </Link>
    </div>
  );
}

function DesktopCompareMatrix({ cards }: { cards: RealityCard[] }) {
  const rows = getCompareRows(cards);
  const columnCount = cards.length;

  return (
    <div className="hidden min-w-0 lg:block">
      <div className="overflow-x-auto rounded-xl border border-[#cdd8cf] bg-white shadow-[0_1px_3px_rgba(15,24,18,0.05)]">
        <div
          className="grid min-w-[640px]"
          style={{
            gridTemplateColumns: `minmax(8.5rem, 10rem) repeat(${columnCount}, minmax(0, 1fr))`,
          }}
        >
          <div className="sticky left-0 z-20 border-b border-r border-[#e4ebe4] bg-[#fafbf9]" />
          {cards.map((card) => (
            <div key={card.id} className="min-w-0 border-b border-[#e4ebe4]">
              <CompareColumnHeader card={card} />
            </div>
          ))}

          {rows.map((row) => (
            <div key={row.id} className="contents">
              <div
                className={cn(
                  "sticky left-0 z-10 border-b border-r border-[#e8ede6] bg-[#fafbf9] px-3 py-3",
                  row.kind === "long" && "align-top",
                )}
              >
                <p className={cn("text-xs font-semibold leading-snug", INK)}>{row.label}</p>
              </div>
              {cards.map((card) => (
                <div
                  key={`${row.id}-${card.id}`}
                  className={cn(
                    "min-w-0 border-b border-[#e8ede6] px-3 py-3 sm:px-4",
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
      className={cn(PANEL, "min-w-0 overflow-hidden p-0")}
      aria-label={`Comparison details for ${card.companyName}`}
    >
      <CompareColumnHeader card={card} />
      <dl className="divide-y divide-[#e8ede6] px-3 py-1 sm:px-4">
        {rows.map((row) => (
          <div key={row.id} className="grid gap-1 py-3">
            <dt className={cn("text-xs font-semibold", INK)}>{row.label}</dt>
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
      <h2 id="compare-results-heading" className={cn(DISPLAY_SECTION, "text-base sm:text-lg")}>
        Comparison
      </h2>
      <p className={cn("mt-1 text-sm", MUTED)}>
        Comparing {cards.length} verified experiences side by side.
      </p>

      <div className="mt-4 min-w-0">
        <DesktopCompareMatrix cards={cards} />
        <MobileCompareStack cards={cards} />
      </div>
    </section>
  );
}
