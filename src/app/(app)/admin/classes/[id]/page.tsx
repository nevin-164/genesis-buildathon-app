import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/admin/ActionForm";
import { AdvisorSelect } from "@/components/admin/AdvisorSelect";
import { StaffContent, StaffPageHeader } from "@/components/staff/StaffShell";
import {
  BTN_PRIMARY,
  BTN_SECONDARY_SM,
  CHIP_MONO,
  CONTROL_SM_SELECT,
  EMPTY,
  FAINT,
  INK,
  INSET,
  LINK_BACK,
  MOTION,
  MUTED,
  PANEL_FLUSH,
  PANEL_HEADER,
  PANEL_PADDED,
  SECTION_HEADING,
  SECTION_TITLE,
} from "@/components/staff/staff-ui";
import {
  getClass,
  listClasses,
  listFacultyOptions,
  listStudentsOutsideClass,
} from "@/controllers/admin/org.controller";
import { requireAdminPage } from "@/lib/auth/dal";
import { NotFoundError } from "@/lib/auth/errors";
import { cn } from "@/lib/cn";

import { addStudentAction, moveStudentAction, updateAdvisorAction } from "./actions";

export default async function ClassDetailPage(props: PageProps<"/admin/classes/[id]">) {
  await requireAdminPage();

  const { id } = await props.params;

  // A bad id is a missing page, not a server fault.
  const loaded = await Promise.all([
    getClass(id),
    listFacultyOptions(),
    listStudentsOutsideClass(id),
    listClasses(),
  ]).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });
  const [classDetail, facultyOptions, movable, allClasses] = loaded;

  const students = classDetail.students;
  const otherClasses = allClasses.filter((cls) => cls.id !== id);

  return (
    <StaffContent width="narrow">
      <StaffPageHeader
        eyebrow="Admin console · Classes"
        title={classDetail.name}
        subtitle={
          <span className="font-mono text-xs">
            {classDetail.departmentName} <span className={FAINT}>/</span>{" "}
            {classDetail.batchName} <span className={FAINT}>/</span> {classDetail.name}
          </span>
        }
        back={
          <Link href="/admin/classes" className={LINK_BACK}>
            <span aria-hidden="true">&larr;</span> Back to classes
          </Link>
        }
      />

      {/* ADVISOR — the routing decision for everything this class submits next */}
      <section className={cn(PANEL_PADDED, "space-y-4")}>
        <h2 className={SECTION_TITLE}>Faculty advisor</h2>

        <ActionForm action={updateAdvisorAction} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="classId" value={classDetail.id} />
          <div className="min-w-[240px] max-w-md flex-1">
            <AdvisorSelect
              defaultValue={classDetail.advisor.id}
              options={facultyOptions}
              className="w-full"
            />
          </div>
          <button type="submit" className={BTN_PRIMARY}>
            Save advisor
          </button>
        </ActionForm>

        <div className={cn(INSET, "space-y-2 text-xs leading-relaxed", MUTED)}>
          <p>
            <strong className={INK}>Handing this class over</strong> only affects
            internships submitted from now on. Everything already submitted —
            pending, changes requested, verified or rejected — stays with{" "}
            {classDetail.advisor.fullName}.
          </p>
          <p>
            That is deliberate: whoever is mid-review finishes what they started,
            and keeps a permanent record of the internships they handled, instead
            of it landing half-read in somebody else&apos;s queue.
          </p>
        </div>
      </section>

      {/* STUDENTS */}
      <section className={PANEL_FLUSH}>
        <div className={PANEL_HEADER}>
          <h2 className={SECTION_HEADING}>Enrolled students</h2>
          <span className={cn("font-mono text-xs", MUTED)}>{students.length}</span>
        </div>

        {students.length === 0 ? (
          <p className={EMPTY}>
            No students in this class yet. They join by choosing it when they
            register, or by being moved here below.
          </p>
        ) : (
          <ul className="divide-y divide-[#16241c]">
            {students.map((student) => (
              <li
                key={student.id}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 sm:px-6",
                  MOTION,
                  "hover:bg-[#121e17]",
                )}
              >
                <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                  <span className={cn("text-sm font-semibold", INK)}>{student.fullName}</span>
                  <span className={CHIP_MONO}>{student.registerNumber}</span>
                </div>

                {/*
                  A move, not a removal. Every student is in exactly one class,
                  so leaving this one means joining another.
                */}
                <ActionForm
                  action={moveStudentAction}
                  className="flex items-center gap-2"
                  showMessage={false}
                >
                  <input type="hidden" name="classId" value={classDetail.id} />
                  <input type="hidden" name="studentId" value={student.id} />
                  <select
                    name="toClassId"
                    required
                    defaultValue=""
                    aria-label={`Move ${student.fullName} to another class`}
                    className={cn(CONTROL_SM_SELECT, "max-w-[16rem]")}
                    disabled={otherClasses.length === 0}
                  >
                    <option value="" disabled>
                      {otherClasses.length === 0 ? "— No other class —" : "— Move to —"}
                    </option>
                    {otherClasses.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.departmentName} · {cls.batchName} · {cls.name}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className={BTN_SECONDARY_SM}>
                    Move
                  </button>
                </ActionForm>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-2.5 border-t border-[#1b2a21] bg-[#080e0b] p-5 sm:p-6">
          <h3 className={SECTION_TITLE}>Add a student to this class</h3>

          {movable.length === 0 ? (
            <p className={cn("text-xs", FAINT)}>
              Every active student is already in this class.
            </p>
          ) : (
            <ActionForm action={addStudentAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="classId" value={classDetail.id} />
              <select
                name="studentId"
                required
                defaultValue=""
                className={cn(CONTROL_SM_SELECT, "max-w-md flex-1")}
              >
                <option value="" disabled>
                  — Choose a student —
                </option>
                {movable.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.fullName} · {student.registerNumber} (now in{" "}
                    {student.currentClassName})
                  </option>
                ))}
              </select>
              <button type="submit" className={BTN_SECONDARY_SM}>
                Add to class
              </button>
            </ActionForm>
          )}

          <p className={cn("text-xs", FAINT)}>
            Moving a student re-routes only what they submit next. Their existing
            internships stay with the advisor who received them.
          </p>
        </div>
      </section>
    </StaffContent>
  );
}
