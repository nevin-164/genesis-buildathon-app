import { cn } from "@/lib/cn";
import type { StudentDashboard } from "@/types/contracts";

import { DashboardExploreFeature } from "./DashboardExploreFeature";
import { DashboardJourney } from "./DashboardJourney";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardWelcome } from "./DashboardWelcome";
import { DashboardWorkflow } from "./DashboardWorkflow";

const DASHBOARD_LAYOUT = "w-full min-w-0 space-y-4 sm:space-y-5";
const DASHBOARD_GRID =
  "grid min-w-0 gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(220px,260px)] lg:items-start";

export function StudentDashboardView({
  dashboard,
  fullName,
}: {
  dashboard: StudentDashboard;
  fullName: string | null;
}) {
  return (
    <div className={DASHBOARD_LAYOUT}>
      <DashboardWelcome fullName={fullName} />

      <div className={DASHBOARD_GRID}>
        <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
          <DashboardJourney dashboard={dashboard} />
          <DashboardWorkflow dashboard={dashboard} />
          <DashboardExploreFeature />
        </div>

        <DashboardSidebar fullName={fullName} />
      </div>
    </div>
  );
}
