import Link from "next/link";

import { requireAdminPage } from "@/lib/auth/dal";
import { listUnassignedInternships } from "@/controllers/admin/assignment.controller";
import { listFacultyOptions } from "@/controllers/admin/org.controller";
import { AdvisorSelect, FacultyOption } from "@/components/admin/AdvisorSelect";
import { ActionForm } from "@/components/admin/ActionForm";
import { OrgList, Column } from "@/components/admin/OrgList";
import { assignFacultyAction } from "./actions";

interface UnassignedRow {
  id: string;
  studentName: string;
  registerNumber: string;
  className: string | null;
  companyName: string;
  submittedAt: string;
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export default async function AssignmentsPage() {
  await requireAdminPage();

  const [unassigned, facultyOptions]: [
    { internshipId: string; studentName: string; registerNumber: string; className: string | null; companyName: string; submittedAt: string }[],
    FacultyOption[]
  ] = await Promise.all([listUnassignedInternships(), listFacultyOptions()]);

  // OrgList keys on `id`; the queue is keyed by the internship.
  const rows: UnassignedRow[] = unassigned.map((item) => ({
    id: item.internshipId,
    studentName: item.studentName,
    registerNumber: item.registerNumber,
    className: item.className,
    companyName: item.companyName,
    submittedAt: item.submittedAt,
  }));

  const columns: Column<UnassignedRow>[] = [
    {
      header: "Student",
      cell: (row) => (
        <div>
          <div className="font-medium text-white">{row.studentName}</div>
          <div className="font-mono text-xs text-slate-400">
            {row.registerNumber}
          </div>
        </div>
      ),
    },
    {
      header: "Class",
      cell: (row) =>
        row.className ? (
          <span className="text-slate-300">{row.className}</span>
        ) : (
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-950/80 border border-amber-800/80 text-amber-300">
            No class
          </span>
        ),
    },
    {
      header: "Company",
      cell: (row) => <span className="text-slate-300">{row.companyName}</span>,
    },
    {
      header: "Submitted",
      cell: (row) => (
        <span className="font-mono text-xs text-slate-500">
          {DATE_FORMAT.format(new Date(row.submittedAt))}
        </span>
      ),
    },
    {
      header: "Assign to",
      cell: (row) => (
        <ActionForm action={assignFacultyAction} className="flex items-center gap-2">
          <input type="hidden" name="internshipId" value={row.id} />
          <AdvisorSelect
            name="facultyId"
            id={`facultyId-${row.id}`}
            options={facultyOptions}
            emptyLabel="— Pick a faculty —"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            Assign
          </button>
        </ActionForm>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Assignments ({rows.length})
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Internships that were submitted with nobody to verify them.
        </p>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed bg-slate-900 border border-slate-800 p-4 rounded-xl">
        💡 <strong className="text-slate-300">This is the repair tool.</strong>{" "}
        Assigning here fixes one internship. To stop it happening again, give
        the student&apos;s class an advisor on{" "}
        <Link
          href="/admin/classes"
          className="text-blue-400 hover:text-blue-300 underline"
        >
          Classes
        </Link>
        .
      </p>

      <OrgList
        title="Unassigned internships"
        items={rows}
        columns={columns}
        emptyMessage="Nothing is waiting. Every submitted internship has a verifier."
      />
    </div>
  );
}
