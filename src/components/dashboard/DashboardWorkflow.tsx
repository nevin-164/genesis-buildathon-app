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
  INTERNSHIP_STATUS_LABEL,
  INTERNSHIP_STATUS_TONE,
} from "@/lib/constants/options";
import { cn } from "@/lib/cn";
import type { InternshipListItem, StudentDashboard } from "@/types/contracts";

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

function InternshipWorkflowCard({ internship }: { internship: InternshipListItem }) {
  const isEditable =
    internship.status === "draft" || internship.status === "changes_requested";
  const href = isEditable
    ? `/student/internships/${internship.id}/edit`
    : `/student/internships/${internship.id}`;
  const cta = isEditable ? "Continue" : "View internship";

  return (
    <WorkflowCard
      eyebrow="My internship"
      headingId="dashboard-internship-heading"
      companyName={internship.companyName}
      roleTitle={internship.roleTitle}
      badge={
        <Badge tone={INTERNSHIP_STATUS_TONE[internship.status]}>
          {INTERNSHIP_STATUS_LABEL[internship.status]}
        </Badge>
      }
      meta={
        internship.submittedAt ? (
          <>
            Submitted: <span className={INK}>{formatDisplayDate(internship.submittedAt)}</span>
          </>
        ) : (
          "Not submitted yet"
        )
      }
      href={href}
      cta={cta}
      variant={isEditable ? "primary-cta" : "default"}
    />
  );
}

export function DashboardWorkflow({ dashboard }: { dashboard: StudentDashboard }) {
  if (!dashboard.internship) return null;

  return (
    <section className="min-w-0 space-y-4" aria-labelledby="dashboard-workflow-heading">
      <h2 id="dashboard-workflow-heading" className={cn(DISPLAY_SECTION, "text-base sm:text-lg")}>
        Your records
      </h2>

      <div className="grid min-w-0 gap-4">
        <InternshipWorkflowCard internship={dashboard.internship} />
      </div>
    </section>
  );
}
