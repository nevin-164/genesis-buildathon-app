import { FileUploadField } from "@/components/forms/FileUploadField";
import { RemoveDocumentButton } from "@/components/internship/RemoveDocumentButton";
import {
  INK,
  MUTED,
  MUTED_LIGHT,
  PANEL,
  SECTION_HEADING,
} from "@/components/explore/explore-ui";
import { cn } from "@/lib/cn";
import type { DocumentRef } from "@/types/contracts";

/** Kilobytes until it stops being sensible, then megabytes. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/**
 * The documents attached to one internship.
 *
 * Verification is a check against these, so an internship with none is the
 * advisor's first red flag — the queue counts them for exactly that reason.
 * The panel says so plainly rather than presenting an empty list as normal.
 *
 * `editable` is the backend's `canEdit`, not a guess: once the internship is
 * with the advisor the files are part of what they are reviewing, and the
 * controller refuses to change them regardless of what this renders.
 */
export function DocumentsPanel({
  internshipId,
  documents,
  editable,
}: {
  internshipId: string;
  documents: DocumentRef[];
  editable: boolean;
}) {
  return (
    <section className={cn(PANEL, "p-4 sm:p-5")} aria-labelledby="documents-heading">
      <h2 id="documents-heading" className={SECTION_HEADING}>
        Documents
      </h2>
      <p className={cn("mt-1 text-sm", MUTED)}>
        {editable
          ? "Attach your certificate, offer letter, logbook or payslip."
          : "What this internship was verified against."}
      </p>

      {documents.length === 0 ? (
        <p className="mt-4 rounded-lg border border-amber-200/90 bg-amber-50/60 px-3 py-2.5 text-sm text-amber-900">
          {editable
            ? "Nothing attached yet. Advisors question an internship with no documents."
            : "Nothing was attached to this internship."}
        </p>
      ) : (
        <ul className="mt-4 space-y-2" aria-label="Attached documents">
          {documents.map((document) => (
            <li
              key={document.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e8ede6] bg-[#fafbf9] px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm font-semibold", INK)}>
                  {document.docType}
                </p>
                <p className={cn("truncate text-xs", MUTED_LIGHT)}>
                  {document.originalFilename} · {formatFileSize(document.sizeBytes)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <a
                  href={document.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-[#2d5038] underline underline-offset-2 hover:text-[#0f1812]"
                >
                  Open
                </a>
                {editable && (
                  <RemoveDocumentButton
                    documentId={document.id}
                    internshipId={internshipId}
                    label={document.docType}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {editable && (
        <div className="mt-4">
          <FileUploadField internshipId={internshipId} />
        </div>
      )}
    </section>
  );
}
