import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { internshipApplications } from "./applications";
import { evidenceKindEnum } from "./enums";
import { experiences } from "./experiences";
import { users } from "./users";

/**
 * Uploaded proof: the offer letter on an application, the completion certificate
 * on an experience. Files live in a PRIVATE Supabase Storage bucket and are only
 * ever served through short-lived signed URLs. Nothing here is public.
 */
export const evidenceFiles = pgTable(
  "evidence_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id").references(() => internshipApplications.id, {
      onDelete: "cascade",
    }),
    experienceId: uuid("experience_id").references(() => experiences.id, {
      onDelete: "cascade",
    }),
    kind: evidenceKindEnum("kind").notNull(),
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
  (t) => [
    index("evidence_application_idx").on(t.applicationId),
    index("evidence_experience_idx").on(t.experienceId),
    check(
      "evidence_one_owner_ck",
      sql`(${t.applicationId} is not null) <> (${t.experienceId} is not null)`,
    ),
  ],
);

export type EvidenceFile = typeof evidenceFiles.$inferSelect;
