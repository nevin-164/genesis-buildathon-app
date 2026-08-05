import Link from "next/link";

import { Badge, Card } from "@/components/ui";
import { getStudentDashboard } from "@/controllers/internship.controller";
import { requireStudentPage } from "@/lib/auth/dal";
import { INTERNSHIP_STATUS_LABEL, INTERNSHIP_STATUS_TONE } from "@/lib/constants/options";
import type { StudentDashboard } from "@/types/contracts";

const NEXT_STEP: Record<StudentDashboard["nextAction"], { text: string; href: string; cta: string }> =
  {
    add_internship: {
      text: "Finished an internship? Write up what actually happened.",
      href: "/student/internships/new",
      cta: "Add an internship",
    },
    await_verification: {
      text: "Your internship is with your faculty advisor.",
      href: "/student/internships",
      cta: "View internship",
    },
    fix_internship: {
      text: "Your advisor asked for some changes.",
      href: "/student/internships",
      cta: "Edit internship",
    },
    published: {
      text: "Your internship is published. Thank you for contributing.",
      href: "/student/explore",
      cta: "View on Explore",
    },
    rejected: {
      text: "Your internship was not published.",
      href: "/student/internships",
      cta: "View reason",
    },
  };

export default async function StudentDashboardPage() {
  const user = await requireStudentPage();
  const dashboard = await getStudentDashboard();
  const step = NEXT_STEP[dashboard.nextAction];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Welcome back, {user.fullName.split(" ")[0]}</h1>

      <Card className="bg-zinc-50">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Next step</p>
        <p className="mt-1 text-sm text-zinc-800">{step.text}</p>
        <Link
          href={step.href}
          className="mt-3 inline-block text-sm font-medium text-zinc-900 underline"
        >
          {step.cta} →
        </Link>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold">My internship</h2>
          {dashboard.internship ? (
            <div className="mt-3 space-y-1.5">
              <p className="text-sm font-medium">{dashboard.internship.companyName}</p>
              <p className="text-sm text-zinc-600">{dashboard.internship.roleTitle}</p>
              <Badge tone={INTERNSHIP_STATUS_TONE[dashboard.internship.status]}>
                {INTERNSHIP_STATUS_LABEL[dashboard.internship.status]}
              </Badge>
            </div>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">
              You have not added an internship yet.
            </p>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold">Explore</h2>
          <p className="mt-3 text-sm text-zinc-500">
            Read what earlier batches actually experienced before you pick yours.
          </p>
          <Link
            href="/student/explore"
            className="mt-3 inline-block text-sm font-medium text-zinc-900 underline"
          >
            Browse internships →
          </Link>
        </Card>
      </div>
    </div>
  );
}
