import Link from "next/link";

import { InlineAddForm } from "@/components/admin/InlineAddForm";
import { Column, OrgList } from "@/components/admin/OrgList";
import { StaffContent, StaffPageHeader } from "@/components/staff/StaffShell";
import {
  CHIP_MONO,
  CONTROL_SM,
  INK,
  LABEL,
  LINK_ACTION,
  MUTED,
} from "@/components/staff/staff-ui";
import { listDepartments } from "@/controllers/admin/org.controller";
import { requireAdminPage } from "@/lib/auth/dal";
import { cn } from "@/lib/cn";

import { createDepartmentAction } from "./actions";

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
        <span className={cn(CHIP_MONO, "font-bold text-[#c8ef5a]")}>{dept.code}</span>
      ),
    },
    {
      header: "Department Name",
      cell: (dept) => <span className={cn("font-semibold", INK)}>{dept.name}</span>,
    },
    {
      header: "Batches",
      cell: (dept) => (
        <span className={MUTED}>{dept.batchCount ?? dept.batchesCount ?? 0} batches</span>
      ),
    },
    {
      header: "Actions",
      cell: (dept) => (
        <Link
          href={`/admin/batches?departmentId=${dept.id}`}
          className={LINK_ACTION}
        >
          View batches <span aria-hidden="true">&rarr;</span>
        </Link>
      ),
    },
  ];

  return (
    <StaffContent>
      <StaffPageHeader
        eyebrow="Admin console · Organisation"
        title="Departments"
        subtitle="Departments in your organisation."
      />

      <InlineAddForm
        action={createDepartmentAction}
        title="Add a department"
        submitLabel="Create department"
      >
        <div className="min-w-[140px] flex-1">
          <label htmlFor="code" className={LABEL}>
            Code (2-10 uppercase)
          </label>
          <input
            id="code"
            name="code"
            type="text"
            required
            maxLength={10}
            placeholder="e.g. CSE"
            className={cn(CONTROL_SM, "font-mono uppercase")}
          />
        </div>

        <div className="min-w-[220px] flex-[2]">
          <label htmlFor="name" className={LABEL}>
            Department name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g. Computer Science & Engineering"
            className={CONTROL_SM}
          />
        </div>
      </InlineAddForm>

      <OrgList
        title="Departments directory"
        items={departments}
        columns={columns}
        emptyMessage="No departments created yet. Use the form above to add the first one."
      />
    </StaffContent>
  );
}
