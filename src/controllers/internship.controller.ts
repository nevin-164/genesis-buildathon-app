import "server-only";

import { requireRole } from "@/lib/auth/dal";
import { InvalidStateError, NotFoundError } from "@/lib/auth/errors";
import { parseIdOrNotFound } from "@/lib/validators/parse";
import * as InternshipModel from "@/models/internship.model";
import * as AssignmentService from "@/services/assignment.service";
import { parseOrThrow } from "@/lib/validators/parse";
import {
  computeDurationWeeks,
  draftSchema,
  isEditable,
  respondSchema,
  submitSchema,
} from "@/lib/validators/internship.schema";

import type {
  InternshipDetail,
  InternshipListItem,
  StudentDashboard,
} from "@/types/contracts";

export async function getStudentDashboard(): Promise<StudentDashboard> {
  const user = await requireRole("student");
  const internship = await InternshipModel.findLatestByStudent(user.id);

  let nextAction: StudentDashboard["nextAction"] = "add_internship";
  if (internship) {
    switch (internship.status) {
      case "draft":
        nextAction = "add_internship";
        break;
      case "submitted":
        nextAction = "await_verification";
        break;
      case "changes_requested":
        nextAction = "fix_internship";
        break;
      case "verified":
        nextAction = "published";
        break;
      case "rejected":
        nextAction = "rejected";
        break;
      case "appealed":
        nextAction = "appeal_under_review";
        break;
    }
  }

  return { internship, nextAction };
}

export async function listMyInternships(): Promise<InternshipListItem[]> {
  const user = await requireRole("student");
  return InternshipModel.listByStudent(user.id);
}

export async function getMyInternship(id: string): Promise<InternshipDetail> {
  const user = await requireRole("student");
  parseIdOrNotFound(id);

  const row = await InternshipModel.findById(id);

  // Somebody else's internship reads exactly like one that does not exist. A
  // 403 here would confirm the row is real, which is what id-probing is for.
  if (!row || row.studentId !== user.id) {
    throw new NotFoundError();
  }

  return InternshipModel.getDetail(id);
}

export async function createInternshipDraft(): Promise<{ id: string }> {
  const user = await requireRole("student");
  return InternshipModel.createDraft(user.id);
}

export async function saveInternshipDraft(id: string, input: unknown): Promise<void> {
  const user = await requireRole("student");
  parseIdOrNotFound(id);

  const row = await InternshipModel.findById(id);

  if (!row || row.studentId !== user.id) {
    throw new NotFoundError();
  }
  if (!isEditable(row.status)) {
    throw new InvalidStateError(
      "This internship is with your advisor, so it can no longer be edited.",
    );
  }

  const data = parseOrThrow(draftSchema, input);

  /*
   * Keep the denormalised week count in step with the dates on every save, not
   * only on submit. Explore sorts and filters on that column, and a draft that
   * carried the `createDraft` zero until the moment it was submitted showed
   * "0 weeks" on its own detail page in the meantime.
   *
   * Computed here and never taken from the form: it is the one number a client
   * could use to claim a two-day internship ran for six months.
   */
  const durationWeeks =
    data.startDate && data.endDate && data.endDate >= data.startDate
      ? computeDurationWeeks(data.startDate, data.endDate)
      : undefined;

  // The status goes in the WHERE clause too. Between the check above and this
  // write the advisor may have acted, and a save that quietly overwrote a
  // submitted row would edit work already under review.
  const saved = await InternshipModel.updateDraft(id, data, row.status, durationWeeks);
  if (!saved) throw new InvalidStateError();
}

export async function submitInternship(id: string, input: unknown): Promise<void> {
  const user = await requireRole("student");
  parseIdOrNotFound(id);

  const row = await InternshipModel.findById(id);

  if (!row || row.studentId !== user.id) {
    throw new NotFoundError();
  }
  if (!isEditable(row.status)) {
    throw new InvalidStateError(
      "This internship has already been submitted for verification.",
    );
  }

  const data = parseOrThrow(submitSchema, input);
  const durationWeeks = computeDurationWeeks(data.startDate, data.endDate);

  /*
   * Resolve the advisor once, then freeze it.
   *
   * An already-assigned row keeps its advisor — this is the resubmit after
   * changes_requested, and re-resolving would hand a half-reviewed internship
   * to somebody else mid-thread. It is also what makes a class handover
   * behave: the new advisor takes new submissions, the old one keeps
   * everything already sent to them, in every state.
   *
   * The resolver throws rather than returning null. Every student has a class
   * and every class an advisor, so failing to resolve means the row is broken;
   * writing an unassigned submission instead of saying so is what used to
   * create work for an admin repair queue.
   */
  const assignment = row.assignedFacultyId
    ? // Keep the pair exactly as it was stored. `assignment_source` explains why
      // that faculty member is on the row, and re-deriving it would relabel a
      // historical `direct` or `manual` as `class`.
      { assignedFacultyId: row.assignedFacultyId, assignmentSource: row.assignmentSource }
    : await AssignmentService.resolveAdvisor(user.id).then((resolved) => ({
        assignedFacultyId: resolved.facultyId,
        assignmentSource: resolved.source,
      }));

  // Locked on the status we read above, so a double-clicked submit button
  // moves the row once and the second click gets a 409 instead of resetting
  // `submitted_at` on an internship the advisor is already reading.
  const submitted = await InternshipModel.submit(
    id,
    data,
    assignment,
    durationWeeks,
    row.status,
  );
  if (!submitted) throw new InvalidStateError();
}

export async function respondToVerification(id: string, input: unknown): Promise<void> {
  const user = await requireRole("student");
  parseIdOrNotFound(id);

  const row = await InternshipModel.findById(id);

  if (!row || row.studentId !== user.id) {
    throw new NotFoundError();
  }
  if (row.status !== "changes_requested") {
    throw new InvalidStateError("Your advisor has not asked for any changes.");
  }

  const { reason } = parseOrThrow(respondSchema, input);

  // The event and the status change go together or not at all — see the note
  // on `Internships.respond`.
  const responded = await InternshipModel.respond(id, user.id, reason);
  if (!responded) throw new InvalidStateError();
}
