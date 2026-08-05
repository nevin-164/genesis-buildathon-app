import "server-only";

import { requireRole } from "@/lib/auth/dal";
import type { EvidenceRef } from "@/types/contracts";

/** STUB — package 2 owns this file. */

export const ALLOWED_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg"] as const;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

export async function requestUploadUrl(input: {
  ownerType: "application" | "experience";
  ownerId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<{ evidenceId: string; uploadUrl: string }> {
  await requireRole("student");
  // Real version: authorise, validate mime + size, BUILD THE PATH SERVER-SIDE,
  // insert a pending evidence row, then sign an upload URL for that exact path.
  return { evidenceId: "ev1", uploadUrl: `https://example.invalid/upload/${input.ownerId}` };
}

/**
 * Real version re-authorises from scratch and reads the object's ACTUAL size
 * and content type from storage, deleting it if the rules were broken. This
 * step is not optional — between signing and uploading, the client controls
 * the bytes.
 */
export async function confirmUpload(evidenceId: string): Promise<EvidenceRef> {
  await requireRole("student");
  return {
    id: evidenceId,
    originalFilename: "offer-letter.pdf",
    sizeBytes: 245_760,
    downloadUrl: `/api/evidence/${evidenceId}/download`,
  };
}

export async function deleteEvidence(_evidenceId: string): Promise<void> {
  await requireRole("student");
}
