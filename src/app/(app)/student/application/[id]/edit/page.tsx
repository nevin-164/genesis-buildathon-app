import { notFound, redirect } from "next/navigation";

import { ApplicationForm } from "@/components/application/ApplicationForm";
import { StudentPageShell } from "@/components/layout/student-page-shell";
import { getMyApplication } from "@/controllers/application.controller";
import { requireStudentPage } from "@/lib/auth/dal";
import { NotFoundError } from "@/lib/auth/errors";

export default async function EditApplicationPage(
  props: PageProps<"/student/application/[id]/edit">,
) {
  await requireStudentPage();

  const { id } = await props.params;

  let application;
  try {
    application = await getMyApplication(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  if (!application.canEdit) {
    redirect(`/student/application/${id}`);
  }

  return (
    <StudentPageShell stack={false}>
      <ApplicationForm application={application} />
    </StudentPageShell>
  );
}
