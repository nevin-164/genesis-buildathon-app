import Link from "next/link";

import { StaffContent, StaffPageHeader } from "@/components/staff/StaffShell";
import { StatTile } from "@/components/staff/StatTile";
import {
  FAINT,
  MUTED,
  PANEL_PADDED,
  SECTION_HEADING,
  SECTION_TITLE,
  type Tone,
} from "@/components/staff/staff-ui";
import { getAdminCounts } from "@/controllers/admin/user.controller";
import { requireAdminPage } from "@/lib/auth/dal";
import { cn } from "@/lib/cn";

type Stat = {
  label: string;
  value: number;
  hint: string;
  href: string;
  tone?: Tone;
};

/**
 * There are no amber "somebody is blocked" tiles here any more.
 *
 * The two that used to be — internships with no verifier, classes with no
 * advisor — counted states the database now refuses to store, so they would
 * read zero forever. Every class has an advisor and every student a class, so
 * a submission always resolves a reviewer.
 */
export default async function AdminDashboardPage() {
  await requireAdminPage();

  const counts = await getAdminCounts();

  const people: Stat[] = [
    {
      label: "Students",
      value: counts.totalStudents,
      hint: "Active student accounts",
      href: "/admin/users?role=student",
    },
    {
      label: "Faculty",
      value: counts.totalFaculty,
      hint: "Accounts that can verify",
      href: "/admin/users?role=faculty",
    },
    {
      label: "Classes",
      value: counts.totalClasses,
      hint: "Each with a faculty advisor",
      href: "/admin/classes",
    },
  ];

  const work: Stat[] = [
    {
      label: "Pending verifications",
      value: counts.pendingVerifications,
      hint: "Waiting on a faculty decision",
      href: "/admin/users?role=faculty",
      // Lime is "waiting on staff" everywhere in the console.
      tone: counts.pendingVerifications > 0 ? "lime" : "neutral",
    },
    {
      label: "Published internships",
      value: counts.publishedInternships,
      hint: "Verified and visible on Explore",
      href: "/student/explore",
      tone: "mint",
    },
  ];

  const setUpOrder = [
    { href: "/admin/users?role=faculty", step: "1", label: "Faculty register themselves" },
    { href: "/admin/departments", step: "2", label: "Departments" },
    { href: "/admin/batches", step: "3", label: "Batches" },
    { href: "/admin/classes", step: "4", label: "Classes + advisors" },
    { href: "/admin/users?role=student", step: "5", label: "Students register" },
  ];

  return (
    <StaffContent>
      <StaffPageHeader
        eyebrow="Admin console"
        title="Dashboard"
        subtitle="Your organisation and the accounts in it."
      />

      <section className="space-y-3">
        <h2 className={SECTION_HEADING}>People and structure</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {people.map((stat) => (
            <StatTile
              key={stat.label}
              label={stat.label}
              value={stat.value}
              hint={stat.hint}
              href={stat.href}
              tone={stat.tone}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className={SECTION_HEADING}>Internships</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {work.map((stat) => (
            <StatTile
              key={stat.label}
              label={stat.label}
              value={stat.value}
              hint={stat.hint}
              href={stat.href}
              tone={stat.tone}
            />
          ))}
        </div>
      </section>

      <section className={PANEL_PADDED}>
        <h2 className={SECTION_TITLE}>Set-up order</h2>
        <p className={cn("mt-2 max-w-3xl text-sm leading-relaxed", MUTED)}>
          Faculty first — a class needs an advisor before it can be created.
          Then departments, batches and classes. Students register last.
        </p>

        <ol className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {setUpOrder.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg border border-[#1b2a21] bg-[#080e0b] px-3 py-2.5",
                  "transition-colors duration-150 hover:border-[#c8ef5a]/40 hover:bg-[#101a14]",
                  "motion-reduce:transition-none",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                    "bg-[#121e17] text-[11px] font-bold text-[#c8ef5a]",
                    "transition-colors duration-150 group-hover:bg-[#c8ef5a] group-hover:text-[#0b120e]",
                    "motion-reduce:transition-none",
                  )}
                >
                  {link.step}
                </span>
                <span className="min-w-0 text-xs font-semibold text-[#cfdcd3] group-hover:text-[#eaf2ec]">
                  {link.label}
                </span>
              </Link>
            </li>
          ))}
        </ol>

        <p className={cn("mt-4 text-xs", FAINT)}>
          There is no create-user screen, and no delete anywhere. Both are
          deliberate — see ADMIN-UI.md.
        </p>
      </section>
    </StaffContent>
  );
}
