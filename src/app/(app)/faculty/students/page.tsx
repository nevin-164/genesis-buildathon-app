import { StaffContent, StaffPageHeader } from "@/components/staff/StaffShell";
import { StudentTable } from "@/components/faculty/StudentTable";
import { listAssignedStudents } from "@/controllers/faculty.controller";
import { requireFacultyPage } from "@/lib/auth/dal";

export default async function AssignedStudentsPage() {
  await requireFacultyPage();
  const students = await listAssignedStudents();

  return (
    <StaffContent>
      <StaffPageHeader
        eyebrow="Faculty console"
        title="Assigned students"
        subtitle="Students in the classes you advise."
      />

      <StudentTable students={students} />
    </StaffContent>
  );
}
