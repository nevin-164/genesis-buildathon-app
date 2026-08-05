import Link from "next/link";

import { Card } from "@/components/ui";
import { getAdminCounts } from "@/controllers/admin/user.controller";
import { requireAdminPage } from "@/lib/auth/dal";

function Tile({
  value,
  label,
  href,
  strong,
}: {
  value: number;
  label: string;
  href: string;
  strong?: boolean;
}) {
  return (
    <Link href={href} className="block">
      <Card className={strong ? "border-zinc-400 hover:bg-zinc-50" : "hover:bg-zinc-50"}>
        <p className={strong ? "text-3xl font-semibold" : "text-2xl font-semibold"}>{value}</p>
        <p className="mt-1 text-sm text-zinc-600">{label}</p>
      </Card>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  await requireAdminPage();
  const counts = await getAdminCounts();
  const allClear = counts.unassignedInternships === 0 && counts.classesWithoutAdvisor === 0;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Administration</h1>

      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Needs attention
        </h2>
        {allClear ? (
          <p className="text-sm text-zinc-500">Nothing needs attention.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Tile
              strong
              value={counts.unassignedInternships}
              label="Internships with no faculty advisor"
              href="/admin/assignments"
            />
            <Tile
              strong
              value={counts.classesWithoutAdvisor}
              label="Classes with no advisor"
              href="/admin/classes"
            />
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile value={counts.totalStudents} label="Students" href="/admin/users?role=student" />
          <Tile value={counts.totalFaculty} label="Faculty" href="/admin/users?role=faculty" />
          <Tile
            value={counts.pendingVerifications}
            label="Awaiting verification"
            href="/admin/assignments"
          />
          <Tile
            value={counts.publishedInternships}
            label="Published internships"
            href="/student/explore"
          />
        </div>
      </section>
    </div>
  );
}
