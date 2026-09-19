import "server-only";

import { requireRole } from "@/lib/auth/dal";
import { ForbiddenError, InvalidStateError, NotFoundError } from "@/lib/auth/errors";
import { appealDecisionSchema, appealSchema, MAX_APPEALS } from "@/lib/validators/appeal.schema";
import { parseIdOrNotFound, parseOrThrow } from "@/lib/validators/parse";
import { Appeals } from "@/models/appeal.model";
import { Verification } from "@/models/verification.model";
import type { AppealDetail, AppealQueueItem } from "@/types/contracts";

/**
 * Stage 3, and the only one that exists above the advisor: a student contests a
 * rejection, and an administrator rules on it.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHO HEARS AN APPEAL.
 *
 * `requireRole("admin")` on every reviewer function here, with no faculty
 * fallback — and that is the single most important line in this file. Everywhere
 * else in the app an admin is a faculty member with a wider scope
 * (`verification.controller` hands them the whole college so they can unblock a
 * queue). Appeals invert that: faculty are excluded, because the person being
 * appealed against cannot be the person who hears it. Widening this to
 * `("faculty", "admin")` to "help with the backlog" would let an advisor rule on
 * their own rejection.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Faculty are not shut out of the outcome: the ruling lands on the same
 * verification thread they have always read, so they see what was decided about
 * their decision, and why, on the student's history page.
 */

/* ── the student's side ──────────────────────────────────────────────────── */

/**
 * The student contests a rejection.
 *
 * Authorise → load → validate → act, in the house order. Loading comes before
 * validating because the row is what decides both whether the caller owns it
 * and whether the transition is legal.
 */
export async function appealRejection(internshipId: string, input: unknown): Promise<void> {
  // 1. AUTHORISE. A student, and only their own internship.
  const user = await requireRole("student");
  parseIdOrNotFound(internshipId);

  // 2. LOAD, then assert ownership. Somebody else's internship reads exactly
  //    like one that does not exist — a 403 would confirm the row is real,
  //    which is what id-probing is for.
  const row = await Appeals.findForReview(internshipId);
  if (!row || row.studentId !== user.id) throw new NotFoundError();

  // 3. VALIDATE the transition, then the input.
  if (row.status !== "rejected") {
    throw new InvalidStateError(
      row.status === "appealed"
        ? "Your appeal is already with the administrator."
        : "Only a rejected internship can be appealed.",
    );
  }
  if (row.appealCount >= MAX_APPEALS) {
    throw new InvalidStateError(
      "You have already appealed this internship once, and that decision is final.",
    );
  }

  const parsed = parseOrThrow(appealSchema, input);

  // 4. ACT — the status change, the counter and the event in one transaction.
  const raised = await Appeals.raise({
    internshipId,
    studentId: user.id,
    reason: parsed.reason,
  });

  // Zero rows means the row moved between the load and the write — a second
  // tab, or a double-clicked button.
  if (!raised) throw new InvalidStateError();
}

/* ── the administrator's side ────────────────────────────────────────────── */

export async function listAppealQueue(): Promise<AppealQueueItem[]> {
  await requireRole("admin");
  return Appeals.queue();
}

/**
 * Everything needed to rule on one appeal: the internship as submitted, the
 * documents, the advisor's reason and the student's case.
 *
 * Reading an internship that is not under appeal returns `NotFoundError`, the
 * same as an id that does not exist. The admin console lists what is appealable
 * and nothing else, so an id typed into this route is either a stale bookmark
 * or somebody fishing, and neither deserves a different answer.
 */
export async function getAppealDetail(internshipId: string): Promise<AppealDetail> {
  await requireRole("admin");
  parseIdOrNotFound(internshipId);

  const row = await Appeals.findForReview(internshipId);
  if (!row) throw new NotFoundError();
  if (row.status !== "appealed") throw new NotFoundError();

  const [detail, context] = await Promise.all([
    Verification.detail(internshipId),
    Appeals.context(internshipId),
  ]);
  if (!detail || !context) throw new NotFoundError();

  const timeline = detail.internship.timeline;

  /*
   * The student's case is the newest `appeal` event, and the advisor's reason
   * the newest `reject` before it — both read off the thread rather than
   * duplicated into a column.
   *
   * That is not laziness about schema design: the thread is already the record
   * everybody reads, and a second copy on the row is a second thing that can
   * disagree with it.
   */
  return {
    internship: detail.internship,
    student: detail.student,
    appeal: {
      // `internships_appeal_dated_ck` guarantees a date on an appealed row.
      appealedAt: (context.appealedAt ?? new Date()).toISOString(),
      /*
       * Empty is unreachable: `Appeals.raise` writes the status change and the
       * `appeal` event in one transaction, so an appealed row always has one.
       * The fallback keeps the type honest rather than papering over a bug —
       * if this string ever renders, the transaction stopped being atomic.
       */
      reason: lastReasonOf(timeline, "appeal") ?? "",
      rejectionReason: lastReasonOf(timeline, "reject"),
      facultyName: context.facultyName,
    },
  };
}

/**
 * The ruling: publish over the rejection, or let it stand.
 *
 * Same four steps. The transition check is what stops an administrator ruling
 * twice on one appeal, or ruling on an internship nobody has appealed.
 */
export async function decideAppeal(internshipId: string, input: unknown): Promise<void> {
  // 1. AUTHORISE — admin only. See the note at the top of this file.
  const admin = await requireRole("admin");
  parseIdOrNotFound(internshipId);

  // 2. LOAD
  const row = await Appeals.findForReview(internshipId);
  if (!row) throw new NotFoundError();

  /*
   * An administrator ruling on the appeal against their own rejection.
   *
   * It cannot happen today — only faculty reach the decision form, and an admin
   * account is not anybody's advisor — but `verification.controller` does let
   * an admin verify, so the row they are ruling on could one day carry their
   * own name. Refusing here costs one comparison and closes the question.
   */
  if (row.assignedFacultyId === admin.id) {
    throw new ForbiddenError(
      "You rejected this internship, so you cannot also rule on the appeal against it.",
    );
  }

  // 3. VALIDATE the transition, then the input.
  if (row.status !== "appealed") {
    throw new InvalidStateError(
      row.status === "rejected"
        ? "This appeal has already been decided."
        : `This internship is ${row.status.replace("_", " ")}, so there is no appeal to decide.`,
    );
  }

  const parsed = parseOrThrow(appealDecisionSchema, input);

  // 4. ACT
  const decided = await Appeals.decide({
    internshipId,
    adminId: admin.id,
    decision: parsed.decision,
    reason: parsed.reason,
  });

  if (!decided) throw new InvalidStateError();
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

/** The newest reason carried by one kind of event. The thread is oldest-first. */
function lastReasonOf(
  timeline: { action: string; reason: string | null }[],
  action: string,
): string | null {
  for (let index = timeline.length - 1; index >= 0; index -= 1) {
    const entry = timeline[index];
    if (entry.action === action && entry.reason?.trim()) return entry.reason;
  }
  return null;
}
