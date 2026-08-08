import Link from "next/link";

import { ChevronRightIcon } from "@/components/explore/explore-icons";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  EYEBROW,
  FOCUS_RING,
  HOVER_LIFT,
  MOTION,
  MUTED,
  SECTION_TITLE,
} from "@/components/student/student-ui";
import { CompanyMark, QuoteBlock } from "@/components/student/primitives";
import { Badge } from "@/components/ui";
import {
  EXPERIENCE_STATUS_LABEL,
  EXPERIENCE_STATUS_TONE,
} from "@/lib/constants/options";
import { cn } from "@/lib/cn";
import type { ExperienceListItem } from "@/types/contracts";

import {
  experiencePrimaryAction,
  experienceSecondaryAction,
  experienceStatusDescription,
  experienceStatusHeadline,
} from "./experience-workflow";

function formatSubmitted(experience: ExperienceListItem): string {
  if (experience.submittedAt) {
    return new Date(experience.submittedAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  if (experience.status === "draft") return "Not submitted yet";
  return "—";
}

export function ExperienceStatusCard({ experience }: { experience: ExperienceListItem }) {
  const primary = experiencePrimaryAction(experience);
  const secondary = experienceSecondaryAction(experience);
  const headline = experienceStatusHeadline(experience.status);
  const description = experienceStatusDescription(experience.status);
  const showFeedback =
    experience.latestReason?.trim() &&
    (experience.status === "changes_requested" || experience.status === "rejected");

  return (
    <article className="relative min-w-0 py-5 first:pt-0 last:pb-0">
      <div className="grid min-w-0 gap-4 lg:grid-cols-12 lg:items-center lg:gap-6">
        <div className="flex min-w-0 gap-4 lg:col-span-5">
          <CompanyMark name={experience.companyName} size="md" />
          <div className="min-w-0 flex-1">
            <h2 className={SECTION_TITLE}>{experience.companyName}</h2>
            <p className="mt-0.5 text-sm font-medium text-[var(--il-moss)]">
              {experience.roleTitle}
            </p>
            {description && (
              <p className={cn("mt-2 max-w-prose text-sm leading-relaxed", MUTED)}>
                {description}
              </p>
            )}
            {showFeedback && (
              <div className="mt-3">
                <QuoteBlock
                  label="Faculty feedback"
                  variant={experience.status === "rejected" ? "error" : "attention"}
                >
                  {experience.latestReason}
                </QuoteBlock>
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 lg:col-span-3">
          <p className={EYEBROW}>{headline}</p>
          <div className="mt-2 flex flex-col gap-1.5">
            <Badge tone={EXPERIENCE_STATUS_TONE[experience.status]}>
              {EXPERIENCE_STATUS_LABEL[experience.status]}
            </Badge>
            <span className={cn("text-xs", MUTED)}>Submitted {formatSubmitted(experience)}</span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row lg:col-span-4 lg:flex-col lg:items-end lg:justify-center">
          <Link
            href={primary.href}
            className={cn(
              primary.variant === "primary" ? BTN_PRIMARY : BTN_SECONDARY,
              "inline-flex min-h-11 w-full items-center justify-center gap-1.5 px-5 sm:w-auto",
              MOTION,
              HOVER_LIFT,
              FOCUS_RING,
            )}
          >
            {primary.label}
            <ChevronRightIcon aria-hidden="true" />
          </Link>
          {secondary && (
            <Link
              href={secondary.href}
              className={cn(
                BTN_SECONDARY,
                "inline-flex min-h-11 w-full items-center justify-center gap-1.5 px-5 sm:w-auto",
                MOTION,
                FOCUS_RING,
              )}
            >
              {secondary.label}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
