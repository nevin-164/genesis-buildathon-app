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
} from "@/components/explore/explore-ui";
import { DocumentsPanel } from "@/components/internship/DocumentsPanel";
import { InternshipForm } from "@/components/internship/InternshipForm";
import { toFormValues } from "@/components/internship/internship-form-values";
import { latestFacultyChangeRequest } from "@/components/internship/Timeline";
import { StudentPageShell } from "@/components/layout/student-page-shell";
import { getMyInternship } from "@/controllers/internship.controller";
import { requireStudentPage } from "@/lib/auth/dal";
import { NotFoundError } from "@/lib/auth/errors";
import { cn } from "@/lib/cn";

import { updateInternshipAction } from "../../actions";

/**
 * Editing an internship, and the only screen that can attach documents.
 *
 * Editing is allowed in exactly two states — `draft` and `changes_requested` —
 * and that list is data, not an `if` here: `canEdit` comes off the row from
 * the backend. Anything else redirects to the read-only detail page rather
 * than rendering a form whose every action the controller would refuse.
 */
export default async function EditInternshipPage(
  props: PageProps<"/student/internships/[id]/edit">,
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

  if (!internship.canEdit) redirect(`/student/internships/${id}`);

  const isResubmit = internship.status === "changes_requested";
  const changeRequest = isResubmit
    ? latestFacultyChangeRequest(internship.timeline, internship.latestReason)
    : null;

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
            {isResubmit ? "Changes requested" : "Draft"}
          </p>
          <h1 className={cn(DISPLAY_HERO, "mt-1")}>
            {isResubmit ? "Update your internship" : "Finish your internship"}
          </h1>
          <p className={cn("mt-1 max-w-2xl text-[15px] leading-snug", MUTED)}>
            {isResubmit
              ? "Make the changes your advisor asked for, then send it back for verification."
              : "Nothing here is visible to anyone until you submit it and your advisor verifies it."}
          </p>
        </div>
      </header>

      {changeRequest && (
        <section
          className={cn(PANEL, "border-amber-200/90 bg-amber-50/60 p-4 sm:p-5")}
          aria-labelledby="change-request-heading"
        >
          <h2 id="change-request-heading" className="text-sm font-semibold text-amber-900">
            What your advisor asked for
          </h2>
          <p className="mt-2 text-sm leading-relaxed break-words text-[#3d4a42]">
            {changeRequest}
          </p>
        </section>
      )}

      <InternshipForm
        action={updateInternshipAction}
        internshipId={internship.id}
        initialValues={toFormValues(internship)}
        submitLabel={isResubmit ? "Send back for verification" : "Submit for verification"}
        saveLabel="Save draft"
      >
        <DocumentsPanel
          internshipId={internship.id}
          documents={internship.documents}
          editable={internship.canEdit}
        />
      </InternshipForm>
    </StudentPageShell>
  );
}
