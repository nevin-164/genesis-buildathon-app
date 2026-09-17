import Link from "next/link";

import { AdvisorSelect } from "@/components/admin/AdvisorSelect";
import { FilterBar } from "@/components/admin/FilterBar";
import { InlineAddForm } from "@/components/admin/InlineAddForm";
import { Column, OrgList } from "@/components/admin/OrgList";
import { StaffContent, StaffPageHeader } from "@/components/staff/StaffShell";
import {
  ACCENT,
  CONTROL_SM,
  CONTROL_SM_SELECT,
  INK,
  LABEL,
  LINK_ACTION,
  MUTED,
  NOTICE_WARNING,
} from "@/components/staff/staff-ui";
import {
  listBatches,
  listClasses,
  listDepartments,
  listFacultyOptions,
} from "@/controllers/admin/org.controller";
import { requireAdminPage } from "@/lib/auth/dal";
import { cn } from "@/lib/cn";
import type { ClassRow } from "@/types/contracts";

import { createClassAction } from "./actions";

/**
 * Level 3 of the tree, and the level that carries the advisor.
 *
 * The advisor is mandatory. Every student in a class routes their submissions
 * to whoever is named here, so a class without one is a class whose students
 * cannot be verified — the database refuses it, and so does this form.
 */
export default async function ClassesPage(props: PageProps<"/admin/classes">) {
  await requireAdminPage();

  const sp = await props.searchParams;
  const departmentId = typeof sp?.departmentId === "string" ? sp.departmentId : undefined;
  const batchId = typeof sp?.batchId === "string" ? sp.batchId : undefined;

  const [classes, departments, batches, facultyOptions] = await Promise.all([
    listClasses(batchId),
    listDepartments(),
    listBatches(departmentId),
    listFacultyOptions(),
  ]);

  const filterGroups = [
    {
      key: "departmentId",
      label: "Department",
      options: departments.map((d) => ({ value: d.id, label: `${d.code} - ${d.name}` })),
      allLabel: "All Departments",
    },
    {
      key: "batchId",
      label: "Batch",
      options: batches.map((b) => ({ value: b.id, label: b.name })),
      allLabel: "All Batches",
    },
  ];

  const columns: Column<ClassRow>[] = [
    {
      header: "Class Name",
      cell: (cls) => <span className={cn("font-semibold", INK)}>{cls.name}</span>,
    },
    { header: "Batch", cell: (cls) => <span className={MUTED}>{cls.batchName}</span> },
    {
      header: "Department",
      cell: (cls) => <span className={MUTED}>{cls.departmentName}</span>,
    },
    {
      header: "Faculty Advisor",
      cell: (cls) => <span className={cn("font-semibold", ACCENT)}>{cls.advisor.fullName}</span>,
    },
    {
      header: "Students",
      cell: (cls) => <span className={MUTED}>{cls.studentCount} students</span>,
    },
    {
      header: "Actions",
      cell: (cls) => (
        <Link
          href={`/admin/classes/${cls.id}`}
          className={LINK_ACTION}
        >
          Manage class <span aria-hidden="true">&rarr;</span>
        </Link>
      ),
    },
  ];

  return (
    <StaffContent>
      <StaffPageHeader
        eyebrow="Admin console · Organisation"
        title="Classes"
        subtitle="Classes and the advisor who verifies for each."
      />

      <FilterBar filters={filterGroups} />

      {/*
        No faculty means no class can be created at all. Say so here rather than
        letting the form fail on submit — the fix is somebody registering, which
        is not an action available on this screen.
      */}
      {facultyOptions.length === 0 ? (
        <p className={NOTICE_WARNING}>
          No faculty accounts yet. A class cannot be created without an advisor,
          so ask a faculty member to register at <code>/register</code> first —
          they do not need anything from this tree to sign up.
        </p>
      ) : (
        <InlineAddForm action={createClassAction} title="Add a class" submitLabel="Create class">
          <div className="min-w-[160px] flex-1">
            <label htmlFor="batchId" className={LABEL}>
              Batch
            </label>
            <select
              id="batchId"
              name="batchId"
              required
              defaultValue={batchId ?? ""}
              className={CONTROL_SM_SELECT}
            >
              <option value="" disabled>
                Select a batch
              </option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[140px] flex-1">
            <label htmlFor="name" className={LABEL}>
              Class name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. S6-CSE-A"
              className={CONTROL_SM}
            />
          </div>

          <div className="min-w-[180px] flex-1">
            <label htmlFor="advisorId" className={LABEL}>
              Faculty advisor
            </label>
            <AdvisorSelect options={facultyOptions} className="w-full" />
          </div>
        </InlineAddForm>
      )}

      <OrgList
        title="Classes directory"
        items={classes}
        columns={columns}
        emptyMessage="No classes found for the selected filter."
      />
    </StaffContent>
  );
}
