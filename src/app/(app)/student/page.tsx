import Link from "next/link";

import { Badge, Card } from "@/components/ui";
import { getStudentDashboard } from "@/controllers/application.controller";
import { requireStudentPage } from "@/lib/auth/dal";
import { APPLICATION_STATUS_LABEL, APPLICATION_STATUS_TONE } from "@/lib/constants/options";
import type { StudentDashboard } from "@/types/contracts";

const NEXT_STEP: Record<StudentDashboard["nextAction"], { text: string; href: string; cta: string }> =
  {
    submit_application: {
      text: "Found an internship? Get it approved before you start.",
      href: "/student/application/new",
      cta: "Start an application",
    },
    await_approval: {
      text: "Your application is with your faculty advisor.",
      href: "/student/application",
      cta: "View application",
    },
    respond_clarification: {
      text: "Your advisor asked a question about your application.",
      href: "/student/application",
      cta: "View and reply",
    },
    contribute_experience: {
      text: "Internship approved. Share how it actually went.",
      href: "/student/experience",
      cta: "Contribute experience",
    },
    await_verification: {
      text: "Your experience is waiting to be verified.",
      href: "/student/experience",
      cta: "View experience",
    },
    fix_experience: {
      text: "Your advisor asked for some changes.",
      href: "/student/experience",
      cta: "Edit experience",
    },
    published: {
      text: "Your experience is published. Thank you for contributing.",
      href: "/student/explore",
      cta: "View on Explore",
    },
    rejected: {
      text: "Your application was not approved.",
      href: "/student/application",
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
          <h2 className="text-sm font-semibold">My application</h2>
          {dashboard.application ? (
            <div className="mt-3 space-y-1.5">
              <p className="text-sm font-medium">{dashboard.application.companyName}</p>
              <p className="text-sm text-zinc-600">{dashboard.application.roleTitle}</p>
              <Badge tone={APPLICATION_STATUS_TONE[dashboard.application.status]}>
                {APPLICATION_STATUS_LABEL[dashboard.application.status]}
              </Badge>
            </div>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">You have not applied yet.</p>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold">My experience</h2>
          {dashboard.experience ? (
            <div className="mt-3 space-y-1.5">
              <p className="text-sm font-medium">{dashboard.experience.companyName}</p>
              <p className="text-sm text-zinc-600">{dashboard.experience.roleTitle}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">
              Available once one of your internships is approved.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
