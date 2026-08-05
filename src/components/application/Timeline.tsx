import { cn } from "@/lib/cn";
import type { ReviewAction, ReviewEntry } from "@/types/contracts";

function formatTimelineDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function actorLabel(entry: ReviewEntry): string {
  if (entry.actorRole === "student") return "You";
  if (entry.actorRole === "faculty") {
    return entry.actorName.trim() ? entry.actorName : "Faculty reviewer";
  }
  if (entry.actorRole === "admin") return "Administrator";
  return entry.actorName.trim() || "Reviewer";
}

const ACTION_LABEL: Record<ReviewAction, string> = {
  approve: "Application approved",
  request_clarification: "Clarification requested",
  reject: "Application rejected",
  verify: "Experience verified",
  request_changes: "Changes requested",
  respond: "Response submitted",
};

type ActionVisual = {
  border: string;
  marker: string;
  label: string;
  markerLabel: string;
};

function actionVisual(action: ReviewAction): ActionVisual {
  switch (action) {
    case "request_clarification":
      return {
        border: "border-amber-200 bg-amber-50/60",
        marker: "bg-amber-100 text-amber-900 ring-amber-200",
        label: "text-amber-900",
        markerLabel: "Clarification requested",
      };
    case "approve":
    case "verify":
      return {
        border: "border-[#b8d4bc] bg-[#ecf8ee]/80",
        marker: "bg-[#ecf8ee] text-[#2d5038] ring-[#b8d4bc]",
        label: "text-[#2d5038]",
        markerLabel: "Approved",
      };
    case "reject":
      return {
        border: "border-red-200 bg-red-50/40",
        marker: "bg-red-100 text-red-800 ring-red-200",
        label: "text-red-900",
        markerLabel: "Rejected",
      };
    case "respond":
      return {
        border: "border-[#cdd8cf] bg-[#f4f8f5]",
        marker: "bg-white text-[#2a3d30] ring-[#cdd8cf]",
        label: "text-[#0f1812]",
        markerLabel: "Your response",
      };
    case "request_changes":
      return {
        border: "border-amber-200 bg-amber-50/40",
        marker: "bg-amber-100 text-amber-900 ring-amber-200",
        label: "text-amber-900",
        markerLabel: "Changes requested",
      };
    default:
      return {
        border: "border-[#dde5dc] bg-[#fafbf9]",
        marker: "bg-[#f4f8f5] text-[#5c6b62] ring-[#cdd8cf]",
        label: "text-[#0f1812]",
        markerLabel: "Update",
      };
  }
}

function TimelineMarker({ action }: { action: ReviewAction }) {
  const visual = actionVisual(action);

  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ring-inset",
        visual.marker,
      )}
      aria-hidden="true"
    >
      {action === "approve" || action === "verify" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12l5 5L20 7" />
        </svg>
      ) : action === "reject" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      ) : action === "request_clarification" || action === "request_changes" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 8v4M12 16h.01" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 10h6M9 14h4" />
          <path d="M6 4h12v16H6z" />
        </svg>
      )}
    </span>
  );
}

function TimelineEntry({ entry, isLast }: { entry: ReviewEntry; isLast: boolean }) {
  const visual = actionVisual(entry.action);

  return (
    <li className="relative grid min-w-0 grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 gap-y-0 pb-6 last:pb-0">
      <div className="relative flex flex-col items-center">
        <TimelineMarker action={entry.action} />
        {!isLast && (
          <span
            className="absolute top-9 bottom-0 left-1/2 w-px -translate-x-1/2 bg-[#dde5dc]"
            aria-hidden="true"
          />
        )}
      </div>
      <article className={cn("min-w-0 rounded-xl border px-4 py-3 sm:px-5", visual.border)}>
        <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <div className="min-w-0">
            <p className={cn("text-sm font-semibold", visual.label)}>{ACTION_LABEL[entry.action]}</p>
            <p className="sr-only">{visual.markerLabel}</p>
          </div>
          <time className="shrink-0 text-xs text-[#8a968d]" dateTime={entry.createdAt}>
            {formatTimelineDate(entry.createdAt)}
          </time>
        </header>
        <p className="mt-1 text-xs font-medium text-[#5c6b62]">{actorLabel(entry)}</p>
        {entry.reason?.trim() && (
          <p className="mt-2 text-sm leading-relaxed break-words text-[#3d4a42]">{entry.reason}</p>
        )}
      </article>
    </li>
  );
}

export function Timeline({ entries }: { entries: ReviewEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-[#5c6b62]">No review activity yet.</p>;
  }

  const ordered = [...entries].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <ol className="min-w-0" aria-label="Application progress">
      {ordered.map((entry, index) => (
        <TimelineEntry key={entry.id} entry={entry} isLast={index === ordered.length - 1} />
      ))}
    </ol>
  );
}

/** Most recent faculty clarification request from the timeline, if any. */
export function latestFacultyClarification(
  entries: ReviewEntry[],
  fallbackReason: string | null,
): string | null {
  const requests = entries.filter(
    (entry) => entry.action === "request_clarification" && entry.actorRole === "faculty",
  );
  const latest = requests.at(-1);
  return latest?.reason?.trim() || fallbackReason?.trim() || null;
}
