import {
  BTN_PRIMARY_SM,
  FAINT,
  INK,
  NOTICE_WARNING,
  PANEL,
  SECTION_TITLE,
} from "@/components/staff/staff-ui";
import { cn } from "@/lib/cn";

interface EvidenceFileProps {
  title: string;
  /** A `DocumentRef`, or null when nothing was attached. */
  evidence?: {
    originalFilename?: string | null;
    sizeBytes?: number | null;
    downloadUrl?: string | null;
  } | null;
}

export function EvidenceViewer({ title, evidence }: EvidenceFileProps) {
  if (!evidence || !evidence.downloadUrl) {
    return (
      <div className={NOTICE_WARNING}>
        <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#c9a961]">
          {title}
        </h4>
        <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#f5c563]">
          <span className="text-base" aria-hidden="true">
            &#9888;
          </span>
          No evidence document attached
        </p>
      </div>
    );
  }

  const formattedSize = evidence.sizeBytes
    ? `${(evidence.sizeBytes / 1024).toFixed(0)} KB`
    : null;

  return (
    <div className={cn(PANEL, "p-4")}>
      <h4 className={SECTION_TITLE}>{title}</h4>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-[#1b2a21] bg-[#080e0b] p-3">
        <div className="min-w-0">
          <p className={cn("truncate text-sm font-semibold", INK)}>
            {evidence.originalFilename || "document.pdf"}
          </p>
          {formattedSize && (
            <p className={cn("mt-0.5 font-mono text-xs", FAINT)}>{formattedSize}</p>
          )}
        </div>

        <a
          href={evidence.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={BTN_PRIMARY_SM}
        >
          View <span aria-hidden="true">&rarr;</span>
        </a>
      </div>
    </div>
  );
}
