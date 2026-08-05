import { requireAdminPage } from "@/lib/auth/dal";
import {
  listClasses,
  listBatches,
  listDepartments,
  listFacultyOptions,
} from "@/controllers/admin/org.controller";
import { OrgList, Column } from "@/components/admin/OrgList";
import { InlineAddForm } from "@/components/admin/InlineAddForm";
import { FilterBar } from "@/components/admin/FilterBar";
import { AdvisorSelect, FacultyOption } from "@/components/admin/AdvisorSelect";
import { createClassAction } from "./actions";
import Link from "next/link";

interface ClassRow {
  id: string;
  name: string;
  batchId?: string;
  batchName?: string;
  batch?: string;
  departmentName?: string;
  department?: string;
  advisorId?: string | null;
  advisorName?: string | null;
  advisor?: string | null;
  studentCount?: number;
  studentsCount?: number;
}

interface DepartmentRow {
  id: string;
  name: string;
  code: string;
}

interface BatchRow {
  id: string;
  name: string;
  departmentId?: string;
}

export default async function ClassesPage(props: PageProps<"/admin/classes">) {
  await requireAdminPage();

  const sp = await props.searchParams;
  const departmentId = sp?.departmentId as string | undefined;
  const batchId = sp?.batchId as string | undefined;

  const [classes, departments, batches, facultyOptions]: [
    ClassRow[],
    DepartmentRow[],
    BatchRow[],
    FacultyOption[]
  ] = await Promise.all([
    listClasses(batchId),
    listDepartments(),
    listBatches(departmentId),
    listFacultyOptions(),
  ]);

  const filterGroups = [
    {
      key: "departmentId",
      label: "Department",
      options: departments.map((d) => ({
        value: d.id,
        label: `${d.code} - ${d.name}`,
      })),
      allLabel: "All Departments",
    },
    {
      key: "batchId",
      label: "Batch",
      options: batches.map((b) => ({
        value: b.id,
        label: b.name,
      })),
      allLabel: "All Batches",
    },
  ];

  const columns: Column<ClassRow>[] = [
    {
      header: "Class Name",
      cell: (cls) => (
        <span className="font-semibold text-white">{cls.name}</span>
      ),
    },
    {
      header: "Batch",
      cell: (cls) => (
        <span className="text-slate-300">
          {cls.batchName ?? cls.batch ?? "N/A"}
        </span>
      ),
    },
    {
      header: "Department",
      cell: (cls) => (
        <span className="text-slate-400">
          {cls.departmentName ?? cls.department ?? "N/A"}
        </span>
      ),
    },
    {
      header: "Faculty Advisor",
      cell: (cls) => {
        const advisorName = cls.advisorName ?? cls.advisor;
        if (advisorName) {
          return (
            <span className="font-medium text-blue-300">{advisorName}</span>
          );
        }
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-950/80 border border-amber-800/80 text-amber-300 inline-block">
            No advisor
          </span>
        );
      },
    },
    {
      header: "Students",
      cell: (cls) => (
        <span className="text-slate-400">
          {cls.studentCount ?? cls.studentsCount ?? 0} students
        </span>
      ),
    },
    {
      header: "Actions",
      cell: (cls) => (
        <Link
          href={`/admin/classes/${cls.id}`}
          className="text-xs font-semibold text-blue-400 hover:text-blue-300 underline"
        >
          Manage Class →
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Classes</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage classes and assign faculty advisors to link students to faculty.
        </p>
      </div>

      <FilterBar filters={filterGroups} />

      <InlineAddForm
        action={createClassAction}
        title="Add New Class"
        submitLabel="Create Class"
      >
        <div className="flex-1 min-w-[160px]">
          <label
            htmlFor="batchId"
            className="block text-xs font-medium text-slate-400 mb-1"
          >
            Batch
          </label>
          <select
            id="batchId"
            name="batchId"
            required
            defaultValue={batchId ?? ""}
            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="" disabled>
              Select Batch
            </option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[140px]">
          <label
            htmlFor="name"
            className="block text-xs font-medium text-slate-400 mb-1"
          >
            Class Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g. S6-CSE-A"
            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex-1 min-w-[180px]">
          <label
            htmlFor="advisorId"
            className="block text-xs font-medium text-slate-400 mb-1"
          >
            Faculty Advisor (Optional)
          </label>
          <AdvisorSelect options={facultyOptions} className="w-full" />
        </div>
      </InlineAddForm>

      <OrgList
        title="Classes Directory"
        items={classes}
        columns={columns}
        emptyMessage="No classes found for the selected filter."
      />
    </div>
  );
}
