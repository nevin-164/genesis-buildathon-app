import "server-only";

import { requireRole } from "@/lib/auth/dal";
import type { DocumentRef } from "@/types/contracts";

/** STUB — package 2 owns this file. */

export const ALLOWED_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg"] as const;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

export async function requestUploadUrl(input: {
  internshipId: string;
  /** Free text. DOCUMENT_TYPES are suggestions, not a whitelist. */
  docType: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<{ documentId: string; uploadUrl: string }> {
  await requireRole("student");
  // Real version: authorise, validate mime + size, BUILD THE PATH SERVER-SIDE
  // as internship/<id>/<uuid>.<ext>, insert a pending documents row, then sign
  // an upload URL for that exact path.
  return {
    documentId: "doc1",
    uploadUrl: `https://example.invalid/upload/${input.internshipId}`,
  };
}

/**
 * Real version re-authorises from scratch and reads the object's ACTUAL size
 * and content type from storage, deleting it if the rules were broken. This
 * step is not optional — between signing and uploading, the client controls
 * the bytes.
 */
export async function confirmUpload(documentId: string): Promise<DocumentRef> {
  await requireRole("student");
  return {
    id: documentId,
    docType: "Completion certificate",
    originalFilename: "certificate.pdf",
    sizeBytes: 245_760,
    downloadUrl: `/api/documents/${documentId}/download`,
  };
}

export async function deleteDocument(_documentId: string): Promise<void> {
  await requireRole("student");
}
