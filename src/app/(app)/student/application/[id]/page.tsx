import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { ClarificationBox } from "@/components/application/ClarificationBox";
import { latestFacultyClarification, Timeline } from "@/components/application/Timeline";
import { ChevronRightIcon } from "@/components/explore/explore-icons";
import { SkillChips } from "@/components/explore/SkillChips";
import {
  BTN_GHOST,
  BTN_PRIMARY,
  DISPLAY_COMPANY,
  DISPLAY_SECTION,
  FOCUS_RING,
  INK,
  LABEL,
  MOTION,
  MUTED,
  PANEL,
} from "@/components/explore/explore-ui";
import { StudentPageShell } from "@/components/layout/student-page-shell";
import { Badge } from "@/components/ui";
import { getMyApplication } from "@/controllers/application.controller";
import {
  APPLICATION_SOURCES,
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_TONE,
  DOMAINS,
  WORK_MODES,
  labelFor,
} from "@/lib/constants/options";
import { requireStudentPage } from "@/lib/auth/dal";
import { NotFoundError } from "@/lib/auth/errors";
import { cn } from "@/lib/cn";
import type { ApplicationDetail } from "@/types/contracts";

function formatDisplayDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatSubmittedAt(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatFee(amount: number | null): string {
  if (amount === null || amount === 0) return "No fee";
  return `Student will pay ₹${amount.toLocaleString("en-IN")}`;
}

function formatStipend(amount: number | null): string {
  if (amount === null || amount === 0) return "No stipend";
  return `Expected stipend ₹${amount.toLocaleString("en-IN")}`;
}

function DetailField({
  label,
  value,
  children,
}: {
  label: string;
  value?: string | null;
  children?: ReactNode;
}) {
  const content = children ?? value;
  if (content === null || content === undefined || content === "") return null;

  return (
    <div className="min-w-0">
      <dt className={LABEL}>{label}</dt>
      <dd className={cn("mt-0.5 text-sm break-words", INK)}>{content}</dd>
    </div>
  );
}

function ApplicationDetailView({ application }: { application: ApplicationDetail }) {
  const domainLabel = labelFor(DOMAINS, application.domain);
  const modeLabel = labelFor(WORK_MODES, application.workMode);
  const sourceLabel = application.applicationSource
    ? labelFor(APPLICATION_SOURCES, application.applicationSource)
    : null;
  const durationLabel = `${application.durationWeeks} ${
    application.durationWeeks === 1 ? "week" : "weeks"
  }`;
  const dateRange = `${formatDisplayDate(application.startDate)} – ${formatDisplayDate(application.endDate)}`;
  const facultyClarification = latestFacultyClarification(
    application.timeline,
    application.latestReason,
  );
  const needsClarification = application.status === "clarification_requested";

  return (
    <article className="w-full min-w-0 space-y-4 sm:space-y-5">
      <Link
        href="/student/application"
        className={cn(
          "inline-flex scroll-mt-20 items-center gap-1 text-sm font-medium sm:scroll-mt-24",
          INK,
          "hover:text-[#2d5038] hover:underline",
          MOTION,
          FOCUS_RING,
        )}
      >
        <ChevronRightIcon className="rotate-180" aria-hidden="true" />
        Back to my applications
      </Link>

      <header className={cn(PANEL, "min-w-0 bg-[#f4f8f5] p-4 sm:p-5")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className={cn("text-xl break-words sm:text-2xl", DISPLAY_COMPANY)}>
              {application.companyName}
            </h1>
            <p className={cn("mt-1 text-base font-medium break-words text-[#2a3d30]")}>
              {application.roleTitle}
            </p>
            {application.submittedAt && (
              <p className={cn("mt-2 text-sm", MUTED)}>
                Submitted {formatSubmittedAt(application.submittedAt)}
              </p>
            )}
          </div>
          <Badge tone={APPLICATION_STATUS_TONE[application.status]}>
            {APPLICATION_STATUS_LABEL[application.status]}
          </Badge>
        </div>
      </header>

      {needsClarification && facultyClarification && (
        <section
          className={cn(
            PANEL,
            "min-w-0 border-amber-200/90 bg-amber-50/60 p-4 sm:p-5",
          )}
          aria-labelledby="action-required-heading"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-900">
            Action required
          </p>
          <h2 id="action-required-heading" className={cn("mt-1 text-base", DISPLAY_SECTION)}>
            Your faculty reviewer requested more information
          </h2>
          <p className="mt-2 text-sm leading-relaxed break-words text-[#3d4a42]">
            {facultyClarification}
          </p>
          {application.canEdit ? (
            <>
              <p className={cn("mt-3 text-sm leading-relaxed", MUTED)}>
                Update your application with the requested details, then write a response so
                your faculty reviewer can continue the review.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Link
                  href={`/student/application/${application.id}/edit`}
                  className={cn(
                    BTN_PRIMARY,
                    "inline-flex w-full items-center justify-center px-4 py-2.5 text-sm sm:w-auto",
                    MOTION,
                    FOCUS_RING,
                  )}
                >
                  Update application
                </Link>
                <a
                  href="#reply-to-faculty"
                  className={cn(
                    BTN_GHOST,
                    "inline-flex w-full items-center justify-center gap-1 px-4 py-2.5 text-sm sm:w-auto",
                    MOTION,
                    FOCUS_RING,
                  )}
                >
                  Write a response
                  <ChevronRightIcon aria-hidden="true" />
                </a>
              </div>
            </>
          ) : (
            <a
              href="#reply-to-faculty"
              className={cn(
                BTN_GHOST,
                "mt-4 inline-flex w-full items-center justify-center gap-1 px-4 py-2.5 text-sm sm:w-auto",
                MOTION,
                FOCUS_RING,
              )}
            >
              Write a response
              <ChevronRightIcon aria-hidden="true" />
            </a>
          )}
        </section>
      )}

      {application.status === "rejected" && application.latestReason?.trim() && (
        <section className={cn(PANEL, "min-w-0 border-red-200/80 bg-red-50/40 p-4 sm:p-5")}>
          <h2 className={cn("text-base", DISPLAY_SECTION)}>Application not approved</h2>
          <p className={cn("mt-2 text-sm leading-relaxed break-words", MUTED)}>
            {application.latestReason}
          </p>
        </section>
      )}

      {application.status === "approved" && (
        <section className={cn(PANEL, "min-w-0 border-[#b8d4bc] bg-[#ecf8ee]/70 p-4 sm:p-5")}>
          <h2 className={cn("text-base", DISPLAY_SECTION)}>Your internship is approved</h2>
          <p className={cn("mt-1 text-sm", MUTED)}>
            Once your internship ends, share how it actually went with other students.
          </p>
          <Link
            href="/student/experience"
            className={cn(BTN_PRIMARY, "mt-3 inline-flex", MOTION, FOCUS_RING)}
          >
            Share your internship experience
          </Link>
        </section>
      )}

      <div className="grid min-w-0 gap-4 lg:grid-cols-2 lg:items-start">
        <section className={cn(PANEL, "min-w-0 p-4 sm:p-5")}>
          <h2 className={cn("text-base", DISPLAY_SECTION)}>Internship overview</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <DetailField label="Domain" value={domainLabel} />
            <DetailField label="Work mode" value={modeLabel} />
            <DetailField label="Location" value={application.location ?? undefined} />
            <DetailField label="Duration" value={durationLabel} />
            <DetailField label="Dates" value={dateRange} />
            <DetailField label="Fee" value={formatFee(application.feeAmount)} />
            <DetailField label="Stipend" value={formatStipend(application.stipendAmount)} />
          </dl>
        </section>

        <section className={cn(PANEL, "min-w-0 p-4 sm:p-5")}>
          <h2 className={cn("text-base", DISPLAY_SECTION)}>Application summary</h2>
          <dl className="mt-4 space-y-4">
            <DetailField
              label="Faculty advisor"
              value={
                application.facultyName ?? "Waiting for a faculty advisor to be assigned"
              }
            />
            {sourceLabel && <DetailField label="Application source" value={sourceLabel} />}
            <DetailField
              label="Offer letter"
              value={
                application.offerLetter
                  ? application.offerLetter.originalFilename
                  : "Not attached"
              }
            />
          </dl>
        </section>
      </div>

      {(application.expectedWork?.trim() || application.technologies.length > 0) && (
        <section className={cn(PANEL, "min-w-0 p-4 sm:p-5")}>
          <h2 className={cn("text-base", DISPLAY_SECTION)}>Planned work</h2>
          <dl className="mt-4 space-y-4">
            <DetailField label="Expected work" value={application.expectedWork} />
            {application.technologies.length > 0 && (
              <div>
                <dt className={LABEL}>Technologies</dt>
                <dd className="mt-2">
                  <SkillChips labels={application.technologies} />
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}

      {needsClarification && (
        <ClarificationBox
          applicationId={application.id}
          facultyMessage={facultyClarification}
          hideFacultyMessage={Boolean(facultyClarification)}
        />
      )}

      {application.canEdit && (
        <Link
          href={`/student/application/${application.id}/edit`}
          className={cn(
            BTN_GHOST,
            "inline-flex w-full items-center justify-center px-4 py-2.5 text-sm sm:w-auto",
            MOTION,
            FOCUS_RING,
          )}
        >
          Continue editing
        </Link>
      )}

      <section className={cn(PANEL, "min-w-0 p-4 sm:p-5")} aria-labelledby="application-progress-heading">
        <h2 id="application-progress-heading" className={cn("text-base", DISPLAY_SECTION)}>
          Application progress
        </h2>
        <div className="mt-4 min-w-0">
          <Timeline entries={application.timeline} />
        </div>
      </section>
    </article>
  );
}

export default async function ApplicationDetailPage(
  props: PageProps<"/student/application/[id]">,
) {
  await requireStudentPage();

  const { id } = await props.params;

  let application;
  try {
    application = await getMyApplication(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <StudentPageShell stack={false}>
      <ApplicationDetailView application={application} />
    </StudentPageShell>
  );
}
