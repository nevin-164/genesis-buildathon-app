import { getStudentDashboard } from "@/controllers/application.controller";
import { StudentDashboardView } from "@/components/dashboard/StudentDashboardView";
import { exploreDisplay, exploreFont } from "@/components/explore/explore-font";
import { EXPLORE_ROOT } from "@/components/explore/explore-ui";
import { requireStudentPage } from "@/lib/auth/dal";
import { cn } from "@/lib/cn";

export default async function StudentDashboardPage() {
  const user = await requireStudentPage();
  const dashboard = await getStudentDashboard();
  const fullName = user.fullName.trim() || null;

  return (
    <div className={cn(exploreFont.className, exploreDisplay.variable, EXPLORE_ROOT)}>
      <StudentDashboardView dashboard={dashboard} fullName={fullName} />
    </div>
  );
}
