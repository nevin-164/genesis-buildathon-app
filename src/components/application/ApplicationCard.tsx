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

import {
  CompanyMark,
  DefinitionStrip,
  QuoteBlock,
  WorkflowSheet,
} from "@/components/student/primitives";

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

  variant: "primary" | "secondary";

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

        variant: "secondary",

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

        variant: "secondary",

        showFeedback: false,

      };

    case "approved":

      return {

        label: "View approval",

        href: base,

        variant: "secondary",

        showFeedback: false,

      };

    default:

      return {

        label: "View application",

        href: base,

        variant: "secondary",

        showFeedback: false,

      };

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
    <WorkflowSheet>
      <div className="grid min-w-0 gap-4 lg:grid-cols-12 lg:items-center lg:gap-6">

        <div className="flex min-w-0 gap-4 lg:col-span-8">

          <CompanyMark name={application.companyName} size="lg" />

          <div className="min-w-0 flex-1">

            {eyebrow && <p className={EYEBROW}>{eyebrow}</p>}

            <h2 className={cn(SECTION_TITLE, "mt-1 break-words")}>{application.companyName}</h2>

            <p className="mt-0.5 break-words text-sm font-medium text-[var(--il-moss)]">

              {application.roleTitle}

            </p>



            <DefinitionStrip

              className="mt-3"

              items={[

                { label: "Domain", value: domainLabel },

                { label: "Dates", value: dateRange },

                { label: "Submitted", value: submittedText },

                { label: "Faculty advisor", value: advisorLabel },

              ]}

            />



            {hint && <p className={cn("mt-3 text-xs leading-relaxed", MUTED)}>{hint}</p>}



            {action.showFeedback && application.latestReason?.trim() && (

              <div className="mt-4">

                <QuoteBlock

                  label={action.feedbackLabel}

                  variant={application.status === "rejected" ? "error" : "attention"}

                >

                  {application.latestReason}

                </QuoteBlock>

              </div>

            )}

          </div>

        </div>



        <div className="flex min-w-0 flex-col gap-2 lg:col-span-4 lg:items-end lg:justify-center">

          <Badge tone={APPLICATION_STATUS_TONE[application.status]}>

            {APPLICATION_STATUS_LABEL[application.status]}

          </Badge>

          <Link

            href={action.href}

            className={cn(

              action.variant === "primary" ? BTN_PRIMARY : BTN_SECONDARY,

              "inline-flex min-h-11 w-full items-center justify-center gap-1.5 px-5 sm:w-auto",

              MOTION,

              HOVER_LIFT,

              FOCUS_RING,

            )}

          >

            {action.label}

            <ChevronRightIcon aria-hidden="true" />

          </Link>

        </div>
      </div>
    </WorkflowSheet>
  );
}
