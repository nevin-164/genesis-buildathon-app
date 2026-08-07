import { getStudentDashboard } from "@/controllers/internship.controller";
import { StudentDashboardView } from "@/components/dashboard/StudentDashboardView";
import { StudentPageShell } from "@/components/layout/student-page-shell";
import { requireStudentPage } from "@/lib/auth/dal";

export default async function StudentDashboardPage() {
  const user = await requireStudentPage();
  const dashboard = await getStudentDashboard();
  const fullName = user.fullName.trim() || null;

  return (
    <StudentPageShell>
      <StudentDashboardView dashboard={dashboard} fullName={fullName} />
    </StudentPageShell>
  );
}

