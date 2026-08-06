import { requireAdminPage } from "@/lib/auth/dal";
import {
  getClass,
  listFacultyOptions,
} from "@/controllers/admin/org.controller";
import { AdvisorSelect, FacultyOption } from "@/components/admin/AdvisorSelect";
import { ActionForm } from "@/components/admin/ActionForm";
import {
  updateAdvisorAction,
  removeStudentAction,
} from "./actions";
import Link from "next/link";

interface EnrolledStudent {
  id: string;
  fullName: string;
  registerNumber?: string;
  email?: string;
}

interface ClassDetail {
  id: string;
  name: string;
  departmentCode?: string;
  departmentName?: string;
  batchName?: string;
  advisorId?: string | null;
  advisorName?: string | null;
  /** The contract returns the whole faculty row here, not an id. */
  advisor?: { id: string; fullName: string } | null;
  students?: EnrolledStudent[];
}

export default async function ClassDetailPage(
  props: PageProps<"/admin/classes/[id]">
) {
  await requireAdminPage();

  const { id } = await props.params;

  const [classDetail, facultyOptions]: [ClassDetail, FacultyOption[]] =
    await Promise.all([getClass(id), listFacultyOptions()]);

  const students = classDetail.students ?? [];

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Top Header & Back Navigation */}
      <div>
        <Link
          href="/admin/classes"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-3"
        >
          ← Back to classes
        </Link>
        <div className="flex items-center gap-2 text-sm text-slate-400 font-mono">
          <span>{classDetail.departmentCode ?? classDetail.departmentName ?? "Department"}</span>
          <span>/</span>
          <span>{classDetail.batchName ?? "Batch"}</span>
          <span>/</span>
          <span className="font-bold text-white">{classDetail.name}</span>
        </div>
      </div>

      {/* ADVISOR SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Faculty Advisor
        </h2>

        <ActionForm
          action={updateAdvisorAction}
          className="flex items-center gap-3"
        >
          <input type="hidden" name="classId" value={classDetail.id} />
          <div className="flex-1 max-w-md">
            <AdvisorSelect
              defaultValue={classDetail.advisorId ?? classDetail.advisor?.id}
              options={facultyOptions}
              className="w-full"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            Save Advisor
          </button>
        </ActionForm>

        <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
          💡 <strong className="text-slate-300">Note:</strong> Changing a class&apos;s advisor only affects applications submitted from now on. Anything already submitted stays with the faculty member currently reviewing it.
        </p>
      </div>

      {/* STUDENTS SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Enrolled Students ({students.length})
          </h2>
        </div>

        {students.length === 0 ? (
          <div className="px-6 py-8 text-center text-slate-500 text-sm">
            No students currently enrolled in this class.
          </div>
        ) : (
          <ul className="divide-y divide-slate-800/60">
            {students.map((student) => (
              <li
                key={student.id}
                className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
              >
                <div>
                  <span className="font-medium text-white text-sm">
                    {student.fullName}
                  </span>
                  {student.registerNumber && (
                    <span className="ml-3 font-mono text-xs text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {student.registerNumber}
                    </span>
                  )}
                </div>

                <ActionForm action={removeStudentAction}>
                  <input type="hidden" name="classId" value={classDetail.id} />
                  <input type="hidden" name="studentId" value={student.id} />
                  <button
                    type="submit"
                    className="text-xs font-medium text-red-400 hover:text-red-300 px-2.5 py-1 rounded bg-red-950/40 hover:bg-red-950/80 border border-red-900/40 transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                </ActionForm>
              </li>
            ))}
          </ul>
        )}

        {/* 
          TODO / DEPENDENCY NOTE FOR PACKAGE 3 (BACKEND CONTROLLER):
          The PDF mock includes an "[ Add a student to this class ]" form. 
          Once Package 3 exports `listEligibleStudents()` / `addStudentToClass(classId, studentId)`,
          this section will populate the student selector options.
        */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 text-xs text-slate-500 italic">
          📌 <strong className="text-slate-400 font-semibold">Package 3 Dependency:</strong> Student assignment form is pending backend controller export for eligible student options (`listEligibleStudents()`).
        </div>
      </div>
    </div>
  );
}
