import "server-only";

import { randomUUID } from "crypto";
import { requireRole } from "@/lib/auth/dal";
import * as DocumentModel from "@/models/document.model";
import * as InternshipModel from "@/models/internship.model";
import * as StorageService from "@/services/storage.service";
import { parseOrThrow } from "@/lib/validators/parse";
import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  mimeToExt,
  uploadRequestSchema,
} from "@/lib/validators/document.schema";
import { isEditable } from "@/lib/validators/internship.schema";
import type { DocumentRef } from "@/types/contracts";

export { ALLOWED_MIME_TYPES, MAX_UPLOAD_BYTES };

export async function requestUploadUrl(
  input: unknown,
): Promise<{ documentId: string; uploadUrl: string }> {
  const user = await requireRole("student");

  // The schema is the only thing that decides the shape — read the id off the
  // parsed value, not off the raw input.
  const parsed = parseOrThrow(uploadRequestSchema, input);
  const internshipId = parsed.internshipId;

  const internship = await InternshipModel.findById(internshipId);
  if (!internship || internship.studentId !== user.id) {
    throw new Error("Not Found");
  }
  if (!isEditable(internship.status)) {
    throw new Error("Internship is locked. Cannot upload documents.");
  }

  const ext = mimeToExt[parsed.mimeType as keyof typeof mimeToExt];
  // Server-side path construction prevents client-side directory traversal
  const storagePath = `internship/${internshipId}/${randomUUID()}.${ext}`;

  const newDoc = await DocumentModel.create({
    internshipId,
    docType: parsed.docType,
    originalFilename: parsed.filename,
    mimeType: parsed.mimeType,
    sizeBytes: parsed.sizeBytes,
    storagePath,
    uploadedBy: user.id,
  });

  const uploadUrl = await StorageService.createSignedUploadUrl(storagePath);

  return {
    documentId: newDoc.id,
    uploadUrl,
  };
}

export async function confirmUpload(documentId: string): Promise<DocumentRef> {
  const user = await requireRole("student");

  const doc = await DocumentModel.findById(documentId);
  if (!doc || doc.uploadedBy !== user.id) {
    throw new Error("Not Found");
  }

  const internship = await InternshipModel.findById(doc.internshipId);
  if (!internship || internship.studentId !== user.id) {
    throw new Error("Not Found");
  }

  // Double-verify the file that ACTUALLY arrived in storage
  const meta = await StorageService.getObjectMeta(doc.storagePath);
  
  if (!meta) {
    await DocumentModel.deleteById(documentId);
    throw new Error("File not found in storage. Did the upload complete?");
  }

  if (meta.sizeBytes > MAX_UPLOAD_BYTES || !(ALLOWED_MIME_TYPES as readonly string[]).includes(meta.mimeType)) {
    // Client sent malicious bytes using the signed URL we gave them
    await StorageService.deleteObject(doc.storagePath);
    await DocumentModel.deleteById(documentId);
    throw new Error("Uploaded file violates size or type restrictions.");
  }

  return {
    id: doc.id,
    docType: doc.docType,
    originalFilename: doc.originalFilename,
    sizeBytes: meta.sizeBytes,
    downloadUrl: `/api/documents/${doc.id}/download`,
  };
}

export async function deleteDocument(documentId: string): Promise<void> {
  const user = await requireRole("student");
  const doc = await DocumentModel.findById(documentId);
  
  if (!doc) {
    throw new Error("Not Found");
  }

  const internship = await InternshipModel.findById(doc.internshipId);
  if (!internship || internship.studentId !== user.id) {
    throw new Error("Not Found");
  }
  if (!isEditable(internship.status)) {
    throw new Error("Internship is locked. Cannot delete documents.");
  }

  await StorageService.deleteObject(doc.storagePath);
  await DocumentModel.deleteById(documentId);
}
