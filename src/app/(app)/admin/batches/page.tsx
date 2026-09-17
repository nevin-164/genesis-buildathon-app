import Link from "next/link";

import { FilterBar } from "@/components/admin/FilterBar";
import { InlineAddForm } from "@/components/admin/InlineAddForm";
import { Column, OrgList } from "@/components/admin/OrgList";
import { StaffContent, StaffPageHeader } from "@/components/staff/StaffShell";
import {
  CONTROL_SM,
  CONTROL_SM_SELECT,
  FAINT,
  INK,
  LABEL,
  LINK_ACTION,
  MONO,
  MUTED,
} from "@/components/staff/staff-ui";
import { listBatches, listDepartments } from "@/controllers/admin/org.controller";
import { requireAdminPage } from "@/lib/auth/dal";
import { cn } from "@/lib/cn";

import { createBatchAction } from "./actions";

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
        <span className={cn("font-semibold", INK)}>{batch.name}</span>
      ),
    },
    {
      header: "Department",
      cell: (batch) => (
        <span className={MUTED}>{batch.departmentName ?? batch.department ?? "—"}</span>
      ),
    },
    {
      header: "Years",
      cell: (batch) => (
        <span className={cn(MONO, FAINT)}>
          {batch.startYear} – {batch.endYear}
        </span>
      ),
    },
    {
      header: "Classes",
      cell: (batch) => (
        <span className={MUTED}>{batch.classCount ?? batch.classesCount ?? 0} classes</span>
      ),
    },
    {
      header: "Actions",
      cell: (batch) => (
        <Link
          href={`/admin/classes?batchId=${batch.id}`}
          className={LINK_ACTION}
        >
          View classes <span aria-hidden="true">&rarr;</span>
        </Link>
      ),
    },
  ];

  return (
    <StaffContent>
      <StaffPageHeader
        eyebrow="Admin console · Organisation"
        title="Batches"
        subtitle="Batches within each department."
      />

      <FilterBar filters={filterGroups} />

      <InlineAddForm
        action={createBatchAction}
        title="Add a batch"
        submitLabel="Create batch"
      >
        <div className="min-w-[160px] flex-1">
          <label htmlFor="departmentId" className={LABEL}>
            Department
          </label>
          <select
            id="departmentId"
            name="departmentId"
            required
            defaultValue={departmentId ?? ""}
            className={CONTROL_SM_SELECT}
          >
            <option value="" disabled>
              Select a department
            </option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[140px] flex-1">
          <label htmlFor="name" className={LABEL}>
            Batch name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g. 2022-2026"
            className={CONTROL_SM}
          />
        </div>

        <div className="w-28">
          <label htmlFor="startYear" className={LABEL}>
            Start year
          </label>
          <input
            id="startYear"
            name="startYear"
            type="number"
            required
            defaultValue={new Date().getFullYear()}
            placeholder="2022"
            className={cn(CONTROL_SM, "font-mono")}
          />
        </div>

        <div className="w-28">
          <label htmlFor="endYear" className={LABEL}>
            End year
          </label>
          <input
            id="endYear"
            name="endYear"
            type="number"
            required
            defaultValue={new Date().getFullYear() + 4}
            placeholder="2026"
            className={cn(CONTROL_SM, "font-mono")}
          />
        </div>
      </InlineAddForm>

      <OrgList
        title="Batches directory"
        items={batches}
        columns={columns}
        emptyMessage="No batches found for the selected filter."
      />
    </StaffContent>
  );
}
