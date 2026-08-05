import Link from "next/link";

import { Badge } from "@/components/ui";
import {
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_TONE,
  DOMAINS,
  labelFor,
} from "@/lib/constants/options";
import { cn } from "@/lib/cn";
import type { ApplicationListItem } from "@/types/contracts";

function formatDisplayDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatLastUpdated(application: ApplicationListItem): string {
  if (application.submittedAt) {
    return formatDisplayDate(application.submittedAt);
  }
  if (application.status === "draft") {
    return "Not submitted yet";
  }
  return "—";
}

type StatusAction = {
  label: string;
  href: string;
  showReason: boolean;
};

function statusAction(application: ApplicationListItem): StatusAction {
  const base = `/student/application/${application.id}`;

  switch (application.status) {
    case "clarification_requested":
      return { label: "View and reply", href: base, showReason: true };
    case "rejected":
      return { label: "View feedback", href: base, showReason: true };
    case "draft":
      return { label: "Continue application", href: `${base}/edit`, showReason: false };
    case "submitted":
      return { label: "View application", href: base, showReason: false };
    case "approved":
      return { label: "View approval", href: base, showReason: false };
    default:
      return { label: "View application", href: base, showReason: false };
  }
}

const FOCUS_LINK = cn(
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2",
);

export function ApplicationCard({ application }: { application: ApplicationListItem }) {
  const domainLabel = labelFor(DOMAINS, application.domain);
  const action = statusAction(application);
  const dateRange = `${formatDisplayDate(application.startDate)} – ${formatDisplayDate(application.endDate)}`;
  const advisorLabel =
    application.facultyName ?? "Waiting for a faculty advisor to be assigned";

  return (
    <article
      className={cn(
        "flex h-full min-w-0 flex-col rounded-lg border border-zinc-200 bg-white p-4 shadow-sm",
        "sm:p-5",
      )}
    >
      <header className="flex min-w-0 flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-zinc-900 break-words">
            {application.companyName}
          </h2>
          <p className="mt-0.5 text-sm font-medium text-zinc-700 break-words">
            {application.roleTitle}
          </p>
        </div>
        <Badge tone={APPLICATION_STATUS_TONE[application.status]}>
          {APPLICATION_STATUS_LABEL[application.status]}
        </Badge>
      </header>

      <dl className="mt-3 space-y-2 text-sm">
        <div className="min-w-0">
          <dt className="text-xs font-medium text-zinc-500">Domain</dt>
          <dd className="mt-0.5 text-zinc-800 break-words">{domainLabel}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-medium text-zinc-500">Internship dates</dt>
          <dd className="mt-0.5 text-zinc-800 break-words">{dateRange}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-medium text-zinc-500">Submitted</dt>
          <dd className="mt-0.5 text-zinc-800 break-words">{formatLastUpdated(application)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-medium text-zinc-500">Faculty advisor</dt>
          <dd className="mt-0.5 text-zinc-800 break-words">{advisorLabel}</dd>
        </div>
      </dl>

      {action.showReason && application.latestReason?.trim() && (
        <p
          className={cn(
            "mt-3 rounded-md border px-3 py-2 text-sm leading-relaxed break-words",
            application.status === "rejected"
              ? "border-red-200 bg-red-50/50 text-zinc-700"
              : "border-amber-200 bg-amber-50/50 text-zinc-700",
          )}
        >
          {application.latestReason}
        </p>
      )}

      <footer className="mt-auto border-t border-zinc-100 pt-3">
        <Link
          href={action.href}
          className={cn(
            "inline-flex items-center text-sm font-semibold text-zinc-900",
            "hover:text-zinc-700 hover:underline",
            FOCUS_LINK,
          )}
        >
          {action.label} →
        </Link>
      </footer>
    </article>
  );
}
