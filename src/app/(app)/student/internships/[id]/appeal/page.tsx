import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ChevronRightIcon } from "@/components/explore/explore-icons";
import {
  DISPLAY_HERO,
  FOCUS_RING,
  INK,
  MOTION,
  MUTED,
  PANEL,
  SECTION_HEADING,
} from "@/components/explore/explore-ui";
import { AppealForm } from "@/components/internship/AppealForm";
import { DocumentsPanel } from "@/components/internship/DocumentsPanel";
import { StudentPageShell } from "@/components/layout/student-page-shell";
import { getMyInternship } from "@/controllers/internship.controller";
import { requireStudentPage } from "@/lib/auth/dal";
import { NotFoundError } from "@/lib/auth/errors";
import { cn } from "@/lib/cn";

/**
 * Appealing a rejection — the one screen a rejected internship still has.
 *
 * Three blocks, in the order the work happens: what the advisor said, what you
 * are attaching to answer it, and the argument that ties the two together.
 *
 * Notice what is NOT here: the internship form. A rejected write-up cannot be
 * edited, so an appeal is "here is more proof of what I already told you",
 * never "here is a different story". `canAppeal` comes off the row from the
 * backend and anything else redirects — this page never renders a form whose
 * every action the controller would refuse.
 */
export default async function AppealInternshipPage(
  props: PageProps<"/student/internships/[id]/appeal">,
) {
  await requireStudentPage();

  const { id } = await props.params;

  let internship;
  try {
    internship = await getMyInternship(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  // Already appealed, never rejected, or the one appeal is spent. The detail
  // page explains whichever of those it is; this one has nothing to offer.
  if (!internship.canAppeal) redirect(`/student/internships/${id}`);

  const rejectionReason = internship.latestReason?.trim() || null;

  return (
    <StudentPageShell>
      <Link
        href={`/student/internships/${id}`}
        className={cn(
          "inline-flex items-center gap-1 text-sm font-medium",
          INK,
          "hover:text-[#2d5038] hover:underline",
          MOTION,
          FOCUS_RING,
        )}
      >
        <ChevronRightIcon className="rotate-180" aria-hidden="true" />
        Back to this internship
      </Link>

      <header
        className={cn(PANEL, "relative overflow-hidden bg-[#f4f8f5] px-4 py-4 sm:px-5 sm:py-5")}
      >
        <div
          className="pointer-events-none absolute top-4 bottom-4 left-0 w-1 rounded-full bg-[#c8ef5a]"
          aria-hidden="true"
        />
        <div className="pl-3">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-[#8a968d] uppercase">
            Appeal
          </p>
          <h1 className={cn(DISPLAY_HERO, "mt-1")}>Ask an administrator to look again</h1>
          <p className={cn("mt-1 max-w-2xl text-[15px] leading-snug", MUTED)}>
            {internship.companyName.trim() || "This internship"} &middot;{" "}
            {internship.roleTitle}. An administrator — not{" "}
            {internship.facultyName ?? "your advisor"} — will read your appeal and
            decide.
          </p>
        </div>
      </header>

      {/* 1 · What you are answering. */}
      <section
        className={cn(PANEL, "border-red-200/80 bg-red-50/40 p-4 sm:p-5")}
        aria-labelledby="rejection-reason-heading"
      >
        <h2 id="rejection-reason-heading" className={SECTION_HEADING}>
          Why it was not accepted
        </h2>
        {rejectionReason ? (
          <>
            <p className="mt-2 text-sm leading-relaxed break-words text-[#3d4a42]">
              {rejectionReason}
            </p>
            {internship.facultyName && (
              <p className={cn("mt-2 text-xs", MUTED)}>— {internship.facultyName}</p>
            )}
          </>
        ) : (
          <p className={cn("mt-2 text-sm leading-relaxed", MUTED)}>
            No reason was recorded. Say what you think happened and attach whatever
            supports it.
          </p>
        )}
      </section>

      {/* 2 · The proof. Attachable because the status is `rejected` — see
             `canAttachDocuments` in lib/validators/internship.schema.ts. */}
      <section className="space-y-2">
        <p className={cn("text-sm leading-relaxed", MUTED)}>
          Attach anything that answers the reason above. Each file uploads on its
          own, so you can add them one at a time and file the appeal when you are
          ready.
        </p>
        <DocumentsPanel
          internshipId={internship.id}
          documents={internship.documents}
          editable
        />
      </section>

      {/* 3 · The argument. */}
      <AppealForm internshipId={internship.id} documentCount={internship.documents.length} />
    </StudentPageShell>
  );
}
