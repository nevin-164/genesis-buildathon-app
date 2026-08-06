import "server-only";

import { requireRole } from "@/lib/auth/dal";
import * as InternshipModel from "@/models/internship.model";
import * as AssignmentService from "@/services/assignment.service";
import * as VerificationEvent from "@/models/verification-event.model";
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
  const row = await InternshipModel.findById(id);

  if (!row || row.studentId !== user.id) {
    throw new Error("Not Found");
  }

  return InternshipModel.getDetail(id);
}

export async function createInternshipDraft(): Promise<{ id: string }> {
  const user = await requireRole("student");
  return InternshipModel.createDraft(user.id);
}

export async function saveInternshipDraft(id: string, input: unknown): Promise<void> {
  const user = await requireRole("student");
  const row = await InternshipModel.findById(id);

  if (!row || row.studentId !== user.id) {
    throw new Error("Not Found");
  }
  if (!isEditable(row.status)) {
    throw new Error("Internship is locked and cannot be edited.");
  }

  const data = parseOrThrow(draftSchema, input);
  await InternshipModel.updateDraft(id, data);
}

export async function submitInternship(id: string, input: unknown): Promise<void> {
  const user = await requireRole("student");
  const row = await InternshipModel.findById(id);

  if (!row || row.studentId !== user.id) {
    throw new Error("Not Found");
  }
  if (!isEditable(row.status)) {
    throw new Error("Internship is locked and cannot be submitted.");
  }

  const data = parseOrThrow(submitSchema, input);
  const durationWeeks = computeDurationWeeks(data.startDate, data.endDate);

  // If a faculty is already assigned (e.g. they submitted, got changes_requested, and resubmitted),
  // we keep the existing assignment. Otherwise, resolve via assignment service.
  let assignedFacultyId = row.assignedFacultyId;
  let assignmentSource = row.assignmentSource;

  if (!assignedFacultyId) {
    const resolution = await AssignmentService.resolveAdvisor(user.id);
    assignedFacultyId = resolution.facultyId;
    assignmentSource = resolution.source;
  }

  await InternshipModel.submit(
    id,
    data,
    { assignedFacultyId, assignmentSource },
    durationWeeks
  );
}

export async function respondToVerification(id: string, input: unknown): Promise<void> {
  const user = await requireRole("student");
  const row = await InternshipModel.findById(id);

  if (!row || row.studentId !== user.id) {
    throw new Error("Not Found");
  }
  if (row.status !== "changes_requested") {
    throw new Error("Cannot respond unless changes were requested.");
  }

  const { reason } = parseOrThrow(respondSchema, input);

  await VerificationEvent.create({
    internshipId: id,
    actorId: user.id,
    action: "respond",
    reason,
  });

  const updated = await InternshipModel.setStatus(id, "submitted", "changes_requested");
  if (!updated) {
    throw new Error("Failed to update status. Please try again.");
  }
}
