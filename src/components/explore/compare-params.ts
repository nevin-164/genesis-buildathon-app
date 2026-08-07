import type { ExploreCard } from "@/types/contracts";

export type CompareUrlState = {
  id1: string;
  id2: string;
  id3: string;
};

function firstValue(raw: string | string[] | undefined): string {
  if (Array.isArray(raw)) return raw[0] ?? "";
  return raw ?? "";
}

export function parseCompareSearchParams(
  raw: Record<string, string | string[] | undefined>,
): CompareUrlState {
  return {
    id1: firstValue(raw.id1).trim(),
    id2: firstValue(raw.id2).trim(),
    id3: firstValue(raw.id3).trim(),
  };
}

/** Build query string for compare selections (`id1`, `id2`, optional `id3`). */
export function buildCompareQueryString(state: CompareUrlState): string {
  const params = new URLSearchParams();

  if (state.id1) params.set("id1", state.id1);
  if (state.id2) params.set("id2", state.id2);
  if (state.id3) params.set("id3", state.id3);

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Non-empty selected IDs in slot order, at most three. */
export function getActiveCompareIds(state: CompareUrlState): string[] {
  return [state.id1, state.id2, state.id3].filter(Boolean);
}

export function hasDuplicateSelections(state: CompareUrlState): boolean {
  const ids = getActiveCompareIds(state);
  return new Set(ids).size !== ids.length;
}

export function labelForOption(card: ExploreCard): string {
  return `${card.companyName} — ${card.roleTitle}`;
}

export function partitionCompareIds(
  state: CompareUrlState,
  knownIds: Set<string>,
): { valid: string[]; invalid: string[]; duplicates: boolean } {
  const raw = getActiveCompareIds(state);
  const duplicates = new Set(raw).size !== raw.length;
  const unique = duplicates ? [] : raw;
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const id of unique) {
    if (knownIds.has(id)) valid.push(id);
    else invalid.push(id);
  }

  return { valid, invalid, duplicates };
}
