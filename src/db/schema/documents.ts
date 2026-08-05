import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { internships } from "./internships";
import { users } from "./users";

/**
 * Whatever the student attaches to back the card up — completion certificate,
 * logbook, offer letter, payslip. Faculty read the list when verifying.
 *
 * Files live in a PRIVATE Supabase Storage bucket and are only ever served
 * through short-lived signed URLs. Nothing here is public, not even on a
 * published card: the card publishes data, not documents.
 */
export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    internshipId: uuid("internship_id")
      .notNull()
      .references(() => internships.id, { onDelete: "cascade" }),
    /**
     * What the student says the document is — "Completion certificate",
     * "Week 3 logbook". Free text on purpose: the whole point is that they can
     * attach anything, so a new kind must never be a migration. The UI offers
     * DOCUMENT_TYPES as a datalist; this column accepts whatever they type.
     * Distinct from `mimeType`, which is what the bytes are.
     */
    docType: text("doc_type").notNull(),
    /** Built server-side. A client-supplied path would be a path-traversal hole. */
    storagePath: text("storage_path").notNull(),
    originalFilename: text("original_filename").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    uploadedBy: uuid("uploaded_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("documents_internship_idx").on(t.internshipId)],
);

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
