import Link from "next/link";
import type { ReactNode } from "react";

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
  EXPERIENCE_STATUS_LABEL,
  EXPERIENCE_STATUS_TONE,
} from "@/lib/constants/options";
import { cn } from "@/lib/cn";
import type {
  ApplicationListItem,
  ContributableApplication,
  ExperienceListItem,
  StudentDashboard,
} from "@/types/contracts";

import {
  companyMonogram,
  DASH_CARD_HOVER,
  DASH_CARD_PAD,
  formatDisplayDate,
} from "./dashboard-utils";

type WorkflowCardProps = {
  eyebrow: string;
  headingId: string;
  companyName: string;
  roleTitle: string;
  badge: ReactNode;
  meta: ReactNode;
  href: string;
  cta: string;
  variant?: "default" | "mint" | "primary-cta";
};

function WorkflowCard({
  eyebrow,
  headingId,
  companyName,
  roleTitle,
  badge,
  meta,
  href,
  cta,
  variant = "default",
}: WorkflowCardProps) {
  return (
    <article
      className={cn(
        PANEL,
        DASH_CARD_PAD,
        DASH_CARD_HOVER,
        "flex min-w-0 flex-col",
        MOTION,
        variant === "mint" && "border-[#b8d4bc] bg-[#f4f8f5]",
        variant === "primary-cta" && "border-[#b8d4bc] bg-[#f4f8f5]",
      )}
      aria-labelledby={headingId}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <p className={cn("text-[10px] font-semibold uppercase tracking-[0.12em]", MUTED_LIGHT)}>
          {eyebrow}
        </p>
        {badge}
      </div>

      <div className="mt-3 flex min-w-0 gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0f1812] text-xs font-bold text-[#c8ef5a]"
          aria-hidden="true"
        >
          {companyMonogram(companyName)}
        </div>
        <div className="min-w-0 flex-1">
          <h3
            id={headingId}
            className={cn("break-words", CARD_COMPANY, exploreDisplay.className)}
          >
            {companyName}
          </h3>
          <p className={cn("mt-0.5 break-words", CARD_ROLE)}>{roleTitle}</p>
          <div className={cn("mt-2 text-xs leading-relaxed break-words", MUTED)}>{meta}</div>
        </div>
      </div>

      <div className="mt-4 border-t border-[#e8ede6] pt-3">
        <Link
          href={href}
          className={cn(
            variant === "primary-cta" ? BTN_PRIMARY : BTN_GHOST,
            "inline-flex min-h-11 w-full items-center justify-center gap-1 px-4 py-2.5 sm:w-auto",
            MOTION,
            FOCUS_RING,
          )}
        >
          {cta}
          <ChevronRightIcon aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function ApplicationWorkflowCard({ application }: { application: ApplicationListItem }) {
  const dateRange = `${formatDisplayDate(application.startDate)} – ${formatDisplayDate(application.endDate)}`;
  const submittedText = application.submittedAt
    ? formatDisplayDate(application.submittedAt)
    : application.status === "draft"
      ? "Not submitted yet"
      : "—";

  return (
    <WorkflowCard
      eyebrow="My application"
      headingId="dashboard-application-heading"
      companyName={application.companyName}
      roleTitle={application.roleTitle}
      badge={
        <Badge tone={APPLICATION_STATUS_TONE[application.status]}>
          {APPLICATION_STATUS_LABEL[application.status]}
        </Badge>
      }
      meta={
        <>
          <span>{dateRange}</span>
          <span aria-hidden="true" className="text-[#cdd8cf]">
            {" · "}
          </span>
          <span>
            Submitted: <span className={INK}>{submittedText}</span>
          </span>
          {application.facultyName && (
            <>
              <span aria-hidden="true" className="text-[#cdd8cf]">
                {" · "}
              </span>
              <span>
                Advisor: <span className={INK}>{application.facultyName}</span>
              </span>
            </>
          )}
        </>
      }
      href={`/student/application/${application.id}`}
      cta="View application"
    />
  );
}

function ExperienceWorkflowCard({ experience }: { experience: ExperienceListItem }) {
  const href =
    experience.status === "draft" || experience.status === "changes_requested"
      ? `/student/experience/${experience.id}/edit`
      : `/student/experience/${experience.id}`;
  const cta =
    experience.status === "draft" || experience.status === "changes_requested"
      ? "Continue experience"
      : "View experience";

  return (
    <WorkflowCard
      eyebrow="My experience"
      headingId="dashboard-experience-heading"
      companyName={experience.companyName}
      roleTitle={experience.roleTitle}
      badge={
        <Badge tone={EXPERIENCE_STATUS_TONE[experience.status]}>
          {EXPERIENCE_STATUS_LABEL[experience.status]}
        </Badge>
      }
      meta={
        experience.submittedAt ? (
          <>
            Submitted: <span className={INK}>{formatDisplayDate(experience.submittedAt)}</span>
          </>
        ) : (
          "Not submitted yet"
        )
      }
      href={href}
      cta={cta}
    />
  );
}

function ContributableWorkflowCard({ contributable }: { contributable: ContributableApplication }) {
  const dateRange = `${formatDisplayDate(contributable.startDate)} – ${formatDisplayDate(contributable.endDate)}`;

  return (
    <WorkflowCard
      eyebrow="Approved internship"
      headingId="dashboard-contributable-heading"
      companyName={contributable.companyName}
      roleTitle={contributable.roleTitle}
      badge={
        <span className="inline-flex rounded-md border border-[#b8d4bc] bg-[#ecf8ee] px-2 py-0.5 text-[10px] font-semibold text-[#2d5038]">
          Ready to contribute
        </span>
      }
      meta={dateRange}
      href="/student/experience"
      cta="Contribute experience"
      variant="primary-cta"
    />
  );
}

export function DashboardWorkflow({ dashboard }: { dashboard: StudentDashboard }) {
  const hasApplication = dashboard.application !== null;
  const hasExperience = dashboard.experience !== null;
  const hasContributable = dashboard.contributable !== null;

  if (!hasApplication && !hasExperience && !hasContributable) {
    return null;
  }

  return (
    <section className="min-w-0 space-y-4" aria-labelledby="dashboard-workflow-heading">
      <h2 id="dashboard-workflow-heading" className={cn(DISPLAY_SECTION, "text-base sm:text-lg")}>
        Your records
      </h2>

      <div className="grid min-w-0 gap-4">
        {hasContributable && dashboard.contributable && (
          <ContributableWorkflowCard contributable={dashboard.contributable} />
        )}
        {hasApplication && dashboard.application && (
          <ApplicationWorkflowCard application={dashboard.application} />
        )}
        {hasExperience && dashboard.experience && (
          <ExperienceWorkflowCard experience={dashboard.experience} />
        )}
      </div>
    </section>
  );
}
