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
  add_internship: {
    text: "Found an internship? Add it to your records.",
    href: "/student/internship/new",
    cta: "Add internship",
  },
  await_verification: {
    text: "Your internship is waiting to be verified by your advisor.",
    href: "/student/internship",
    cta: "View internship",
  },
  fix_internship: {
    text: "Your advisor asked for some changes to your internship details.",
    href: "/student/internship",
    cta: "Edit internship",
  },
  published: {
    text: "Your internship is verified and published.",
    href: "/student/explore",
    cta: "View on Explore",
  },
  rejected: {
    text: "Your internship was not approved.",
    href: "/student/internship",
    cta: "View reason",
  },
};

const JOURNEY_TITLES: Record<StudentDashboard["nextAction"], string> = {
  add_internship: "No internship yet",
  await_verification: "Internship under review",
  fix_internship: "Changes requested",
  published: "Internship published",
  rejected: "Internship not approved",
};

const URGENT_ACTIONS = new Set<StudentDashboard["nextAction"]>([
  "fix_internship",
]);

function journeyTitle(dashboard: StudentDashboard): string {
  if (
    dashboard.nextAction === "add_internship" &&
    dashboard.internship?.status === "draft"
  ) {
    return "Internship in progress";
  }

  return JOURNEY_TITLES[dashboard.nextAction];
}

function resolveHref(dashboard: StudentDashboard): string {
  const base = NEXT_STEP_COPY[dashboard.nextAction].href;

  switch (dashboard.nextAction) {
    case "add_internship":
      if (dashboard.internship?.status === "draft") {
        return `/student/internship/${dashboard.internship.id}/edit`;
      }
      return base;
    case "await_verification":
    case "rejected":
      if (dashboard.internship) {
        return `/student/internship/${dashboard.internship.id}`;
      }
      return base;
    case "fix_internship":
      if (dashboard.internship) {
        return `/student/internship/${dashboard.internship.id}/edit`;
      }
      return base;
    default:
      return base;
  }
}

function resolveCta(dashboard: StudentDashboard): string {
  if (
    dashboard.nextAction === "add_internship" &&
    dashboard.internship?.status === "draft"
  ) {
    return "Continue internship";
  }

  return NEXT_STEP_COPY[dashboard.nextAction].cta;
}

function isUrgent(dashboard: StudentDashboard): boolean {
  if (URGENT_ACTIONS.has(dashboard.nextAction)) return true;
  if (
    dashboard.nextAction === "add_internship" &&
    dashboard.internship?.status === "draft"
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
  if (dashboard.nextAction === "fix_internship" || dashboard.nextAction === "rejected") {
    return dashboard.internship?.latestReason?.trim() || null;
  }

  return null;
}
