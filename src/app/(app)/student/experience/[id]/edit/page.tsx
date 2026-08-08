import { notFound, redirect } from "next/navigation";

import { ExperienceForm } from "@/components/experience/ExperienceForm";
import { StudentPageShell } from "@/components/layout/student-page-shell";
import { getMyExperience } from "@/controllers/experience.controller";
import { requireStudentPage } from "@/lib/auth/dal";
import { NotFoundError } from "@/lib/auth/errors";

export default async function EditExperiencePage(
  props: PageProps<"/student/experience/[id]/edit">,
) {
  await requireStudentPage();

  const { id } = await props.params;

  let experience;
  try {
    experience = await getMyExperience(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  if (!experience.canEdit) {
    redirect(`/student/experience/${id}`);
  }

  return (
    <StudentPageShell stack={false}>
      <ExperienceForm experience={experience} />
    </StudentPageShell>
  );
}
