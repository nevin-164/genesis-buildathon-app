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
};

function actionVisual(action: ReviewAction): ActionVisual {
  switch (action) {
    case "request_clarification":
      return {
        border: "border-amber-200 bg-amber-50/60",
        marker: "bg-amber-100 text-amber-900 ring-amber-200",
        label: "text-amber-900",
      };
    case "approve":
    case "verify":
      return {
        border: "border-green-200 bg-green-50/50",
        marker: "bg-green-100 text-green-900 ring-green-200",
        label: "text-green-900",
      };
    case "reject":
      return {
        border: "border-red-200 bg-red-50/40",
        marker: "bg-red-100 text-red-800 ring-red-200",
        label: "text-red-900",
      };
    case "respond":
      return {
        border: "border-blue-200 bg-blue-50/40",
        marker: "bg-blue-100 text-blue-900 ring-blue-200",
        label: "text-blue-900",
      };
    case "request_changes":
      return {
        border: "border-amber-200 bg-amber-50/40",
        marker: "bg-amber-100 text-amber-900 ring-amber-200",
        label: "text-amber-900",
      };
    default:
      return {
        border: "border-zinc-200 bg-zinc-50/50",
        marker: "bg-zinc-100 text-zinc-800 ring-zinc-200",
        label: "text-zinc-900",
      };
  }
}

function TimelineEntry({ entry, isLast }: { entry: ReviewEntry; isLast: boolean }) {
  const visual = actionVisual(entry.action);

  return (
    <li className="relative flex min-w-0 gap-3 pb-6 last:pb-0">
      <div className="flex w-8 shrink-0 flex-col items-center">
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ring-1 ring-inset",
            visual.marker,
          )}
          aria-hidden="true"
        >
          {entry.actorRole === "student" ? "You" : entry.actorRole === "faculty" ? "F" : "A"}
        </span>
        {!isLast && (
          <span className="mt-1 min-h-[1rem] w-px flex-1 bg-zinc-200" aria-hidden="true" />
        )}
      </div>
      <article
        className={cn(
          "min-w-0 flex-1 rounded-lg border px-3 py-3 sm:px-4",
          visual.border,
        )}
      >
        <header className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
          <p className={cn("text-sm font-semibold", visual.label)}>{ACTION_LABEL[entry.action]}</p>
          <time className="text-xs text-zinc-500" dateTime={entry.createdAt}>
            {formatTimelineDate(entry.createdAt)}
          </time>
        </header>
        <p className="mt-1 text-xs font-medium text-zinc-600">{actorLabel(entry)}</p>
        {entry.reason?.trim() && (
          <p className="mt-2 text-sm leading-relaxed break-words text-zinc-700">{entry.reason}</p>
        )}
      </article>
    </li>
  );
}

export function Timeline({ entries }: { entries: ReviewEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-zinc-500">No review activity yet.</p>
    );
  }

  const ordered = [...entries].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <ol className="min-w-0" aria-label="Application review timeline">
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
