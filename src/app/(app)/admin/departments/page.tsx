import { requireAdminPage } from "@/lib/auth/dal";
import { listDepartments } from "@/controllers/admin/org.controller";
import { OrgList, Column } from "@/components/admin/OrgList";
import { InlineAddForm } from "@/components/admin/InlineAddForm";
import { createDepartmentAction } from "./actions";
import Link from "next/link";

interface DepartmentRow {
  id: string;
  code: string;
  name: string;
  batchCount?: number;
  batchesCount?: number;
}

export default async function DepartmentsPage() {
  await requireAdminPage();

  const departments: DepartmentRow[] = await listDepartments();

  const columns: Column<DepartmentRow>[] = [
    {
      header: "Code",
      cell: (dept) => (
        <span className="font-mono font-bold text-blue-400 bg-blue-950/60 px-2 py-1 rounded border border-blue-900/50">
          {dept.code}
        </span>
      ),
    },
    {
      header: "Department Name",
      cell: (dept) => <span className="text-white font-medium">{dept.name}</span>,
    },
    {
      header: "Batches",
      cell: (dept) => (
        <span className="text-slate-400">
          {dept.batchCount ?? dept.batchesCount ?? 0} batches
        </span>
      ),
    },
    {
      header: "Actions",
      cell: (dept) => (
        <Link
          href={`/admin/batches?departmentId=${dept.id}`}
          className="text-xs font-semibold text-blue-400 hover:text-blue-300 underline"
        >
          View Batches →
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Departments
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage academic departments in the organization tree.
        </p>
      </div>

      <InlineAddForm
        action={createDepartmentAction}
        title="Add New Department"
        submitLabel="Create Department"
      >
        <div className="flex-1 min-w-[140px]">
          <label
            htmlFor="code"
            className="block text-xs font-medium text-slate-400 mb-1"
          >
            Code (2-10 uppercase)
          </label>
          <input
            id="code"
            name="code"
            type="text"
            required
            maxLength={10}
            placeholder="e.g. CSE"
            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 font-mono uppercase"
          />
        </div>

        <div className="flex-[2] min-w-[220px]">
          <label
            htmlFor="name"
            className="block text-xs font-medium text-slate-400 mb-1"
          >
            Department Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g. Computer Science & Engineering"
            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </InlineAddForm>

      <OrgList
        title="Departments Directory"
        items={departments}
        columns={columns}
        emptyMessage="No departments created yet. Use the form above to add the first department."
      />
    </div>
  );
}
