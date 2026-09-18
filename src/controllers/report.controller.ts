import "server-only";

import { requireRole } from "@/lib/auth/dal";
import { ForbiddenError, InvalidStateError, NotFoundError } from "@/lib/auth/errors";
import { checkRateLimit } from "@/lib/rate-limit";
import { parseIdOrNotFound } from "@/lib/validators/parse";
import * as InternshipModel from "@/models/internship.model";
import * as ReportModel from "@/models/report.model";
import * as AiService from "@/services/ai.service";
import type { InternshipReportView } from "@/types/contracts";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Owner: package D (AI internship report).
 *
 * Fully wired and working today — it persists a placeholder until
 * `ai.service.ts` is filled in. Package D changes the service, not this file,
 * unless it is adding a genuinely new operation.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** The current report, or null if the student has not generated one yet. */
export async function getMyReport(internshipId: string): Promise<InternshipReportView | null> {
  const user = await requireRole("student");
  parseIdOrNotFound(internshipId);

  const row = await InternshipModel.findById(internshipId);

  // Somebody else's internship reads exactly like one that does not exist.
  if (!row || row.studentId !== user.id) throw new NotFoundError();

  const report = await ReportModel.findLatestByInternship(internshipId);
  if (!report) return null;

  return {
    content: report.content,
    model: report.model,
    generatedAt: report.createdAt.toISOString(),
  };
}

/**
 * Generates a fresh report and stores it.
 *
 * The four steps, in the house order: authorise, load, validate the transition,
 * act.
 */
export async function generateMyReport(internshipId: string): Promise<InternshipReportView> {
  // 1. AUTHORISE
  const user = await requireRole("student");
  parseIdOrNotFound(internshipId);

  // 2. LOAD — before validating, because the row is what decides both
  //    ownership and whether this is even allowed.
  const row = await InternshipModel.findById(internshipId);
  if (!row || row.studentId !== user.id) throw new NotFoundError();

  // 3. VALIDATE the transition.
  //
  //    Verified only. A report generated from a draft looks exactly as
  //    official as one generated from a record an advisor actually checked,
  //    and the entire premise of InternLens is that those are different
  //    things.
  if (row.status !== "verified") {
    throw new InvalidStateError(
      "A report can only be generated once your advisor has verified this internship.",
    );
  }

  // This is the one endpoint in the app that costs money per request, so it is
  // limited per user rather than per IP — a shared campus NAT would otherwise
  // put the whole college in one bucket.
  const gate = await checkRateLimit({ key: `report:user:${user.id}`, limit: 5, windowSeconds: 3600 });
  if (!gate.ok) {
    throw new ForbiddenError(
      `You have generated several reports recently. Try again in ${Math.ceil(gate.retryAfterSeconds / 60)} minutes.`,
    );
  }

  // 4. ACT
  const detail = await InternshipModel.getDetail(internshipId);
  const generated = await AiService.generateInternshipReport(detail);

  const saved = await ReportModel.create({
    internshipId,
    content: generated.content,
    model: generated.model,
    promptVersion: generated.promptVersion,
    generatedBy: user.id,
  });

  return {
    content: saved.content,
    model: saved.model,
    generatedAt: saved.createdAt.toISOString(),
  };
}
