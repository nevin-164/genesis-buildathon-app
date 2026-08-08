import { notFound } from "next/navigation";

import { ApplicationDetailView } from "@/components/application/ApplicationDetailView";
import { StudentPageShell } from "@/components/layout/student-page-shell";
import { getMyApplication } from "@/controllers/application.controller";
import { requireStudentPage } from "@/lib/auth/dal";
import { NotFoundError } from "@/lib/auth/errors";

export default async function ApplicationDetailPage(
  props: PageProps<"/student/application/[id]">,
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

  return (
    <StudentPageShell stack={false}>
      <ApplicationDetailView application={application} />
    </StudentPageShell>
  );
}
