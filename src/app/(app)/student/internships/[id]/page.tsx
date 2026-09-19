import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { ChangesRequestedBox } from "@/components/internship/ChangesRequestedBox";
import { DocumentsPanel } from "@/components/internship/DocumentsPanel";
import { latestFacultyChangeRequest, Timeline } from "@/components/internship/Timeline";
import { OwnVerdictLine } from "@/components/explore/CompanyVerdictBanner";
import { ChevronRightIcon } from "@/components/explore/explore-icons";
import { exploreDisplay, exploreFont } from "@/components/explore/explore-font";
import { SkillChips } from "@/components/explore/SkillChips";
import {
  BTN_GHOST,
  BTN_PRIMARY,
  DISPLAY_COMPANY,
  EXPLORE_PAGE,
  EXPLORE_ROOT,
  FOCUS_RING,
  INK,
  LABEL,
  MOTION,
  MUTED,
  PANEL,
  SECTION_HEADING,
} from "@/components/explore/explore-ui";
import { Badge } from "@/components/ui";
import { getMyInternship } from "@/controllers/internship.controller";
import {
  APPLICATION_SOURCES,
  INTERNSHIP_STATUS_LABEL,
  INTERNSHIP_STATUS_TONE,
  DOMAINS,
  WORK_MODES,
  labelFor,
} from "@/lib/constants/options";
import { requireStudentPage } from "@/lib/auth/dal";
import { NotFoundError } from "@/lib/auth/errors";
import { cn } from "@/lib/cn";
import type { InternshipDetail } from "@/types/contracts";

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

function InternshipDetailView({ internship }: { internship: InternshipDetail }) {
  const domainLabel = labelFor(DOMAINS, internship.domain);
  const modeLabel = labelFor(WORK_MODES, internship.workMode);
  const sourceLabel = internship.applicationSource
    ? labelFor(APPLICATION_SOURCES, internship.applicationSource)
    : null;
  const durationLabel = `${internship.durationWeeks} ${
    internship.durationWeeks === 1 ? "week" : "weeks"
  }`;
  const dateRange = `${formatDisplayDate(internship.startDate)} – ${formatDisplayDate(internship.endDate)}`;
  const facultyChangeRequest = latestFacultyChangeRequest(
    internship.timeline,
    internship.latestReason,
  );
  const needsChanges = internship.status === "changes_requested";

  return (
    <article className={cn(EXPLORE_PAGE, "mx-auto w-full max-w-5xl min-w-0")}>
      <Link
        href="/student/internships"
        className={cn(
          "inline-flex items-center gap-1 text-sm font-medium",
          INK,
          "hover:text-[#2d5038] hover:underline",
          MOTION,
          FOCUS_RING,
        )}
      >
        <ChevronRightIcon className="rotate-180" aria-hidden="true" />
        Back to my internships
      </Link>

      <header className={cn(PANEL, "mt-4 bg-[#f4f8f5] p-4 sm:p-5")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className={cn("text-xl break-words sm:text-2xl", DISPLAY_COMPANY)}>
              {internship.companyName.trim() || "Company not named yet"}
            </h1>
            <p className={cn("mt-1 text-base font-medium break-words text-[#2a3d30]")}>
              {internship.roleTitle}
            </p>
            {internship.submittedAt && (
              <p className={cn("mt-2 text-sm", MUTED)}>
                Submitted {formatSubmittedAt(internship.submittedAt)}
              </p>
            )}
          </div>
          <Badge tone={INTERNSHIP_STATUS_TONE[internship.status]}>
            {INTERNSHIP_STATUS_LABEL[internship.status]}
          </Badge>
        </div>
      </header>

      {needsChanges && facultyChangeRequest && (
        <section
          className={cn(
            PANEL,
            "border-amber-200/90 bg-amber-50/60 p-4 sm:p-5",
          )}
          aria-labelledby="action-required-heading"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-900">
            Action required
          </p>
          <h2 id="action-required-heading" className={cn(SECTION_HEADING, "mt-1")}>
            Your advisor asked for changes
          </h2>
          <p className="mt-2 text-sm leading-relaxed break-words text-[#3d4a42]">
            {facultyChangeRequest}
          </p>
          {internship.canEdit ? (
            <>
              <p className={cn("mt-3 text-sm leading-relaxed", MUTED)}>
                Make the requested changes, then write a response so your advisor can
                review it again.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Link
                  href={`/student/internships/${internship.id}/edit`}
                  className={cn(
                    BTN_PRIMARY,
                    "inline-flex w-full items-center justify-center px-4 py-2.5 text-sm sm:w-auto",
                    MOTION,
                    FOCUS_RING,
                  )}
                >
                  Update internship
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

      {/*
        Rejected. The panel renders whether or not a reason came back, because
        the appeal route has to be reachable either way — a rejection nobody
        explained is the one most worth contesting.
      */}
      {internship.status === "rejected" && (
        <section
          className={cn(PANEL, "border-red-200/80 bg-red-50/40 p-4 sm:p-5")}
          aria-labelledby="not-accepted-heading"
        >
          <h2 id="not-accepted-heading" className={SECTION_HEADING}>
            Not accepted
          </h2>
          {internship.latestReason?.trim() && (
            <p className={cn("mt-2 text-sm leading-relaxed break-words", MUTED)}>
              {internship.latestReason}
            </p>
          )}

          {internship.canAppeal ? (
            <>
              <p className={cn("mt-3 text-sm leading-relaxed", MUTED)}>
                If you believe this is wrong, you can ask an administrator to look
                again — once. Attach whatever your advisor said was missing and
                explain what it shows.
              </p>
              <Link
                href={`/student/internships/${internship.id}/appeal`}
                className={cn(
                  BTN_PRIMARY,
                  "mt-4 inline-flex w-full items-center justify-center px-4 py-2.5 text-sm sm:w-auto",
                  MOTION,
                  FOCUS_RING,
                )}
              >
                Appeal this decision
              </Link>
            </>
          ) : (
            /* The one appeal has been spent and an administrator upheld the
               rejection. Saying so plainly is kinder than a page that simply
               stops offering the button it offered yesterday. */
            <p className={cn("mt-3 text-sm leading-relaxed", MUTED)}>
              You have already appealed this internship, and an administrator
              reviewed it. That decision is final. Talk to your advisor before
              adding another internship like this one.
            </p>
          )}
        </section>
      )}

      {internship.status === "appealed" && (
        <section
          className={cn(PANEL, "border-[#cdd8cf] bg-[#f4f8f5] p-4 sm:p-5")}
          aria-labelledby="appeal-pending-heading"
        >
          <p className="text-[10px] font-semibold tracking-[0.14em] text-[#5c6b62] uppercase">
            With an administrator
          </p>
          <h2 id="appeal-pending-heading" className={cn(SECTION_HEADING, "mt-1")}>
            Your appeal is being reviewed
          </h2>
          <p className={cn("mt-2 text-sm leading-relaxed", MUTED)}>
            An administrator is reading your appeal and the documents attached to
            it. There is nothing more to do — whatever they decide appears below,
            with their reasons.
          </p>
        </section>
      )}

      {internship.status === "verified" && (
        <section className={cn(PANEL, "border-[#b8d4bc] bg-[#ecf8ee]/70 p-4 sm:p-5")}>
          <h2 className={SECTION_HEADING}>Verified and published</h2>
          <p className={cn("mt-1 text-sm", MUTED)}>
            Your advisor verified this, so it is now on Explore for other students to read.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              href="/student/explore"
              className={cn(BTN_PRIMARY, "inline-flex justify-center", MOTION, FOCUS_RING)}
            >
              See it on Explore
            </Link>
            {/*
              SEAM — owner: package D (AI internship report).

              Inside the `verified` block on purpose: the controller refuses to
              generate a report for anything else, so offering the button
              earlier would only ever produce an error. The route exists; the
              page behind it is package D's to build.
            */}
            <Link
              href={`/student/internships/${internship.id}/report`}
              className={cn(BTN_GHOST, "inline-flex justify-center", MOTION, FOCUS_RING)}
            >
              Generate report
            </Link>
          </div>
        </section>
      )}

      <div className="grid min-w-0 gap-4 lg:grid-cols-2 lg:items-start">
        <section className={cn(PANEL, "p-4 sm:p-5")}>
          <h2 className={SECTION_HEADING}>Internship overview</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <DetailField label="Domain" value={domainLabel} />
            <DetailField label="Work mode" value={modeLabel} />
            <DetailField label="Location" value={internship.location ?? undefined} />
            <DetailField label="Duration" value={durationLabel} />
            <DetailField label="Dates" value={dateRange} />
            <DetailField label="Fee" value={formatFee(internship.feeAmount)} />
            <DetailField label="Stipend" value={formatStipend(internship.stipendAmount)} />
          </dl>
          {/*
            Their own verdict, shown back to them. It is counted into the
            company's public total the moment this card is verified, so it
            should not be a thing they answered once and never saw again.
          */}
          {internship.recommendsCompany !== null && (
            <div className="mt-4 border-t border-[#e4ebe4] pt-4">
              <OwnVerdictLine value={internship.recommendsCompany} />
            </div>
          )}
        </section>

        <section className={cn(PANEL, "p-4 sm:p-5")}>
          <h2 className={SECTION_HEADING}>Verification</h2>
          <dl className="mt-4 space-y-4">
            <DetailField
              label="Faculty advisor"
              value={
                internship.facultyName ?? "Waiting for a faculty advisor to be assigned"
              }
            />
            {sourceLabel && <DetailField label="Application source" value={sourceLabel} />}
          </dl>
        </section>
      </div>

      <DocumentsPanel
        internshipId={internship.id}
        documents={internship.documents}
        editable={false}
      />

      {(internship.workSummary?.trim() || internship.technologies.length > 0) && (
        <section className={cn(PANEL, "p-4 sm:p-5")}>
          <h2 className={SECTION_HEADING}>The work</h2>
          <dl className="mt-4 space-y-4">
            <DetailField label="What they did" value={internship.workSummary} />
            {internship.technologies.length > 0 && (
              <div>
                <dt className={LABEL}>Technologies</dt>
                <dd className="mt-2">
                  <SkillChips labels={internship.technologies} />
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}

      {needsChanges && (
        <ChangesRequestedBox
          internshipId={internship.id}
          facultyMessage={facultyChangeRequest}
          hideFacultyMessage={Boolean(facultyChangeRequest)}
        />
      )}

      {internship.canEdit && (
        <Link
          href={`/student/internships/${internship.id}/edit`}
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

      <section className={cn(PANEL, "p-4 sm:p-5")} aria-labelledby="internship-progress-heading">
        <h2 id="internship-progress-heading" className={SECTION_HEADING}>
          Verification progress
        </h2>
        <div className="mt-4 min-w-0">
          <Timeline entries={internship.timeline} />
        </div>
      </section>
    </article>
  );
}

export default async function InternshipDetailPage(
  props: PageProps<"/student/internships/[id]">,
) {
  await requireStudentPage();

  const { id } = await props.params;

  let internship;
  try {
    internship = await getMyInternship(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <div className={cn(exploreFont.className, exploreDisplay.variable, EXPLORE_ROOT)}>
      <InternshipDetailView internship={internship} />
    </div>
  );
}
