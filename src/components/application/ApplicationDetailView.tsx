import Link from "next/link";

import { ClarificationBox } from "@/components/application/ClarificationBox";
import { applicationDetailActions } from "@/components/application/application-workflow";
import { latestFacultyClarification, Timeline } from "@/components/application/Timeline";
import { SkillChips } from "@/components/explore/SkillChips";
import {
  BTN_LIME,
  BTN_PRIMARY,
  BTN_SECONDARY,
  BODY,
  EYEBROW,
  FOCUS_RING,
  HOVER_LIFT,
  INK,
  INSET_MINT,
  INSET_NEUTRAL,
  META,
  MOTION,
  MUTED,
  SECTION_TITLE,
} from "@/components/student/student-ui";
import {
  BackLink,
  EditorialSheet,
  IdentityMasthead,
  InsetPanel,
  MetaGrid,
  MetaItem,
  QuoteBlock,
  SectionHeading,
  SheetDivider,
} from "@/components/student/primitives";
import { Badge } from "@/components/ui";
import {
  APPLICATION_SOURCES,
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_TONE,
  DOMAINS,
  WORK_MODES,
  labelFor,
} from "@/lib/constants/options";
import { cn } from "@/lib/cn";
import type { ApplicationDetail, ApplicationStatus } from "@/types/contracts";

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
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatStipend(amount: number | null): string {
  if (amount === null || amount === 0) return "No stipend";
  return `₹${amount.toLocaleString("en-IN")}`;
}

function statusDescription(status: ApplicationStatus): string | null {
  switch (status) {
    case "submitted":
      return "Your application is waiting for faculty review.";
    case "approved":
      return "Your internship plan has faculty approval.";
    case "draft":
      return "Finish and submit when every required field is complete.";
    default:
      return null;
  }
}

export function ApplicationDetailView({ application }: { application: ApplicationDetail }) {
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
  const { actions: detailActions, statusNotice } = applicationDetailActions(application);
  const description = statusDescription(application.status);

  return (
    <>
      <BackLink href="/student/application" label="Back to my applications" />

      <EditorialSheet className="mt-4">
        <IdentityMasthead
          companyName={application.companyName}
          roleTitle={application.roleTitle}
          trailing={
            <>
              <Badge tone={APPLICATION_STATUS_TONE[application.status]}>
                {APPLICATION_STATUS_LABEL[application.status]}
              </Badge>
              {application.submittedAt && (
                <p className={cn(META, "lg:text-right")}>
                  Submitted {formatSubmittedAt(application.submittedAt)}
                </p>
              )}
              {description && (
                <p className={cn(META, "max-w-xs lg:text-right")}>{description}</p>
              )}
            </>
          }
        />

        {needsClarification && (
          <InsetPanel
            variant="attention"
            className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
            aria-labelledby="clarification-attention-heading"
          >
            <div className="min-w-0 flex-1">
              <p className={EYEBROW}>Action required</p>
              <h2 id="clarification-attention-heading" className={cn(SECTION_TITLE, "mt-1")}>
                Your faculty reviewer requested more information
              </h2>
              <p className={cn("mt-2 max-w-prose text-sm leading-relaxed", MUTED)}>
                {application.canEdit
                  ? "Update your application with the requested details, then write a response so your faculty reviewer can continue the review."
                  : "Review the application progress below for your faculty reviewer's latest note."}
              </p>
              {facultyClarification && (
                <div className="mt-4">
                  <QuoteBlock label="Faculty feedback">{facultyClarification}</QuoteBlock>
                </div>
              )}
            </div>
            {application.canEdit && (
              <Link
                href="#reply-to-faculty"
                className={cn(
                  BTN_PRIMARY,
                  "inline-flex min-h-11 shrink-0 items-center justify-center px-5",
                  MOTION,
                  FOCUS_RING,
                )}
              >
                Write a response
              </Link>
            )}
          </InsetPanel>
        )}

        {application.status === "approved" && (
          <InsetPanel
            variant="mint"
            className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="min-w-0">
              <p className={EYEBROW}>Next step</p>
              <h2 className={cn(SECTION_TITLE, "mt-1")}>Your internship is approved</h2>
              <p className={cn("mt-2 max-w-prose text-sm leading-relaxed", MUTED)}>
                Once your internship ends, share how it actually went with other students.
              </p>
            </div>
            <Link
              href="/student/experience"
              className={cn(
                BTN_LIME,
                "inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 px-5 font-bold",
                MOTION,
                HOVER_LIFT,
                FOCUS_RING,
              )}
            >
              Share your internship experience
            </Link>
          </InsetPanel>
        )}

        {application.status === "rejected" && application.latestReason?.trim() && (
          <InsetPanel variant="error" className="mt-6">
            <p className={EYEBROW}>Feedback</p>
            <h2 className={cn(SECTION_TITLE, "mt-1")}>Application not approved</h2>
            <div className="mt-3 max-w-prose">
              <QuoteBlock label="Faculty feedback" variant="error">
                {application.latestReason}
              </QuoteBlock>
            </div>
            <p className={cn("mt-3 text-sm leading-relaxed", MUTED)}>
              You can start a new application when you are ready.
            </p>
            <Link
              href="/student/application"
              className={cn(BTN_SECONDARY, "mt-4 inline-flex px-5", MOTION, FOCUS_RING)}
            >
              Back to applications
            </Link>
          </InsetPanel>
        )}

        <SheetDivider className="my-8" />

        <div className="grid min-w-0 gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="min-w-0 space-y-8 lg:col-span-7">
            <section aria-labelledby="internship-overview-heading">
              <SectionHeading title="Internship overview" />
              <MetaGrid columns={2} className="mt-5">
                <MetaItem label="Domain" value={domainLabel} />
                <MetaItem label="Work mode" value={modeLabel} />
                <MetaItem label="Location" value={application.location} />
                <MetaItem label="Duration" value={durationLabel} />
                <MetaItem label="Dates" value={dateRange} />
              </MetaGrid>
            </section>

            {(application.expectedWork?.trim() || application.technologies.length > 0) && (
              <>
                <SheetDivider />
                <section aria-labelledby="planned-work-heading">
                  <SectionHeading title="Planned work" />
                  {application.expectedWork?.trim() && (
                    <div className="mt-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--il-muted)]">
                        Expected work
                      </p>
                      <p className={cn(BODY, "mt-2 max-w-prose whitespace-pre-wrap break-words")}>
                        {application.expectedWork}
                      </p>
                    </div>
                  )}
                  {application.technologies.length > 0 && (
                    <div className="mt-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--il-muted)]">
                        Technologies
                      </p>
                      <div className="mt-2">
                        <SkillChips labels={application.technologies} />
                      </div>
                    </div>
                  )}
                </section>
              </>
            )}
          </div>

          <aside className="min-w-0 space-y-8 lg:col-span-5">
            <section aria-labelledby="compensation-heading">
              <SectionHeading title="Compensation" description="Fee and stipend for this internship." />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className={cn(INSET_NEUTRAL, "p-4")}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--il-muted)]">
                    Fee
                  </p>
                  <p className={cn("mt-1 text-lg font-semibold", INK)}>
                    {formatFee(application.feeAmount)}
                  </p>
                </div>
                <div className={cn(INSET_MINT, "p-4")}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--il-muted)]">
                    Stipend
                  </p>
                  <p className={cn("mt-1 text-lg font-semibold", INK)}>
                    {formatStipend(application.stipendAmount)}
                  </p>
                </div>
              </div>
            </section>

            <SheetDivider />

            <section aria-labelledby="application-summary-heading">
              <SectionHeading title="Application summary" />
              <MetaGrid columns={1} className="mt-5">
                <MetaItem
                  label="Faculty advisor"
                  value={
                    application.facultyName ??
                    "Waiting for a faculty advisor to be assigned"
                  }
                />
                <MetaItem label="Application source" value={sourceLabel} />
                <MetaItem label="Offer letter">
                  {application.offerLetter ? (
                    <div className="space-y-1">
                      <span>{application.offerLetter.originalFilename}</span>
                      <a
                        href={application.offerLetter.downloadUrl}
                        className={cn(
                          "inline-flex min-h-11 items-center text-sm font-semibold underline-offset-2 hover:underline",
                          INK,
                          FOCUS_RING,
                        )}
                      >
                        View uploaded file
                      </a>
                    </div>
                  ) : (
                    "Not attached"
                  )}
                </MetaItem>
              </MetaGrid>
            </section>
          </aside>
        </div>

        {needsClarification && (
          <>
            <SheetDivider className="my-8" />
            <ClarificationBox
              applicationId={application.id}
              facultyMessage={facultyClarification}
              hideFacultyMessage={Boolean(facultyClarification)}
            />
          </>
        )}

        {(detailActions.length > 0 || statusNotice) && (
          <>
            <SheetDivider className="my-8" />
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              {statusNotice && (
                <p className={cn("text-sm font-medium", MUTED)} role="status">
                  {statusNotice}
                </p>
              )}
              {detailActions.map((action) => (
                <Link
                  key={`${action.href}-${action.label}`}
                  href={action.href}
                  className={cn(
                    action.variant === "primary" ? BTN_PRIMARY : BTN_SECONDARY,
                    "inline-flex min-h-11 w-full items-center justify-center px-5 sm:w-auto",
                    MOTION,
                    FOCUS_RING,
                  )}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </>
        )}

        <SheetDivider className="my-8" />

        <section aria-labelledby="application-progress-heading">
          <SectionHeading title="Application progress" />
          <div className="mt-5 min-w-0">
            <Timeline entries={application.timeline} />
          </div>
        </section>
      </EditorialSheet>
    </>
  );
}
