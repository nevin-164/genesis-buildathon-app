import type { StudentDashboard } from "@/types/contracts";

export type NextStepDisplay = {
  title: string;
  text: string;
  href: string;
  cta: string;
  urgent: boolean;
};

/**
 * One stage, not two: a student adds an internship and their advisor verifies
 * it. There is no approval step before it, so there is no "await approval" or
 * "contribute experience" state to be in.
 */
const NEXT_STEP_COPY: Record<
  StudentDashboard["nextAction"],
  { text: string; href: string; cta: string }
> = {
  add_internship: {
    text: "Finished an internship? Add it so your advisor can verify it.",
    href: "/student/internships/new",
    cta: "Add an internship",
  },
  await_verification: {
    text: "Your internship is with your faculty advisor.",
    href: "/student/internships",
    cta: "View internship",
  },
  fix_internship: {
    text: "Your advisor asked for some changes.",
    href: "/student/internships",
    cta: "View and respond",
  },
  published: {
    text: "Your internship is published. Thank you for contributing.",
    href: "/student/explore",
    cta: "View on Explore",
  },
  rejected: {
    text: "Your internship was not accepted.",
    href: "/student/internships",
    cta: "View reason",
  },
};

const JOURNEY_TITLES: Record<StudentDashboard["nextAction"], string> = {
  add_internship: "Nothing added yet",
  await_verification: "Waiting for verification",
  fix_internship: "Changes requested",
  published: "Published on Explore",
  rejected: "Not accepted",
};

const URGENT_ACTIONS = new Set<StudentDashboard["nextAction"]>(["fix_internship"]);

/** A started-but-unsubmitted draft is its own thing, and it is urgent. */
function hasDraft(dashboard: StudentDashboard): boolean {
  return (
    dashboard.nextAction === "add_internship" && dashboard.internship?.status === "draft"
  );
}

function journeyTitle(dashboard: StudentDashboard): string {
  if (hasDraft(dashboard)) return "Draft in progress";
  return JOURNEY_TITLES[dashboard.nextAction];
}

function resolveHref(dashboard: StudentDashboard): string {
  const base = NEXT_STEP_COPY[dashboard.nextAction].href;
  const internship = dashboard.internship;
  if (!internship) return base;

  switch (dashboard.nextAction) {
    case "add_internship":
      return internship.status === "draft"
        ? `/student/internships/${internship.id}/edit`
        : base;
    case "fix_internship":
      return `/student/internships/${internship.id}`;
    case "await_verification":
    case "rejected":
      return `/student/internships/${internship.id}`;
    default:
      return base;
  }
}

function resolveCta(dashboard: StudentDashboard): string {
  if (hasDraft(dashboard)) return "Continue draft";
  return NEXT_STEP_COPY[dashboard.nextAction].cta;
}

export function resolveNextStep(dashboard: StudentDashboard): NextStepDisplay {
  const copy = NEXT_STEP_COPY[dashboard.nextAction];

  return {
    title: journeyTitle(dashboard),
    text: copy.text,
    href: resolveHref(dashboard),
    cta: resolveCta(dashboard),
    urgent: URGENT_ACTIONS.has(dashboard.nextAction) || hasDraft(dashboard),
  };
}

export function latestActionReason(dashboard: StudentDashboard): string | null {
  if (dashboard.nextAction === "fix_internship" || dashboard.nextAction === "rejected") {
    return dashboard.internship?.latestReason?.trim() || null;
  }
  return null;
}
