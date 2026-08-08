import { redirect } from "next/navigation";

import { createApplicationDraft } from "@/controllers/application.controller";
import { requireStudentPage } from "@/lib/auth/dal";

export default async function NewApplicationPage() {
  await requireStudentPage();

  const { id } = await createApplicationDraft();
  redirect(`/student/application/${id}/edit`);
}
