import {
  DOMAINS,
  WORK_MODES,
  labelFor,
} from "@/lib/constants/options";
import type { ExploreFilters, WorkMode } from "@/types/contracts";

const DOMAIN_VALUES = new Set<string>(DOMAINS.map((d) => d.value));
const MODE_VALUES = new Set<string>(WORK_MODES.map((w) => w.value));
const SORT_VALUES = new Set<string>(["recent", "duration", "stipend"]);
const FEE_VALUES = new Set<string>(["free", "paid"]);
const STIPEND_VALUES = new Set<string>(["yes", "no"]);

export type ExploreSort = "recent" | "duration" | "stipend";

/** Parsed, validated filter state mirrored in the URL. */
export type ExploreUrlState = {
  q: string;
  domain: string;
  mode: string;
  fee: string;
  stipend: string;
  minWeeks: string;
  maxWeeks: string;
  beginnerFriendly: boolean;
  sort: ExploreSort;
  page: number;
};

function firstValue(raw: string | string[] | undefined): string {
  if (Array.isArray(raw)) return raw[0] ?? "";
  return raw ?? "";
}

/** Safely parse URL search params into validated explore state. */
export function parseExploreSearchParams(
  raw: Record<string, string | string[] | undefined>,
): ExploreUrlState {
  const mode = firstValue(raw.mode);
  const sortRaw = firstValue(raw.sort);
  const pageRaw = firstValue(raw.page);
  const minWeeksRaw = firstValue(raw.minWeeks);
  const maxWeeksRaw = firstValue(raw.maxWeeks);

  let page = parseInt(pageRaw, 10);
  if (!Number.isFinite(page) || page < 1) page = 1;

  let sort: ExploreSort = "recent";
  if (SORT_VALUES.has(sortRaw)) sort = sortRaw as ExploreSort;

  return {
    q: firstValue(raw.q).trim(),
    domain: DOMAIN_VALUES.has(firstValue(raw.domain)) ? firstValue(raw.domain) : "",
    mode: MODE_VALUES.has(mode) ? mode : "",
    fee: FEE_VALUES.has(firstValue(raw.fee)) ? firstValue(raw.fee) : "",
    stipend: STIPEND_VALUES.has(firstValue(raw.stipend)) ? firstValue(raw.stipend) : "",
    minWeeks: /^\d+$/.test(minWeeksRaw) ? minWeeksRaw : "",
    maxWeeks: /^\d+$/.test(maxWeeksRaw) ? maxWeeksRaw : "",
    beginnerFriendly: firstValue(raw.beginnerFriendly) === "true",
    sort,
    page,
  };
}

/** Map URL state to the controller filter contract (`mode` → `workMode`). */
export function toExploreFilters(state: ExploreUrlState): ExploreFilters {
  const filters: ExploreFilters = {
    sort: state.sort,
    page: state.page,
  };

  if (state.q) filters.q = state.q;
  if (state.domain) filters.domain = state.domain;
  if (state.mode) filters.workMode = state.mode as WorkMode;
  if (state.fee === "free" || state.fee === "paid") filters.fee = state.fee;
  if (state.stipend === "yes" || state.stipend === "no") filters.stipend = state.stipend;
  if (state.minWeeks) filters.minWeeks = parseInt(state.minWeeks, 10);
  if (state.maxWeeks) filters.maxWeeks = parseInt(state.maxWeeks, 10);
  if (state.beginnerFriendly) filters.beginnerFriendly = true;

  return filters;
}

/** Build a query string from explore state (used by client filter controls). */
export function buildExploreQueryString(state: ExploreUrlState): string {
  const params = new URLSearchParams();

  if (state.q) params.set("q", state.q);
  if (state.domain) params.set("domain", state.domain);
  if (state.mode) params.set("mode", state.mode);
  if (state.fee) params.set("fee", state.fee);
  if (state.stipend) params.set("stipend", state.stipend);
  if (state.minWeeks) params.set("minWeeks", state.minWeeks);
  if (state.maxWeeks) params.set("maxWeeks", state.maxWeeks);
  if (state.beginnerFriendly) params.set("beginnerFriendly", "true");
  if (state.sort !== "recent") params.set("sort", state.sort);
  if (state.page > 1) params.set("page", String(state.page));

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function hasActiveFilters(state: ExploreUrlState): boolean {
  return countActiveFilters(state) > 0;
}

/** Number of individually active filter dimensions (for badges and chips). */
export function countActiveFilters(state: ExploreUrlState): number {
  let count = 0;
  if (state.q) count += 1;
  if (state.domain) count += 1;
  if (state.mode) count += 1;
  if (state.fee) count += 1;
  if (state.stipend) count += 1;
  if (state.minWeeks || state.maxWeeks) count += 1;
  if (state.beginnerFriendly) count += 1;
  return count;
}

export type ActiveFilterChip = {
  /** Stable id used when removing a chip from the URL. */
  id: string;
  label: string;
};

const FEE_CHIP_LABEL = { free: "No fee", paid: "Paid internship" } as const;
const STIPEND_CHIP_LABEL = { yes: "Stipend offered", no: "No stipend" } as const;

/** Human-readable chips for the active filter summary bar. */
export function getActiveFilterChips(state: ExploreUrlState): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (state.q) {
    chips.push({ id: "q", label: `"${state.q}"` });
  }
  if (state.domain) {
    chips.push({ id: "domain", label: labelFor(DOMAINS, state.domain) });
  }
  if (state.mode) {
    chips.push({ id: "mode", label: labelFor(WORK_MODES, state.mode) });
  }
  if (state.fee === "free" || state.fee === "paid") {
    chips.push({ id: "fee", label: FEE_CHIP_LABEL[state.fee] });
  }
  if (state.stipend === "yes" || state.stipend === "no") {
    chips.push({ id: "stipend", label: STIPEND_CHIP_LABEL[state.stipend] });
  }
  if (state.minWeeks || state.maxWeeks) {
    const min = state.minWeeks || "any";
    const max = state.maxWeeks || "any";
    chips.push({ id: "duration", label: `${min}–${max} weeks` });
  }
  if (state.beginnerFriendly) {
    chips.push({ id: "beginnerFriendly", label: "Beginner friendly" });
  }

  return chips;
}

/** Remove one active filter dimension and reset to page 1. */
export function removeFilterChip(
  state: ExploreUrlState,
  chipId: string,
): ExploreUrlState {
  const next = { ...state, page: 1 };

  switch (chipId) {
    case "q":
      return { ...next, q: "" };
    case "domain":
      return { ...next, domain: "" };
    case "mode":
      return { ...next, mode: "" };
    case "fee":
      return { ...next, fee: "" };
    case "stipend":
      return { ...next, stipend: "" };
    case "duration":
      return { ...next, minWeeks: "", maxWeeks: "" };
    case "beginnerFriendly":
      return { ...next, beginnerFriendly: false };
    default:
      return next;
  }
}
