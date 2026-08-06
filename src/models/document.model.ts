import "server-only";

import { count, eq } from "drizzle-orm";

import { db, documents } from "@/db";
import type { DocumentRef } from "@/types/contracts";

type NewDocument = typeof documents.$inferInsert;

/* ── Queries ────────────────────────────────────────────────────────────── */

/**
 * List all documents for an internship.
 * Maps the physical `storagePath` into a short-lived download route URL.
 * The raw storage path NEVER leaves the backend.
 */
export async function listByInternship(
  internshipId: string,
): Promise<DocumentRef[]> {
  const rows = await db
    .select({
      id: documents.id,
      docType: documents.docType,
      originalFilename: documents.originalFilename,
      sizeBytes: documents.sizeBytes,
    })
    .from(documents)
    .where(eq(documents.internshipId, internshipId))
    .orderBy(documents.uploadedAt);

  return rows.map((row) => ({
    ...row,
    downloadUrl: `/api/documents/${row.id}/download`,
  }));
}

/**
 * Just the count. Used by the faculty queue builder so it doesn't have
 * to drag all the document rows over the wire just to get `length`.
 */
export async function countByInternship(internshipId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(documents)
    .where(eq(documents.internshipId, internshipId));

  return row?.value ?? 0;
}

/**
 * Find a specific document by its ID. Returns the full DB row (including
 * the raw `storagePath` so the controller can delete/download it from Supabase).
 */
export async function findById(id: string) {
  const [row] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);

  return row ?? null;
}

/* ── Mutations ──────────────────────────────────────────────────────────── */

/**
 * Insert a new document record.
 */
export async function create(data: NewDocument) {
  const [row] = await db.insert(documents).values(data).returning();
  return row!;
}

/**
 * Delete a document from the database.
 * IMPORTANT: The caller must delete the physical file from Supabase Storage FIRST.
 */
export async function deleteById(id: string): Promise<void> {
  await db.delete(documents).where(eq(documents.id, id));
}
