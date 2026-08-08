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
  BTN_GHOST,
  BTN_PRIMARY,
  CONTROL,
  DISPLAY_SECTION,
  FOCUS_RING,
  INK,
  LABEL,
  MOTION,
  MUTED,
  PANEL,
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
        className={cn(CONTROL, MOTION, FOCUS_RING)}
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

function PanelHeader({
  activeCount,
  panelOpen,
  onTogglePanel,
  onClear,
  showClear,
  mobileTrigger,
}: {
  activeCount: number;
  panelOpen: boolean;
  onTogglePanel: () => void;
  onClear: () => void;
  showClear: boolean;
  mobileTrigger?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        {mobileTrigger}
        <FilterSlidersIcon className={cn("hidden shrink-0 text-[#5c6b62] sm:block")} />
        <div>
          <h2 className={cn(DISPLAY_SECTION, "text-sm")}>Refine results</h2>
          {activeCount > 0 && (
            <p className={cn("text-xs", MUTED)}>
              {activeCount} active filter{activeCount === 1 ? "" : "s"}
            </p>
          )}
        </div>
        {activeCount > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c8ef5a] px-1.5 text-[10px] font-bold text-[#0f1812] sm:hidden">
            {activeCount}
          </span>
        )}
        {activeCount > 0 && (
          <span className="hidden items-center justify-center rounded-full bg-[#c8ef5a] px-2 py-0.5 text-[10px] font-bold text-[#0f1812] sm:inline-flex">
            {activeCount}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {showClear && (
          <button type="button" onClick={onClear} className={cn(BTN_GHOST, FOCUS_RING, MOTION)}>
            Clear all
          </button>
        )}
        <button
          type="button"
          onClick={onTogglePanel}
          aria-expanded={panelOpen}
          aria-controls="explore-filter-body"
          className={cn(
            "hidden items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold sm:inline-flex",
            panelOpen ? "border-[#c8ef5a]/40 bg-[#f0fae8] text-[#3d5210]" : BORDER,
            !panelOpen && INK,
            "hover:bg-[#f0fae8]",
            FOCUS_RING,
            MOTION,
          )}
        >
          {panelOpen ? "Collapse" : "Expand"}
          <ChevronDownIcon className={cn(panelOpen ? "rotate-180" : "", MOTION)} />
        </button>
      </div>
    </div>
  );
}

export function FilterPanel({ initialState }: { initialState: ExploreUrlState }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
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
    <div id="explore-filter-body" className="space-y-3 pt-3">
      {/* Primary controls */}
      <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2 sm:grid-cols-4 sm:gap-3">
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

      {/* Advanced toggle */}
      <button
        type="button"
        onClick={() => setAdvancedOpen((o) => !o)}
        aria-expanded={advancedOpen}
        aria-controls="explore-advanced-filters"
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium",
          MUTED,
          "hover:text-[#0f1812]",
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
          <form onSubmit={handleDurationSubmit} className="space-y-2 rounded-lg border border-[#e8ede6] bg-[#fafbf9] p-3">
            <div className="grid grid-cols-2 gap-2 sm:max-w-md">
              <div>
                <label htmlFor="explore-min-weeks" className={LABEL}>
                  Minimum weeks
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
                  className={cn(CONTROL, MOTION, FOCUS_RING)}
                />
              </div>
              <div>
                <label htmlFor="explore-max-weeks" className={LABEL}>
                  Maximum weeks
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
                  className={cn(CONTROL, MOTION, FOCUS_RING)}
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
                  "h-4 w-4 rounded border-[#d8e0d6] accent-[#0f1812]",
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
        "inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold sm:hidden",
        BORDER,
        INK,
        "hover:bg-[#f6f7f4]",
        FOCUS_RING,
        MOTION,
      )}
    >
      <FilterSlidersIcon />
      Filters
      {activeCount > 0 && (
        <span className="inline-flex h-4 min-w-4 items-center justify-center rounded bg-[#c8ef5a] px-1 text-[9px] font-bold text-[#3d5210]">
          {activeCount}
        </span>
      )}
      <ChevronDownIcon className={cn(mobileOpen ? "rotate-180" : "", MOTION)} />
    </button>
  );

  return (
    <section aria-label="Filter experiences" className={cn(PANEL, "overflow-hidden p-0")}>
      <div className="border-b border-[#dde5dc] bg-[#f0fae8]/50 px-3 py-2.5 sm:px-4 sm:py-3">
        <PanelHeader
          activeCount={activeCount}
          panelOpen={panelOpen}
          onTogglePanel={() => setPanelOpen((o) => !o)}
          onClear={clearPanelFilters}
          showClear={hasPanelFilters}
          mobileTrigger={mobileTrigger}
        />
      </div>

      {/* Desktop / expanded */}
      <div className={cn(panelOpen ? "block" : "hidden")}>
        <div className="hidden px-3 py-3 sm:block sm:px-4 sm:py-3.5">{filterBody}</div>
      </div>

      {/* Mobile collapsible */}
      <div
        id="explore-filter-mobile"
        className={cn(mobileOpen ? "block px-3 py-3 sm:hidden" : "hidden")}
      >
        {filterBody}
      </div>
    </section>
  );
}
