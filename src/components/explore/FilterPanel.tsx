"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";

import { DOMAINS, WORK_MODES } from "@/lib/constants/options";
import { cn } from "@/lib/cn";

import { ChevronDownIcon, FilterSlidersIcon } from "./explore-icons";
import {
  buildExploreQueryString,
  countActiveFilters,
  type ExploreUrlState,
} from "./explore-params";
import {
  BORDER,
  BTN_QUIET,
  BTN_PRIMARY,
  CONTROL,
  EYEBROW,
  FOCUS_RING,
  INK,
  LABEL,
  MOTION,
  MUTED,
  SECTION_TITLE,
} from "./explore-ui";

const FEE_OPTIONS = [
  { value: "", label: "Any fee" },
  { value: "free", label: "No fee" },
  { value: "paid", label: "Paid" },
] as const;

const STIPEND_OPTIONS = [
  { value: "", label: "Any stipend" },
  { value: "yes", label: "Stipend offered" },
  { value: "no", label: "No stipend" },
] as const;

function CompactSelect({
  id,
  label,
  value,
  options,
  onChange,
  ariaLabel,
}: {
  id: string;
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className={cn(CONTROL, "text-xs sm:text-sm", MOTION, FOCUS_RING)}
      >
        {options.map((o) => (
          <option key={o.value || "any"} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function RailHeader({
  activeCount,
  onClear,
  showClear,
  mobileTrigger,
}: {
  activeCount: number;
  onClear: () => void;
  showClear: boolean;
  mobileTrigger?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        {mobileTrigger}
        <div className="hidden min-w-0 lg:block">
          <p className={EYEBROW}>Filters</p>
          <h2 className={cn(SECTION_TITLE, "text-sm")}>Refine</h2>
        </div>
        {activeCount > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--il-lime)] px-1.5 text-[10px] font-bold text-[var(--il-ink)]">
            {activeCount}
          </span>
        )}
      </div>
      {showClear && (
        <button
          type="button"
          onClick={onClear}
          className={cn(BTN_QUIET, "min-h-8 px-2 text-xs", FOCUS_RING, MOTION)}
        >
          Clear
        </button>
      )}
    </div>
  );
}

export function FilterPanel({ initialState }: { initialState: ExploreUrlState }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(
    Boolean(initialState.minWeeks || initialState.maxWeeks),
  );

  const [minWeeks, setMinWeeks] = useState(initialState.minWeeks);
  const [maxWeeks, setMaxWeeks] = useState(initialState.maxWeeks);

  const activeCount = countActiveFilters(initialState);
  const hasPanelFilters =
    initialState.domain !== "" ||
    initialState.mode !== "" ||
    initialState.fee !== "" ||
    initialState.stipend !== "" ||
    initialState.minWeeks !== "" ||
    initialState.maxWeeks !== "" ||
    initialState.beginnerFriendly;

  const navigate = useCallback(
    (next: ExploreUrlState) => {
      startTransition(() => {
        router.push(`/student/explore${buildExploreQueryString(next)}`);
      });
    },
    [router],
  );

  function patch(partial: Partial<ExploreUrlState>) {
    navigate({ ...initialState, ...partial, page: 1, sort: initialState.sort });
  }

  function handleDurationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate({ ...initialState, minWeeks, maxWeeks, page: 1 });
  }

  function clearPanelFilters() {
    setMinWeeks("");
    setMaxWeeks("");
    navigate({
      ...initialState,
      domain: "",
      mode: "",
      fee: "",
      stipend: "",
      minWeeks: "",
      maxWeeks: "",
      beginnerFriendly: false,
      page: 1,
    });
  }

  const filterBody = (
    <div id="explore-filter-body" className="space-y-5 pt-3 lg:pt-4">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-1">
        <CompactSelect
          id="explore-domain"
          label="Domain"
          value={initialState.domain}
          options={[{ value: "", label: "All domains" }, ...DOMAINS]}
          onChange={(v) => patch({ domain: v })}
          ariaLabel="Filter by domain"
        />
        <CompactSelect
          id="explore-mode"
          label="Work mode"
          value={initialState.mode}
          options={[{ value: "", label: "All modes" }, ...WORK_MODES]}
          onChange={(v) => patch({ mode: v })}
          ariaLabel="Filter by work mode"
        />
        <CompactSelect
          id="explore-fee"
          label="Fee"
          value={initialState.fee}
          options={FEE_OPTIONS}
          onChange={(v) => patch({ fee: v })}
          ariaLabel="Filter by fee"
        />
        <CompactSelect
          id="explore-stipend"
          label="Stipend"
          value={initialState.stipend}
          options={STIPEND_OPTIONS}
          onChange={(v) => patch({ stipend: v })}
          ariaLabel="Filter by stipend"
        />
      </div>

      <button
        type="button"
        onClick={() => setAdvancedOpen((o) => !o)}
        aria-expanded={advancedOpen}
        aria-controls="explore-advanced-filters"
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium",
          MUTED,
          "hover:text-[var(--il-ink)]",
          FOCUS_RING,
          MOTION,
        )}
      >
        <ChevronDownIcon className={cn(advancedOpen ? "rotate-180" : "", MOTION)} />
        Duration & suitability
      </button>

      <div
        id="explore-advanced-filters"
        className={cn(
          "grid overflow-hidden motion-reduce:transition-none",
          advancedOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          MOTION,
        )}
        aria-hidden={!advancedOpen}
      >
        <div className="min-h-0 overflow-hidden" inert={!advancedOpen}>
          <form
            onSubmit={handleDurationSubmit}
            className="space-y-3 border-l-2 border-[var(--il-lime)] pl-3"
          >
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="explore-min-weeks" className={LABEL}>
                  Min weeks
                </label>
                <input
                  id="explore-min-weeks"
                  name="minWeeks"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={minWeeks}
                  onChange={(e) => setMinWeeks(e.target.value.replace(/\D/g, ""))}
                  placeholder="Min"
                  aria-label="Minimum duration in weeks"
                  className={cn(CONTROL, "text-xs", MOTION, FOCUS_RING)}
                />
              </div>
              <div>
                <label htmlFor="explore-max-weeks" className={LABEL}>
                  Max weeks
                </label>
                <input
                  id="explore-max-weeks"
                  name="maxWeeks"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={maxWeeks}
                  onChange={(e) => setMaxWeeks(e.target.value.replace(/\D/g, ""))}
                  placeholder="Max"
                  aria-label="Maximum duration in weeks"
                  className={cn(CONTROL, "text-xs", MOTION, FOCUS_RING)}
                />
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                id="explore-beginner"
                name="beginnerFriendly"
                type="checkbox"
                checked={initialState.beginnerFriendly}
                onChange={(e) => patch({ beginnerFriendly: e.target.checked })}
                className={cn(
                  "h-4 w-4 rounded border-[var(--il-border)] accent-[var(--il-ink)]",
                  FOCUS_RING,
                )}
              />
              <span className={cn("text-xs", INK)}>Beginner friendly only</span>
            </label>
            <button
              type="submit"
              disabled={isPending}
              className={cn(BTN_PRIMARY, "h-8 px-3 text-xs", MOTION, FOCUS_RING)}
            >
              {isPending ? "Applying…" : "Apply duration"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  const mobileTrigger = (
    <button
      type="button"
      onClick={() => setMobileOpen((o) => !o)}
      aria-expanded={mobileOpen}
      aria-controls="explore-filter-mobile"
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold lg:hidden",
        BORDER,
        INK,
        "hover:border-[color-mix(in_srgb,var(--il-leaf)_40%,var(--il-border))] hover:bg-[color-mix(in_srgb,var(--il-lime)_6%,var(--il-white))]",
        FOCUS_RING,
        MOTION,
      )}
    >
      <FilterSlidersIcon />
      Filters
      {activeCount > 0 && (
        <span className="inline-flex h-4 min-w-4 items-center justify-center rounded bg-[var(--il-lime)] px-1 text-[9px] font-bold text-[var(--il-ink)]">
          {activeCount}
        </span>
      )}
      <ChevronDownIcon className={cn(mobileOpen ? "rotate-180" : "", MOTION)} />
    </button>
  );

  return (
    <section aria-label="Filter experiences" className="min-w-0">
      <RailHeader
        activeCount={activeCount}
        onClear={clearPanelFilters}
        showClear={hasPanelFilters}
        mobileTrigger={mobileTrigger}
      />

      <div className="hidden lg:block">{filterBody}</div>

      <div
        id="explore-filter-mobile"
        className={cn(mobileOpen ? "block lg:hidden" : "hidden")}
      >
        {filterBody}
      </div>
    </section>
  );
}
