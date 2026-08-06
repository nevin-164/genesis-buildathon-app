import { z } from "zod";

/* ── Constants ──────────────────────────────────────────────────────────── */

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
] as const;

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

/** Maps allowed MIME types to file extensions (for server-side path building). */
export const mimeToExt: Record<(typeof ALLOWED_MIME_TYPES)[number], string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
};

/* ── Upload request schema ──────────────────────────────────────────────── */

export const uploadRequestSchema = z.object({
  /**
   * Which internship the file is attached to. This decides whose internship is
   * loaded and therefore who is allowed to upload, so it has to be validated
   * here rather than read off the raw request.
   */
  internshipId: z.string().uuid("That is not a valid internship."),
  docType: z.string().min(1, "Document type is required").max(200),
  filename: z.string().min(1, "Filename is required").max(500),
  mimeType: z.enum(ALLOWED_MIME_TYPES, {
    message: "Only PDF, PNG, and JPEG files are allowed",
  }),
  sizeBytes: z
    .number()
    .int()
    .min(1, "File cannot be empty")
    .max(MAX_UPLOAD_BYTES, "File exceeds 10 MB limit"),
});

export type UploadRequest = z.infer<typeof uploadRequestSchema>;
