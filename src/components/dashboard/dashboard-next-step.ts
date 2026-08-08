import type { StudentDashboard } from "@/types/contracts";

export type NextStepDisplay = {
  title: string;
  text: string;
  href: string;
  cta: string;
  urgent: boolean;
};

const NEXT_STEP_COPY: Record<
  StudentDashboard["nextAction"],
  { text: string; href: string; cta: string }
> = {
  submit_application: {
    text: "Found an internship? Get it approved before you start.",
    href: "/student/application/new",
    cta: "Start an application",
  },
  await_approval: {
    text: "Your application is with your faculty advisor.",
    href: "/student/application",
    cta: "View application",
  },
  respond_clarification: {
    text: "Your advisor asked a question about your application.",
    href: "/student/application",
    cta: "View and reply",
  },
  contribute_experience: {
    text: "Internship approved. Share how it actually went.",
    href: "/student/experience",
    cta: "Contribute experience",
  },
  await_verification: {
    text: "Your experience is waiting to be verified.",
    href: "/student/experience",
    cta: "View experience",
  },
  fix_experience: {
    text: "Your advisor asked for some changes.",
    href: "/student/experience",
    cta: "Edit experience",
  },
  published: {
    text: "Your experience is published. Thank you for contributing.",
    href: "/student/explore",
    cta: "View on Explore",
  },
  rejected: {
    text: "Your application was not approved.",
    href: "/student/application",
    cta: "View reason",
  },
};

const JOURNEY_TITLES: Record<StudentDashboard["nextAction"], string> = {
  submit_application: "No application yet",
  await_approval: "Application under review",
  respond_clarification: "Clarification needed",
  contribute_experience: "Ready to share your experience",
  await_verification: "Experience under review",
  fix_experience: "Changes requested",
  published: "Experience published",
  rejected: "Application not approved",
};

const URGENT_ACTIONS = new Set<StudentDashboard["nextAction"]>([
  "respond_clarification",
  "fix_experience",
]);

function journeyTitle(dashboard: StudentDashboard): string {
  if (
    dashboard.nextAction === "submit_application" &&
    dashboard.application?.status === "draft"
  ) {
    return "Application in progress";
  }

  return JOURNEY_TITLES[dashboard.nextAction];
}

function resolveHref(dashboard: StudentDashboard): string {
  const base = NEXT_STEP_COPY[dashboard.nextAction].href;

  switch (dashboard.nextAction) {
    case "submit_application":
      if (dashboard.application?.status === "draft") {
        return `/student/application/${dashboard.application.id}/edit`;
      }
      return base;
    case "await_approval":
    case "respond_clarification":
    case "rejected":
      if (dashboard.application) {
        return `/student/application/${dashboard.application.id}`;
      }
      return base;
    case "await_verification":
      if (dashboard.experience) {
        return `/student/experience/${dashboard.experience.id}`;
      }
      return base;
    case "fix_experience":
      if (dashboard.experience) {
        return `/student/experience/${dashboard.experience.id}/edit`;
      }
      return base;
    case "contribute_experience":
      if (
        dashboard.experience?.status === "draft" ||
        dashboard.experience?.status === "changes_requested"
      ) {
        return `/student/experience/${dashboard.experience.id}/edit`;
      }
      return base;
    case "published":
      if (dashboard.experience) {
        return `/student/explore/${dashboard.experience.id}`;
      }
      return base;
    default:
      return base;
  }
}

function resolveCta(dashboard: StudentDashboard): string {
  if (
    dashboard.nextAction === "submit_application" &&
    dashboard.application?.status === "draft"
  ) {
    return "Continue application";
  }

  if (
    dashboard.nextAction === "contribute_experience" &&
    dashboard.experience?.status === "draft"
  ) {
    return "Continue draft";
  }

  return NEXT_STEP_COPY[dashboard.nextAction].cta;
}

function isUrgent(dashboard: StudentDashboard): boolean {
  if (URGENT_ACTIONS.has(dashboard.nextAction)) return true;
  if (
    dashboard.nextAction === "submit_application" &&
    dashboard.application?.status === "draft"
  ) {
    return true;
  }
  return false;
}

export function resolveNextStep(dashboard: StudentDashboard): NextStepDisplay {
  const copy = NEXT_STEP_COPY[dashboard.nextAction];

  return {
    title: journeyTitle(dashboard),
    text: copy.text,
    href: resolveHref(dashboard),
    cta: resolveCta(dashboard),
    urgent: isUrgent(dashboard),
  };
}

export function latestActionReason(dashboard: StudentDashboard): string | null {
  if (dashboard.nextAction === "respond_clarification" || dashboard.nextAction === "rejected") {
    return dashboard.application?.latestReason?.trim() || null;
  }

  if (dashboard.nextAction === "fix_experience") {
    return dashboard.experience?.latestReason?.trim() || null;
  }

  return null;
}
