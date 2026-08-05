import Link from "next/link";

import { Card } from "@/components/ui";
import { getFacultyCounts } from "@/controllers/faculty.controller";
import { requireFacultyPage } from "@/lib/auth/dal";

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

export default async function FacultyDashboardPage() {
  const user = await requireFacultyPage();
  const counts = await getFacultyCounts();
  const nothingWaiting = counts.pendingVerifications === 0 && counts.changesRequested === 0;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Welcome, {user.fullName}</h1>

      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Needs your attention
        </h2>
        {nothingWaiting ? (
          <p className="text-sm text-zinc-500">Nothing waiting. You are all caught up.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Tile
              strong
              value={counts.pendingVerifications}
              label="Internships waiting for verification"
              href="/faculty/verifications"
            />
            <Tile
              strong
              value={counts.changesRequested}
              label="Waiting on the student"
              href="/faculty/students?filter=changes_requested"
            />
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Your students</h2>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <Tile value={counts.assignedStudents} label="Assigned" href="/faculty/students" />
          <Tile
            value={counts.notSubmitted}
            label="Not submitted"
            href="/faculty/students?filter=not_submitted"
          />
          <Tile value={counts.verified} label="Published" href="/faculty/students?filter=verified" />
          <Tile value={counts.rejected} label="Rejected" href="/faculty/students?filter=rejected" />
        </div>
      </section>
    </div>
  );
}
