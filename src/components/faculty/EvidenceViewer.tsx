interface EvidenceFileProps {
  title: string;
  evidence?: {
    originalFilename?: string | null;
    fileSizeBytes?: number | null;
    downloadUrl?: string | null;
  } | null;
}

export function EvidenceViewer({ title, evidence }: EvidenceFileProps) {
  if (!evidence || !evidence.downloadUrl) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
          {title}
        </h4>
        <div className="mt-2 flex items-center gap-2 text-sm font-medium text-amber-900 dark:text-amber-200">
          <span className="text-lg">&amp;#9888;</span>
          <span>No evidence document attached</span>
        </div>
      </div>
    );
  }

  const formattedSize = evidence.fileSizeBytes
    ? `${(evidence.fileSizeBytes / 1024).toFixed(0)} KB`
    : null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {title}
      </h4>
      <div className="mt-3 flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
        <div className="min-w-0 pr-2">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {evidence.originalFilename || "document.pdf"}
          </p>
          {formattedSize && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{formattedSize}</p>
          )}
        </div>
        <a
          href={evidence.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <span>View / Download</span>
          <span className="text-xs">&rarr;</span>
        </a>
      </div>
    </div>
  );
}
