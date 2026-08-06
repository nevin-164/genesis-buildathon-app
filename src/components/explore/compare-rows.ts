import {
  APPLICATION_SOURCES,
  DOMAINS,
  MENTOR_FREQUENCIES,
  WORK_MODES,
  WORK_NATURES,
  labelFor,
} from "@/lib/constants/options";
import type { RealityCard } from "@/types/contracts";

import { formatFee, formatStipend } from "./MoneyLine";

export function formatCompareDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function notProvided(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "Not provided";
}

function formatList(values: string[]): string {
  if (values.length === 0) return "None listed";
  return values.join(", ");
}

function formatBeginnerFriendly(value: boolean | null): string {
  if (value === true) return "Beginner-friendly";
  if (value === false) return "Not marked as beginner-friendly";
  return "Not provided";
}

function formatMentorship(card: RealityCard): string {
  if (!card.hadMentor) return "No mentor reported";
  const frequency = card.mentorFrequency
    ? labelFor(MENTOR_FREQUENCIES, card.mentorFrequency)
    : null;
  return frequency ? `Yes — ${frequency}` : "Yes";
}

function formatContributor(card: RealityCard): string {
  const parts = [card.studentName, String(card.year)];
  if (card.studentBatch) parts.push(card.studentBatch);
  return parts.join(" · ");
}

export type CompareRowKind = "text" | "long";

export type CompareRow = {
  id: string;
  label: string;
  kind: CompareRowKind;
  getValue: (card: RealityCard) => string;
};

/** Rows derived only from RealityCard contract fields. */
export function getCompareRows(cards: RealityCard[]): CompareRow[] {
  const rows: CompareRow[] = [
    {
      id: "company",
      label: "Company",
      kind: "text",
      getValue: (c) => c.companyName,
    },
    {
      id: "role",
      label: "Role",
      kind: "text",
      getValue: (c) => c.roleTitle,
    },
    {
      id: "domain",
      label: "Domain",
      kind: "text",
      getValue: (c) => labelFor(DOMAINS, c.domain),
    },
    {
      id: "location",
      label: "Location",
      kind: "text",
      getValue: (c) =>
        c.location ?? (c.workMode === "remote" ? "Remote" : "Not provided"),
    },
    {
      id: "workMode",
      label: "Work mode",
      kind: "text",
      getValue: (c) => labelFor(WORK_MODES, c.workMode),
    },
    {
      id: "duration",
      label: "Duration",
      kind: "text",
      getValue: (c) => {
        const weeks = `${c.durationWeeks} ${c.durationWeeks === 1 ? "week" : "weeks"}`;
        return `${weeks} (${formatCompareDate(c.startDate)} – ${formatCompareDate(c.endDate)})`;
      },
    },
    {
      id: "fee",
      label: "Fee",
      kind: "text",
      getValue: (c) => formatFee(c.feeAmount),
    },
    {
      id: "stipend",
      label: "Stipend",
      kind: "text",
      getValue: (c) => formatStipend(c.stipendAmount),
    },
    {
      id: "workNature",
      label: "Work nature",
      kind: "text",
      getValue: (c) => labelFor(WORK_NATURES, c.workNature),
    },
    {
      id: "workSummary",
      label: "Work & responsibilities",
      kind: "long",
      getValue: (c) => notProvided(c.workSummary),
    },
    {
      id: "technologies",
      label: "Technologies",
      kind: "text",
      getValue: (c) => formatList(c.technologies),
    },
    {
      id: "mentorship",
      label: "Mentorship",
      kind: "text",
      getValue: formatMentorship,
    },
    {
      id: "skillsBefore",
      label: "Skills before",
      kind: "text",
      getValue: (c) => formatList(c.skillsBefore),
    },
    {
      id: "skillsAfter",
      label: "Skills after",
      kind: "text",
      getValue: (c) => formatList(c.skillsAfter),
    },
    {
      id: "applicationSource",
      label: "Application source",
      kind: "text",
      getValue: (c) =>
        c.applicationSource
          ? labelFor(APPLICATION_SOURCES, c.applicationSource)
          : "Not provided",
    },
    {
      id: "applicationProcess",
      label: "Application pathway",
      kind: "long",
      getValue: (c) => notProvided(c.applicationProcess),
    },
    {
      id: "suitsWhom",
      label: "Who would benefit",
      kind: "long",
      getValue: (c) => notProvided(c.suitsWhom),
    },
    {
      id: "beginnerFriendly",
      label: "Beginner friendly",
      kind: "text",
      getValue: (c) => formatBeginnerFriendly(c.beginnerFriendly),
    },
    {
      id: "contributor",
      label: "Shared by",
      kind: "text",
      getValue: formatContributor,
    },
    {
      id: "verifiedBy",
      label: "Verified by",
      kind: "text",
      getValue: (c) => c.verifiedByName,
    },
    {
      id: "verifiedAt",
      label: "Verified on",
      kind: "text",
      getValue: (c) => formatCompareDate(c.verifiedAt),
    },
  ];

  const showProjectTitle = cards.some((c) => c.projectTitle?.trim());
  if (showProjectTitle) {
    rows.splice(10, 0, {
      id: "projectTitle",
      label: "Project title",
      kind: "text",
      getValue: (c) => notProvided(c.projectTitle),
    });
  }

  return rows;
}

export function companyMonogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
