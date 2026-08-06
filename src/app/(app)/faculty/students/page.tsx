import { listAssignedStudents } from "@/controllers/faculty.controller";
import { requireFacultyPage } from "@/lib/auth/dal";
import { StudentTable } from "@/components/faculty/StudentTable";

export default async function AssignedStudentsPage() {
  await requireFacultyPage();
  const students = await listAssignedStudents();

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 sm:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Assigned Students
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Roster of students under your advising. Search or filter by application status.
        </p>
      </div>

      <StudentTable students={students} />
    </div>
  );
}
