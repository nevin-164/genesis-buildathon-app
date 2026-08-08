import { CanvasPageHeader, DashboardDiscoverySection, InternshipJourneyPathway } from "@/components/student/primitives";
import type { StudentDashboard } from "@/types/contracts";

import { DashboardJourney } from "./DashboardJourney";
import { DashboardWorkflow } from "./DashboardWorkflow";
import { firstNameFromFullName } from "./dashboard-utils";

function activeStageIndex(nextAction: StudentDashboard["nextAction"]): number {
  switch (nextAction) {
    case "submit_application":
      return 0;
    case "await_approval":
    case "respond_clarification":
    case "rejected":
      return 1;
    case "contribute_experience":
    case "fix_experience":
      return 2;
    case "await_verification":
      return 3;
    case "published":
      return 4;
    default:
      return 0;
  }
}

function CanvasGreeting({ fullName }: { fullName: string | null }) {
  const firstName = fullName ? firstNameFromFullName(fullName) : null;

  return (
    <CanvasPageHeader
      variant="greeting"
      contentGap={false}
      divider={false}
      eyebrow="Student home"
      title={
        firstName ? (
          <>
            Welcome back, <span className="text-[var(--il-moss)]">{firstName}</span>
          </>
        ) : (
          "Welcome back"
        )
      }
      lead="Your internship approval, faculty responses, and verified student experiences — in one place."
    />
  );
}

export function StudentDashboardView({
  dashboard,
  fullName,
}: {
  dashboard: StudentDashboard;
  fullName: string | null;
}) {
  const stageIndex = activeStageIndex(dashboard.nextAction);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <CanvasGreeting fullName={fullName} />

      <div className="h-px bg-[var(--il-border)]" aria-hidden="true" />

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)] lg:items-start lg:gap-6">
        <div className="flex min-w-0 flex-col gap-5">
          <DashboardJourney dashboard={dashboard} />
          <DashboardWorkflow dashboard={dashboard} />
        </div>

        <div className="min-w-0">
          <InternshipJourneyPathway activeIndex={stageIndex} />
        </div>
      </div>

      <DashboardDiscoverySection />
    </div>
  );
}
