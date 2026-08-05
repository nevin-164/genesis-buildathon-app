import { notFound } from "next/navigation";

import { getPublishedExperience } from "@/controllers/explore.controller";
import { requireStudentPage } from "@/lib/auth/dal";
import { NotFoundError } from "@/lib/auth/errors";
import { cn } from "@/lib/cn";

import { RealityCardView } from "@/components/explore/RealityCardView";
import { exploreDisplay, exploreFont } from "@/components/explore/explore-font";
import { EXPLORE_ROOT } from "@/components/explore/explore-ui";

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
    <div className={cn(exploreFont.className, exploreDisplay.variable, EXPLORE_ROOT)}>
      <RealityCardView card={card} />
    </div>
  );
}
