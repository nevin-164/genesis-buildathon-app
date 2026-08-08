import type {
  ContributableApplication,
  ExperienceDetail,
  ExperienceListItem,
  ExperienceStatus,
} from "@/types/contracts";

export type ExperienceAction = {
  label: string;
  href: string;
  variant: "primary" | "ghost";
};

export type ExperienceDetailActions = {
  actions: ExperienceAction[];
  statusNotice: string | null;
};

function experienceDetailPath(experienceId: string): string {
  return `/student/experience/${experienceId}`;
}

function experienceEditPath(experienceId: string): string {
  return `/student/experience/${experienceId}/edit`;
}

export function isExperienceDetailSelfLink(href: string, experienceId: string): boolean {
  return href === experienceDetailPath(experienceId);
}

export function experienceStatusHeadline(status: ExperienceStatus): string {
  switch (status) {
    case "draft":
      return "Draft report in progress";
    case "submitted":
      return "Report submitted for verification";
    case "changes_requested":
      return "Changes requested by faculty";
    case "verified":
      return "Published as a Reality Card";
    case "rejected":
      return "Report not approved";
    default:
      return "Experience report";
  }
}

export function experienceStatusDescription(status: ExperienceStatus): string | null {
  switch (status) {
    case "draft":
      return "Save your draft anytime and return when you are ready to submit.";
    case "submitted":
      return "Faculty are reviewing your internship report and certificate.";
    case "changes_requested":
      return "Update the sections your faculty reviewer mentioned, then resubmit.";
    case "verified":
      return "Your verified experience is now available for other students to read.";
    case "rejected":
      return "Read the faculty feedback below for more context.";
    default:
      return null;
  }
}

export function experiencePrimaryAction(experience: ExperienceListItem): ExperienceAction {
  const base = experienceDetailPath(experience.id);

  switch (experience.status) {
    case "draft":
    case "changes_requested":
      return {
        label: experience.status === "changes_requested" ? "Edit report" : "Continue draft",
        href: `${base}/edit`,
        variant: "primary",
      };
    case "verified":
      return {
        label: "View Reality Card",
        href: `/student/explore/${experience.id}`,
        variant: "primary",
      };
    case "submitted":
      return {
        label: "View submission",
        href: base,
        variant: "ghost",
      };
    case "rejected":
      return {
        label: "View feedback",
        href: base,
        variant: "ghost",
      };
    default:
      return {
        label: "View report",
        href: base,
        variant: "ghost",
      };
  }
}

export function experienceSecondaryAction(
  experience: ExperienceListItem,
): ExperienceAction | null {
  if (experience.status === "verified") {
    return {
      label: "View report",
      href: experienceDetailPath(experience.id),
      variant: "ghost",
    };
  }
  if (experience.status === "submitted" || experience.status === "rejected") {
    return null;
  }
  return {
    label: "View submission",
    href: experienceDetailPath(experience.id),
    variant: "ghost",
  };
}

/** Detail page actions — never link back to the current detail route. */
export function experienceDetailActions(experience: ExperienceDetail): ExperienceDetailActions {
  const actions: ExperienceAction[] = [];

  if (experience.canEdit) {
    actions.push({
      label: experience.status === "changes_requested" ? "Edit experience" : "Continue editing",
      href: experienceEditPath(experience.id),
      variant: "primary",
    });
    return { actions, statusNotice: null };
  }

  if (experience.status === "submitted") {
    return {
      actions,
      statusNotice: "Awaiting faculty verification",
    };
  }

  return {
    actions: actions.filter((action) => !isExperienceDetailSelfLink(action.href, experience.id)),
    statusNotice: null,
  };
}

export function findOpenExperienceDraft(
  experiences: ExperienceListItem[],
): ExperienceListItem | null {
  return (
    experiences.find(
      (experience) =>
        experience.status === "draft" || experience.status === "changes_requested",
    ) ?? null
  );
}

export function contributableReadyLabel(contributable: ContributableApplication): string {
  return `${contributable.companyName} · ${contributable.roleTitle}`;
}
