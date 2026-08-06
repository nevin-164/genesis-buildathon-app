import { notFound } from "next/navigation";

import { getPublishedExperience } from "@/controllers/explore.controller";
import { requireStudentPage } from "@/lib/auth/dal";
import { NotFoundError } from "@/lib/auth/errors";

import { RealityCardView } from "@/components/explore/RealityCardView";
import { StudentPageShell } from "@/components/layout/student-page-shell";

export default async function PublishedExperiencePage(
  props: PageProps<"/student/explore/[id]">,
) {
  await requireStudentPage();

  const { id } = await props.params;

  let card;
  try {
    card = await getPublishedExperience(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <StudentPageShell stack={false}>
      <RealityCardView card={card} />
    </StudentPageShell>
  );
}
