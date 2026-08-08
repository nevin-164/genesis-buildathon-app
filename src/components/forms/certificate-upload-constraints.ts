/** Certificate upload rules per Student Frontend PDF — PDF only, 5 MB max. */

export const CERTIFICATE_ACCEPTED_MIME_TYPES = ["application/pdf"] as const;

export const CERTIFICATE_MAX_BYTES = 5 * 1024 * 1024;

export const CERTIFICATE_ACCEPT_LABEL = "PDF only";
export const CERTIFICATE_MAX_SIZE_LABEL = "5 MB maximum";

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateCertificateFile(file: File): string | null {
  if (!CERTIFICATE_ACCEPTED_MIME_TYPES.includes(file.type as "application/pdf")) {
    return `${CERTIFICATE_ACCEPT_LABEL}.`;
  }
  if (file.size > CERTIFICATE_MAX_BYTES) {
    return `File must be ${CERTIFICATE_MAX_SIZE_LABEL.toLowerCase()}.`;
  }
  if (file.size === 0) {
    return "Choose a non-empty file.";
  }
  return null;
}
