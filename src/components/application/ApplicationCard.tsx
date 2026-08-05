import Link from "next/link";

import { ChevronRightIcon } from "@/components/explore/explore-icons";
import { exploreDisplay } from "@/components/explore/explore-font";
import {
  BTN_GHOST,
  BTN_PRIMARY,
  CARD_COMPANY,
  CARD_ROLE,
  DISPLAY_SECTION,
  FOCUS_RING,
  INK,
  MOTION,
  MUTED,
  MUTED_LIGHT,
  PANEL,
} from "@/components/explore/explore-ui";
import { Badge } from "@/components/ui";
import {
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_TONE,
  DOMAINS,
  labelFor,
} from "@/lib/constants/options";
import { cn } from "@/lib/cn";
import type { ApplicationListItem, ApplicationStatus } from "@/types/contracts";

function formatDisplayDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatSubmitted(application: ApplicationListItem): string {
  if (application.submittedAt) {
    return formatDisplayDate(application.submittedAt);
  }
  if (application.status === "draft") {
    return "Not submitted yet";
  }
  return "—";
}

function companyMonogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function statusEyebrow(status: ApplicationStatus): string | null {
  switch (status) {
    case "clarification_requested":
      return "Action required";
    case "draft":
      return "Incomplete";
    case "submitted":
      return "Under review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Not approved";
    default:
      return null;
  }
}

function statusHint(status: ApplicationStatus): string | null {
  switch (status) {
    case "draft":
      return "Finish and submit your application when the details are ready.";
    case "submitted":
      return "Your application is waiting for faculty review.";
    case "approved":
      return "Your internship plan has faculty approval.";
    default:
      return null;
  }
}

type StatusAction = {
  label: string;
  href: string;
  variant: "primary" | "ghost";
  showFeedback: boolean;
  feedbackLabel?: string;
};

function statusAction(application: ApplicationListItem): StatusAction {
  const base = `/student/application/${application.id}`;

  switch (application.status) {
    case "clarification_requested":
      return {
        label: "View and respond",
        href: base,
        variant: "primary",
        showFeedback: true,
        feedbackLabel: "Faculty feedback",
      };
    case "rejected":
      return {
        label: "View feedback",
        href: base,
        variant: "ghost",
        showFeedback: true,
        feedbackLabel: "Feedback",
      };
    case "draft":
      return {
        label: "Continue application",
        href: `${base}/edit`,
        variant: "primary",
        showFeedback: false,
      };
    case "submitted":
      return {
        label: "View application",
        href: base,
        variant: "ghost",
        showFeedback: false,
      };
    case "approved":
      return {
        label: "View approval",
        href: base,
        variant: "ghost",
        showFeedback: false,
      };
    default:
      return {
        label: "View application",
        href: base,
        variant: "ghost",
        showFeedback: false,
      };
  }
}

function accentBarClass(status: ApplicationStatus): string {
  switch (status) {
    case "clarification_requested":
      return "bg-amber-400";
    case "approved":
      return "bg-[#c8ef5a]";
    case "rejected":
      return "bg-red-300";
    case "submitted":
      return "bg-blue-300";
    default:
      return "bg-[#c8ef5a]/70";
  }
}

export function ApplicationCard({ application }: { application: ApplicationListItem }) {
  const domainLabel = labelFor(DOMAINS, application.domain);
  const action = statusAction(application);
  const eyebrow = statusEyebrow(application.status);
  const hint = statusHint(application.status);
  const dateRange = `${formatDisplayDate(application.startDate)} – ${formatDisplayDate(application.endDate)}`;
  const advisorLabel =
    application.facultyName ?? "Waiting for a faculty advisor to be assigned";
  const submittedText = formatSubmitted(application);

  return (
    <article
      className={cn(
        PANEL,
        "relative flex h-full min-w-0 flex-col overflow-hidden p-0",
        application.status === "approved" && "border-[#b8d4bc] bg-[#f4f8f5]",
        application.status === "clarification_requested" && "border-amber-200/80",
      )}
    >
      <span
        className={cn("absolute inset-x-0 top-0 h-0.5", accentBarClass(application.status))}
        aria-hidden="true"
      />

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <header className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {eyebrow && (
              <p className={cn("text-[10px] font-semibold uppercase tracking-[0.14em]", MUTED_LIGHT)}>
                {eyebrow}
              </p>
            )}
            <Badge tone={APPLICATION_STATUS_TONE[application.status]}>
              {APPLICATION_STATUS_LABEL[application.status]}
            </Badge>
          </div>

          <div className="mt-3 flex gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0f1812] text-xs font-bold text-[#c8ef5a]"
              aria-hidden="true"
            >
              {companyMonogram(application.companyName)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className={cn("break-words", CARD_COMPANY, exploreDisplay.className)}>
                {application.companyName}
              </h2>
              <p className={cn("mt-0.5 break-words", CARD_ROLE)}>{application.roleTitle}</p>
            </div>
          </div>

          <p className={cn("mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs", MUTED)}>
            <span>{domainLabel}</span>
            <span aria-hidden="true" className="text-[#cdd8cf]">
              ·
            </span>
            <span className="break-words">{dateRange}</span>
            <span aria-hidden="true" className="text-[#cdd8cf]">
              ·
            </span>
            <span>
              Submitted: <span className={INK}>{submittedText}</span>
            </span>
          </p>

          {hint && (
            <p className={cn("mt-2 text-xs leading-relaxed", MUTED)}>{hint}</p>
          )}
        </header>

        {action.showFeedback && application.latestReason?.trim() && (
          <div
            className={cn(
              "mt-4 rounded-lg border px-3 py-2.5",
              application.status === "rejected"
                ? "border-red-200/80 bg-red-50/40"
                : "border-amber-200/80 bg-amber-50/60",
            )}
          >
            {action.feedbackLabel && (
              <p className={cn("text-[10px] font-semibold uppercase tracking-wide", MUTED_LIGHT)}>
                {action.feedbackLabel}
              </p>
            )}
            <p className="mt-1 text-sm leading-relaxed break-words text-[#3d4a42]">
              {application.latestReason}
            </p>
          </div>
        )}

        <footer className="mt-auto space-y-3 border-t border-[#e4ebe4] pt-4">
          <p className={cn("text-xs leading-relaxed break-words", MUTED)}>
            <span className={cn("font-medium", INK)}>Faculty advisor: </span>
            {advisorLabel}
          </p>
          <Link
            href={action.href}
            className={cn(
              action.variant === "primary" ? BTN_PRIMARY : BTN_GHOST,
              "inline-flex w-full items-center justify-center gap-1 px-4 py-2.5 text-sm sm:w-auto",
              MOTION,
              FOCUS_RING,
            )}
          >
            {action.label}
            <ChevronRightIcon aria-hidden="true" />
          </Link>
        </footer>
      </div>
    </article>
  );
}
