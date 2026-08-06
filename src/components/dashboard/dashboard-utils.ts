export function formatDisplayDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function companyMonogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function initialsFromFullName(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function firstNameFromFullName(fullName: string): string | null {
  const trimmed = fullName.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0] ?? null;
}

/** Shared card shell — hover via CSS only (server-safe). */
export const DASH_CARD_HOVER =
  "hover:border-[#b5c4b8] hover:shadow-[0_6px_20px_rgba(15,24,18,0.07)] motion-reduce:hover:shadow-[0_1px_3px_rgba(15,24,18,0.05)]";

export const DASH_CARD_PAD = "p-4 sm:p-5";
