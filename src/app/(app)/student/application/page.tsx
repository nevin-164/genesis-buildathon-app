import Link from "next/link";



import { ApplicationCard } from "@/components/application/ApplicationCard";

import { findOpenApplicationDraft } from "@/components/application/application-workflow";

import { PlusIcon } from "@/components/explore/explore-icons";

import { StudentPageShell } from "@/components/layout/student-page-shell";

import {

  BTN_PRIMARY,

  BTN_SECONDARY,

  FOCUS_RING,

  MOTION,

} from "@/components/student/student-ui";

import {

  CanvasPageHeader,

  EmptyCanvas,

  InsetPanel,

} from "@/components/student/primitives";

import { listMyApplications } from "@/controllers/application.controller";

import { requireStudentPage } from "@/lib/auth/dal";

import { cn } from "@/lib/cn";



export default async function MyApplicationsPage() {

  await requireStudentPage();



  const applications = await listMyApplications();

  const singleApplication = applications.length === 1;

  const openDraft = findOpenApplicationDraft(applications);



  return (

    <StudentPageShell>

      <CanvasPageHeader

        eyebrow="My internships"

        title="Manage your applications"

        lead="Track faculty approval and see what needs your attention."

        action={

          <Link

            href={

              openDraft

                ? `/student/application/${openDraft.id}/edit`

                : "/student/application/new"

            }

            className={cn(

              BTN_PRIMARY,

              "inline-flex w-full items-center justify-center gap-1.5 sm:w-auto",

              MOTION,

              FOCUS_RING,

            )}

          >

            <PlusIcon />

            {openDraft ? "Continue application" : "New application"}

          </Link>

        }

        divider={false}

      />



      {openDraft && (

        <InsetPanel variant="attention" aria-labelledby="open-draft-heading">

          <p id="open-draft-heading" className="text-sm leading-relaxed text-[var(--il-moss)]">

            You already have an application in progress. Continue it before starting another one.

          </p>

          <Link

            href={`/student/application/${openDraft.id}/edit`}

            className={cn(BTN_SECONDARY, "mt-4 inline-flex px-5", MOTION, FOCUS_RING)}

          >

            Continue application

          </Link>

        </InsetPanel>

      )}



      {applications.length === 0 ? (

        <EmptyCanvas

          title="No internship applications yet"

          description="Create an application when you are ready to request faculty approval for an internship."

          action={

            <Link

              href="/student/application/new"

              className={cn(BTN_SECONDARY, "px-5", MOTION, FOCUS_RING)}

            >

              Start an application

            </Link>

          }

        />

      ) : singleApplication ? (

        <div className="min-w-0">

          <ApplicationCard application={applications[0]} />

        </div>

      ) : (

        <ul

          className="grid w-full min-w-0 gap-4 md:grid-cols-2"

          aria-label="Your internship applications"

        >

          {applications.map((application) => (

            <li key={application.id} className="min-w-0">

              <ApplicationCard application={application} />

            </li>

          ))}

        </ul>

      )}

    </StudentPageShell>

  );

}
