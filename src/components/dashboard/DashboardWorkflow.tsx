import Link from "next/link";
import type { ReactNode } from "react";

import { ChevronRightIcon } from "@/components/explore/explore-icons";
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
  BTN_SECONDARY,
  DIVIDER,
  EYEBROW,
  FOCUS_RING,
  HOVER_LIFT,
  INK,
  META,
  MOTION,
  SECTION_TITLE,
} from "@/components/student/student-ui";
import { CompanyMark, DefinitionStrip, QuoteBlock, SectionHeading } from "@/components/student/primitives";
import { formatDisplayDate } from "./dashboard-utils";

function WorkspaceRow({
  label,
  companyName,
  roleTitle,
  badge,
  metaItems,
  feedback,
  href,
  cta,
}: {
  label: string;
  companyName: string;
  roleTitle: string;
  badge: React.ReactNode;
  metaItems: { label: string; value: React.ReactNode }[];
  feedback?: string | null;
  href: string;
  cta: string;
}) {
  return (
    <article className="min-w-0 py-5 first:pt-0 last:pb-0">
      <div className="grid min-w-0 gap-5 lg:grid-cols-12 lg:items-start lg:gap-6">
        <div className="flex min-w-0 gap-4 lg:col-span-7">
          <CompanyMark name={companyName} size="lg" />
          <div className="min-w-0 flex-1">
            <p className={EYEBROW}>{label}</p>
            <h3 className={cn(SECTION_TITLE, "mt-1")}>{companyName}</h3>
            <p className="mt-0.5 text-sm font-medium text-[var(--il-moss)]">{roleTitle}</p>
            <div className="mt-3">
              <DefinitionStrip items={metaItems} />
            </div>
            {feedback?.trim() && (
              <div className="mt-4">
                <QuoteBlock label="Faculty feedback">{feedback}</QuoteBlock>
              </div>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 lg:col-span-5 lg:items-end lg:pt-1">
          {badge}
          <Link
            href={href}
            className={cn(
              BTN_SECONDARY,
              "inline-flex min-h-11 w-full items-center justify-center gap-1.5 sm:w-auto",
              MOTION,
              HOVER_LIFT,
              FOCUS_RING,
            )}
          >
            {cta}
            <ChevronRightIcon aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
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
    <section aria-labelledby="workspace-heading">
      <SectionHeading
        title="Your internship workspace"
        description="Application and experience connected as one journey."
      />

      <div className={cn("mt-4 divide-y divide-[var(--il-border)]")}>
        {hasContributable && dashboard.contributable && (
          <WorkspaceRow
            label="Ready to contribute"
            companyName={dashboard.contributable.companyName}
            roleTitle={dashboard.contributable.roleTitle}
            badge={
              <span className="inline-flex rounded-lg bg-[color-mix(in_srgb,var(--il-lime)_15%,var(--il-ivory))] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--il-leaf)]">
                Approved internship
              </span>
            }
            metaItems={[
              {
                label: "Internship dates",
                value: `${formatDisplayDate(dashboard.contributable.startDate)} – ${formatDisplayDate(dashboard.contributable.endDate)}`,
              },
            ]}
            href="/student/experience"
            cta="Share your experience"
          />
        )}

        {hasApplication && dashboard.application && (
          <WorkspaceRow
            label="Application"
            companyName={dashboard.application.companyName}
            roleTitle={dashboard.application.roleTitle}
            badge={
              <Badge tone={APPLICATION_STATUS_TONE[dashboard.application.status]}>
                {APPLICATION_STATUS_LABEL[dashboard.application.status]}
              </Badge>
            }
            metaItems={[
              {
                label: "Dates",
                value: `${formatDisplayDate(dashboard.application.startDate)} – ${formatDisplayDate(dashboard.application.endDate)}`,
              },
              {
                label: "Submitted",
                value: dashboard.application.submittedAt
                  ? formatDisplayDate(dashboard.application.submittedAt)
                  : dashboard.application.status === "draft"
                    ? "Not yet"
                    : "—",
              },
              {
                label: "Advisor",
                value: dashboard.application.facultyName ?? "Not assigned",
              },
            ]}
            feedback={
              dashboard.application.status === "clarification_requested" ||
              dashboard.application.status === "rejected"
                ? dashboard.application.latestReason
                : null
            }
            href={`/student/application/${dashboard.application.id}`}
            cta="View application"
          />
        )}

        {hasExperience && dashboard.experience && (
          <WorkspaceRow
            label="Experience report"
            companyName={dashboard.experience.companyName}
            roleTitle={dashboard.experience.roleTitle}
            badge={
              <Badge tone={EXPERIENCE_STATUS_TONE[dashboard.experience.status]}>
                {EXPERIENCE_STATUS_LABEL[dashboard.experience.status]}
              </Badge>
            }
            metaItems={[
              {
                label: "Submitted",
                value: dashboard.experience.submittedAt
                  ? formatDisplayDate(dashboard.experience.submittedAt)
                  : "Not yet",
              },
            ]}
            feedback={
              dashboard.experience.status === "changes_requested"
                ? dashboard.experience.latestReason
                : null
            }
            href={
              dashboard.experience.status === "verified"
                ? `/student/explore/${dashboard.experience.id}`
                : dashboard.experience.status === "draft" ||
                    dashboard.experience.status === "changes_requested"
                  ? `/student/experience/${dashboard.experience.id}/edit`
                  : `/student/experience/${dashboard.experience.id}`
            }
            cta={
              dashboard.experience.status === "verified"
                ? "View Reality Card"
                : dashboard.experience.status === "draft" ||
                    dashboard.experience.status === "changes_requested"
                  ? "Continue report"
                  : "View report"
            }
          />
        )}
      </div>
    </section>
  );
}
