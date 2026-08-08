import { notFound } from "next/navigation";

import { getPublishedExperience } from "@/controllers/explore.controller";
import { requireStudentPage } from "@/lib/auth/dal";
import { NotFoundError } from "@/lib/auth/errors";

import { RealityCardView } from "@/components/explore/RealityCardView";
import { StudentPageShell } from "@/components/layout/student-page-shell";

function firstValue(raw: string | string[] | undefined): string {
  if (Array.isArray(raw)) return raw[0] ?? "";
  return raw ?? "";
}

export default async function PublishedExperiencePage(
  props: PageProps<"/student/explore/[id]">,
) {
  await requireStudentPage();

  const { id } = await props.params;
  const rawParams = await props.searchParams;
  const returnTo = firstValue(rawParams.returnTo);
  const backHref = returnTo ? `/student/explore?${returnTo}` : "/student/explore";
  const compareHref = `/student/explore/compare?id1=${id}${
    returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""
  }`;

  let card;
  try {
    card = await getPublishedExperience(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <StudentPageShell stack={false}>
      <RealityCardView card={card} backHref={backHref} compareHref={compareHref} />
    </StudentPageShell>
  );
}
