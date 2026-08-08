/** Must stay aligned with src/controllers/evidence.controller.ts — do not edit the controller. */

export const OFFER_LETTER_ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
] as const;

export type OfferLetterMimeType = (typeof OFFER_LETTER_ACCEPTED_MIME_TYPES)[number];

export const OFFER_LETTER_MAX_BYTES = 10 * 1024 * 1024;

export const OFFER_LETTER_ACCEPT_LABEL = "PDF, PNG or JPEG";
export const OFFER_LETTER_MAX_SIZE_LABEL = "10 MB maximum";

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateOfferLetterFile(file: File): string | null {
  if (!OFFER_LETTER_ACCEPTED_MIME_TYPES.includes(file.type as OfferLetterMimeType)) {
    return `Use ${OFFER_LETTER_ACCEPT_LABEL} only.`;
  }
  if (file.size > OFFER_LETTER_MAX_BYTES) {
    return `File must be ${OFFER_LETTER_MAX_SIZE_LABEL.toLowerCase()}.`;
  }
  if (file.size === 0) {
    return "Choose a non-empty file.";
  }
  return null;
}
