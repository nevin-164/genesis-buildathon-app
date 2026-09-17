import Link from "next/link";

import { CountTile } from "@/components/faculty/CountTile";
import { StaffContent, StaffPageHeader } from "@/components/staff/StaffShell";
import {
  LINK_ACTION,
  MUTED,
  NOTICE_INFO,
  PANEL,
  SECTION_HEADING,
} from "@/components/staff/staff-ui";
import { getFacultyCounts } from "@/controllers/faculty.controller";
import { requireFacultyPage } from "@/lib/auth/dal";
import { cn } from "@/lib/cn";

/**
 * Two groups, and they are counted from two different places on purpose.
 *
 *   "Your students"      live, from the classes you advise today.
 *   "Your verifications" frozen, from `assigned_faculty_id` on the internship.
 *
 * After a class is handed to another advisor these disagree — the new advisor
 * gets the students, the outgoing one keeps the internships already submitted
 * to them. Both are correct. Showing them as one block is what made the old
 * dashboard read "0 students, 3 pending verifications" with nothing to explain
 * it, so they are captioned separately and the second says why.
 */
export default async function FacultyDashboard() {
  await requireFacultyPage();
  const counts = await getFacultyCounts();

  const carriesHistory =
    counts.assignedStudents === 0 &&
    counts.pendingVerifications +
      counts.changesRequested +
      counts.verified +
      counts.rejected >
      0;

  return (
    <StaffContent>
      <StaffPageHeader
        eyebrow="Faculty console"
        title="Dashboard"
        subtitle="Your students and the internships waiting on you."
      />

      {/* NEEDS YOUR ATTENTION */}
      <section className="space-y-3">
        <h2 className={SECTION_HEADING}>Needs your attention</h2>

        {counts.pendingVerifications === 0 ? (
          <p className={cn(NOTICE_INFO, "text-center")}>
            Nothing waiting. You&apos;re all caught up.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CountTile
              count={counts.pendingVerifications}
              label="Internships waiting for verification"
              href="/faculty/verifications"
              size="attention"
              variant="blue"
            />
          </div>
        )}
      </section>

      {/* YOUR STUDENTS — live, from the classes you advise now */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className={SECTION_HEADING}>Your students</h2>
          <Link href="/faculty/students" className={LINK_ACTION}>
            View all students <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <CountTile
            count={counts.assignedStudents}
            label="Advised"
            sublabel="Students in your classes"
            href="/faculty/students"
            variant="neutral"
          />
          <CountTile
            count={counts.notSubmitted}
            label="Not submitted"
            sublabel="Nothing added yet"
            href="/faculty/students?filter=not_submitted"
            variant="gray"
          />
        </div>
      </section>

      {/* YOUR VERIFICATIONS — frozen, from the internship rows assigned to you */}
      <section className="space-y-3">
        <h2 className={SECTION_HEADING}>Your verifications</h2>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <CountTile
            count={counts.pendingVerifications}
            label="Pending"
            sublabel="Awaiting your decision"
            href="/faculty/verifications"
            variant="blue"
          />
          <CountTile
            count={counts.changesRequested}
            label="Changes requested"
            sublabel="Awaiting student"
            href="/faculty/students?filter=changes_requested"
            variant="amber"
          />
          <CountTile
            count={counts.verified}
            label="Verified"
            sublabel="Published on Explore"
            href="/faculty/students?filter=verified"
            variant="green"
          />
          <CountTile
            count={counts.rejected}
            label="Rejected"
            sublabel="Terminal state"
            href="/faculty/students?filter=rejected"
            variant="red"
          />
        </div>

        {carriesHistory && (
          <p className={cn(PANEL, "px-4 py-3 text-xs leading-relaxed", MUTED)}>
            You do not advise any class at the moment, but these internships were
            submitted to you and remain yours to finish and to keep a record of.
          </p>
        )}
      </section>
    </StaffContent>
  );
}
