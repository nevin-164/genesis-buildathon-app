import { notFound } from "next/navigation";

import { ExperienceDetailView } from "@/components/experience/ExperienceDetailView";
import { StudentPageShell } from "@/components/layout/student-page-shell";
import { getMyExperience } from "@/controllers/experience.controller";
import { requireStudentPage } from "@/lib/auth/dal";
import { NotFoundError } from "@/lib/auth/errors";

export default async function ExperienceDetailPage(
  props: PageProps<"/student/experience/[id]">,
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

  return (
    <StudentPageShell stack={false}>
      <ExperienceDetailView experience={experience} />
    </StudentPageShell>
  );
}
