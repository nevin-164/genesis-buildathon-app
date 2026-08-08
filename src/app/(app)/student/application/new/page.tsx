import { redirect } from "next/navigation";

import { findOpenApplicationDraft } from "@/components/application/application-workflow";
import {
  createApplicationDraft,
  listMyApplications,
} from "@/controllers/application.controller";
import { requireStudentPage } from "@/lib/auth/dal";

export default async function NewApplicationPage() {
  await requireStudentPage();

  const applications = await listMyApplications();
  const openDraft = findOpenApplicationDraft(applications);
  if (openDraft) {
    redirect(`/student/application/${openDraft.id}/edit`);
  }

  const { id } = await createApplicationDraft();
  redirect(`/student/application/${id}/edit`);
}
