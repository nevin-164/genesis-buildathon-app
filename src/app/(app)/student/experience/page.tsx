import Link from "next/link";

import { ContributableInternshipCard } from "@/components/experience/ContributableInternshipCard";
import { ExperienceStatusCard } from "@/components/experience/ExperienceStatusCard";
import { findOpenExperienceDraft } from "@/components/experience/experience-workflow";
import { StudentPageShell } from "@/components/layout/student-page-shell";
import {
  BTN_SECONDARY,
  FOCUS_RING,
  MOTION,
} from "@/components/student/student-ui";
import {
  CanvasPageHeader,
  EditorialSheet,
  EmptyCanvas,
  InsetPanel,
  SectionHeading,
  SheetDivider,
} from "@/components/student/primitives";
import {
  listContributableApplications,
  listMyExperiences,
} from "@/controllers/experience.controller";
import { requireStudentPage } from "@/lib/auth/dal";
import { cn } from "@/lib/cn";

export default async function ExperienceOverviewPage() {
  await requireStudentPage();

  const [experiences, contributable] = await Promise.all([
    listMyExperiences(),
    listContributableApplications(),
  ]);

  const openDraft = findOpenExperienceDraft(experiences);
  const hasContributable = contributable.length > 0;
  const hasExperiences = experiences.length > 0;
  const showWorkspace = hasContributable || hasExperiences;

  return (
    <StudentPageShell>
      <CanvasPageHeader
        eyebrow="My experience"
        title="Share what your internship was really like"
        lead="After faculty approves your internship, write an honest report, attach your certificate, and submit it for verification. Verified reports become Reality Cards for future students."
        divider={false}
        contentGap={false}
        className="[&_h1]:max-w-3xl"
      />

      {!hasContributable && !hasExperiences && (
        <EmptyCanvas
          title="No eligible internship yet"
          description="Once faculty approves an internship and it is complete, you can return here to contribute your experience report."
          action={
            <Link
              href="/student/application"
              className={cn(BTN_SECONDARY, "px-5", MOTION, FOCUS_RING)}
            >
              View my applications
            </Link>
          }
        />
      )}

      {openDraft && !showWorkspace && (
        <InsetPanel
          variant="attention"
          className="mt-6 flex flex-col gap-4 sm:mt-8 sm:flex-row sm:items-center sm:justify-between"
          aria-labelledby="open-draft-heading"
        >
          <p id="open-draft-heading" className="text-sm leading-relaxed text-[var(--il-moss)]">
            You already have a report in progress. Continue it before starting another one.
          </p>
          <Link
            href={`/student/experience/${openDraft.id}/edit`}
            className={cn(BTN_SECONDARY, "inline-flex shrink-0 px-5", MOTION, FOCUS_RING)}
          >
            Continue draft
          </Link>
        </InsetPanel>
      )}

      {showWorkspace && (
        <EditorialSheet className="mt-6 p-5 sm:mt-8 lg:p-8">
          {openDraft && (
            <InsetPanel
              variant="attention"
              className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
              aria-labelledby="open-draft-heading"
            >
              <p id="open-draft-heading" className="text-sm leading-relaxed text-[var(--il-moss)]">
                You already have a report in progress. Continue it before starting another one.
              </p>
              <Link
                href={`/student/experience/${openDraft.id}/edit`}
                className={cn(BTN_SECONDARY, "inline-flex shrink-0 px-5", MOTION, FOCUS_RING)}
              >
                Continue draft
              </Link>
            </InsetPanel>
          )}

          {hasContributable && !openDraft && (
            <div className="divide-y divide-[var(--il-border)]">
              {contributable.map((item) => (
                <ContributableInternshipCard key={item.applicationId} contributable={item} />
              ))}
            </div>
          )}

          {hasContributable && !openDraft && hasExperiences && <SheetDivider className="my-6" />}

          {hasExperiences && (
            <section aria-labelledby="experience-reports-heading">
              <SectionHeading
                title="Your experience reports"
                description="Track drafts, submissions, and verified Reality Cards."
              />
              <div className="mt-4 divide-y divide-[var(--il-border)]">
                {experiences.map((experience) => (
                  <ExperienceStatusCard key={experience.id} experience={experience} />
                ))}
              </div>
            </section>
          )}
        </EditorialSheet>
      )}
    </StudentPageShell>
  );
}
