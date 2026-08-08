import type { ApplicationDetail, ApplicationListItem } from "@/types/contracts";

export type ApplicationAction = {
  label: string;
  href: string;
  variant: "primary" | "ghost";
};

export type ApplicationDetailActions = {
  actions: ApplicationAction[];
  statusNotice: string | null;
};

function applicationDetailPath(applicationId: string): string {
  return `/student/application/${applicationId}`;
}

function applicationEditPath(applicationId: string): string {
  return `/student/application/${applicationId}/edit`;
}

export function isApplicationDetailSelfLink(href: string, applicationId: string): boolean {
  return href === applicationDetailPath(applicationId);
}

export function findOpenApplicationDraft(
  applications: ApplicationListItem[],
): ApplicationListItem | null {
  return applications.find((application) => application.status === "draft") ?? null;
}

/** Detail page actions — never link back to the current detail route. */
export function applicationDetailActions(
  application: ApplicationDetail,
): ApplicationDetailActions {
  const actions: ApplicationAction[] = [];

  if (application.canEdit) {
    actions.push({
      label:
        application.status === "clarification_requested"
          ? "Update application"
          : "Continue editing",
      href: applicationEditPath(application.id),
      variant: "primary",
    });
    return { actions, statusNotice: null };
  }

  if (application.status === "submitted") {
    return {
      actions,
      statusNotice: "Awaiting faculty approval",
    };
  }

  return {
    actions: actions.filter(
      (action) => !isApplicationDetailSelfLink(action.href, application.id),
    ),
    statusNotice: null,
  };
}
