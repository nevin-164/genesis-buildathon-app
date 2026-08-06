import { z } from "zod";
import { DOMAINS, WORK_MODES } from "@/lib/constants/options";

/* ── Enum values derived from frozen constants ──────────────────────────── */

const domainValues = DOMAINS.map((d) => d.value) as [string, ...string[]];
const workModeValues = WORK_MODES.map((w) => w.value) as [string, ...string[]];

/* ── Explore filters ────────────────────────────────────────────────────── */

/**
 * Parse explore filters from raw query params.
 * Every field is forgiving: invalid values silently drop via `.catch()`.
 * Bad URLs never crash.
 */
export const exploreFiltersSchema = z.object({
  q: z.string().max(200).optional().catch(undefined),
  domain: z.enum(domainValues).optional().catch(undefined),
  companyId: z.string().uuid().optional().catch(undefined),
  workMode: z.enum(workModeValues).optional().catch(undefined),
  fee: z.enum(["free", "paid"] as const).optional().catch(undefined),
  stipend: z.enum(["yes", "no"] as const).optional().catch(undefined),
  minWeeks: z.coerce.number().int().min(1).optional().catch(undefined),
  maxWeeks: z.coerce.number().int().min(1).optional().catch(undefined),
  beginnerFriendly: z.boolean().optional().catch(undefined),
  sort: z
    .enum(["recent", "duration", "stipend"] as const)
    .default("recent")
    .catch("recent" as const),
  page: z.coerce.number().int().min(1).default(1).catch(1),
});

export type ParsedExploreFilters = z.infer<typeof exploreFiltersSchema>;

/* ── Compare IDs ────────────────────────────────────────────────────────── */

/**
 * Validate + clean compare IDs: deduplicate, cap at 3, require at least 1.
 */
export const compareIdsSchema = z
  .array(z.string().uuid())
  .min(1, "Select at least one internship to compare")
  .transform((ids) => [...new Set(ids)].slice(0, 3));
