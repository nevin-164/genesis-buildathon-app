import { requireAdminPage } from "@/lib/auth/dal";
import { listBatches, listDepartments } from "@/controllers/admin/org.controller";
import { OrgList, Column } from "@/components/admin/OrgList";
import { InlineAddForm } from "@/components/admin/InlineAddForm";
import { FilterBar } from "@/components/admin/FilterBar";
import { createBatchAction } from "./actions";
import Link from "next/link";

interface BatchRow {
  id: string;
  name: string;
  departmentId?: string;
  departmentName?: string;
  department?: string;
  startYear: number;
  endYear: number;
  classCount?: number;
  classesCount?: number;
}

interface DepartmentOption {
  id: string;
  name: string;
  code: string;
}

export default async function BatchesPage(props: PageProps<"/admin/batches">) {
  await requireAdminPage();

  const sp = await props.searchParams;
  const departmentId = sp?.departmentId as string | undefined;

  const [batches, departments]: [BatchRow[], DepartmentOption[]] =
    await Promise.all([listBatches(departmentId), listDepartments()]);

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
  ];

  const columns: Column<BatchRow>[] = [
    {
      header: "Batch Name",
      cell: (batch) => (
        <span className="font-semibold text-white">{batch.name}</span>
      ),
    },
    {
      header: "Department",
      cell: (batch) => (
        <span className="text-slate-300">
          {batch.departmentName ?? batch.department ?? "N/A"}
        </span>
      ),
    },
    {
      header: "Years",
      cell: (batch) => (
        <span className="font-mono text-slate-400 text-xs">
          {batch.startYear} – {batch.endYear}
        </span>
      ),
    },
    {
      header: "Classes",
      cell: (batch) => (
        <span className="text-slate-400">
          {batch.classCount ?? batch.classesCount ?? 0} classes
        </span>
      ),
    },
    {
      header: "Actions",
      cell: (batch) => (
        <Link
          href={`/admin/classes?batchId=${batch.id}`}
          className="text-xs font-semibold text-blue-400 hover:text-blue-300 underline"
        >
          View Classes →
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Batches</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage academic batches under departments.
        </p>
      </div>

      <FilterBar filters={filterGroups} />

      <InlineAddForm
        action={createBatchAction}
        title="Add New Batch"
        submitLabel="Create Batch"
      >
        <div className="flex-1 min-w-[160px]">
          <label
            htmlFor="departmentId"
            className="block text-xs font-medium text-slate-400 mb-1"
          >
            Department
          </label>
          <select
            id="departmentId"
            name="departmentId"
            required
            defaultValue={departmentId ?? ""}
            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="" disabled>
              Select Department
            </option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[140px]">
          <label
            htmlFor="name"
            className="block text-xs font-medium text-slate-400 mb-1"
          >
            Batch Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g. 2022-2026"
            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="w-28">
          <label
            htmlFor="startYear"
            className="block text-xs font-medium text-slate-400 mb-1"
          >
            Start Year
          </label>
          <input
            id="startYear"
            name="startYear"
            type="number"
            required
            defaultValue={new Date().getFullYear()}
            placeholder="2022"
            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <div className="w-28">
          <label
            htmlFor="endYear"
            className="block text-xs font-medium text-slate-400 mb-1"
          >
            End Year
          </label>
          <input
            id="endYear"
            name="endYear"
            type="number"
            required
            defaultValue={new Date().getFullYear() + 4}
            placeholder="2026"
            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>
      </InlineAddForm>

      <OrgList
        title="Batches Directory"
        items={batches}
        columns={columns}
        emptyMessage="No batches found for the selected filter."
      />
    </div>
  );
}
