import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { ClarificationBox } from "@/components/application/ClarificationBox";
import { latestFacultyClarification, Timeline } from "@/components/application/Timeline";
import { SkillChips } from "@/components/explore/SkillChips";
import { Badge, Card } from "@/components/ui";
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
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-zinc-900 break-words">{content}</dd>
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

  return (
    <article className="mx-auto w-full max-w-5xl min-w-0 space-y-5">
      <Link
        href="/student/application"
        className={cn(
          "inline-flex items-center text-sm font-medium text-zinc-700",
          "hover:text-zinc-900 hover:underline",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2",
        )}
      >
        ← Back to my applications
      </Link>

      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 break-words">
              {application.companyName}
            </h1>
            <p className="mt-1 text-base font-medium text-zinc-700 break-words">
              {application.roleTitle}
            </p>
          </div>
          <Badge tone={APPLICATION_STATUS_TONE[application.status]}>
            {APPLICATION_STATUS_LABEL[application.status]}
          </Badge>
        </div>

        {application.submittedAt && (
          <p className="text-sm text-zinc-500">
            Submitted {formatSubmittedAt(application.submittedAt)}
          </p>
        )}
      </header>

      {application.status === "rejected" && application.latestReason?.trim() && (
        <Card className="border-red-200 bg-red-50/40">
          <h2 className="text-sm font-semibold text-zinc-900">Application not approved</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-700">{application.latestReason}</p>
        </Card>
      )}

      {application.status === "approved" && (
        <Card className="border-green-200 bg-green-50/50">
          <h2 className="text-sm font-semibold text-zinc-900">Your internship is approved</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Once your internship ends, share how it actually went with other students.
          </p>
          <Link
            href="/student/experience"
            className={cn(
              "mt-3 inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white",
              "hover:bg-zinc-700",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2",
            )}
          >
            Share your internship experience
          </Link>
        </Card>
      )}

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div className="min-w-0 space-y-5">
          <Card>
            <h2 className="text-base font-semibold text-zinc-900">Internship details</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <DetailField label="Company" value={application.companyName} />
              <DetailField label="Role" value={application.roleTitle} />
              <DetailField label="Domain" value={domainLabel} />
              <DetailField label="Work mode" value={modeLabel} />
              <DetailField label="Location" value={application.location ?? undefined} />
              <DetailField label="Duration" value={durationLabel} />
              <DetailField label="Dates" value={dateRange} />
              <DetailField label="Fee" value={formatFee(application.feeAmount)} />
              <DetailField label="Stipend" value={formatStipend(application.stipendAmount)} />
            </dl>
          </Card>

          {(application.expectedWork?.trim() || application.technologies.length > 0) && (
            <Card>
              <h2 className="text-base font-semibold text-zinc-900">Planned work</h2>
              <dl className="mt-4 space-y-4">
                <DetailField label="Expected work" value={application.expectedWork} />
                {application.technologies.length > 0 && (
                  <div>
                    <dt className="text-xs font-medium text-zinc-500">Technologies</dt>
                    <dd className="mt-2">
                      <SkillChips labels={application.technologies} />
                    </dd>
                  </div>
                )}
              </dl>
            </Card>
          )}

          <Card>
            <h2 className="text-base font-semibold text-zinc-900">Application & evidence</h2>
            <dl className="mt-4 space-y-4">
              {sourceLabel && (
                <DetailField label="Application source" value={sourceLabel} />
              )}
              <DetailField
                label="Offer letter"
                value={
                  application.offerLetter
                    ? application.offerLetter.originalFilename
                    : "Not attached"
                }
              />
            </dl>
          </Card>
        </div>

        <aside className="min-w-0 space-y-5 lg:sticky lg:top-20">
          <Card>
            <h2 className="text-base font-semibold text-zinc-900">Faculty advisor</h2>
            <p className="mt-2 text-sm text-zinc-700">
              {application.facultyName ?? "Waiting for a faculty advisor to be assigned"}
            </p>
          </Card>

          {application.status === "clarification_requested" && (
            <ClarificationBox
              applicationId={application.id}
              facultyMessage={facultyClarification}
            />
          )}

          {application.canEdit && (
            <Link
              href={`/student/application/${application.id}/edit`}
              className={cn(
                "flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2.5",
                "text-sm font-medium text-zinc-900 hover:bg-zinc-50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2",
              )}
            >
              Continue editing
            </Link>
          )}

          <Card>
            <h2 className="text-base font-semibold text-zinc-900">Review timeline</h2>
            <div className="mt-4 min-w-0">
              <Timeline entries={application.timeline} />
            </div>
          </Card>
        </aside>
      </div>
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

  return <ApplicationDetailView application={application} />;
}
