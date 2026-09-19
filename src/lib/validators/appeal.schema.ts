import { z } from "zod";

import type { InternshipStatus } from "@/types/contracts";

import { checkbox, text } from "./fields";

/**
 * The two forms an appeal needs: the student's case, and the administrator's
 * ruling on it.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY AN APPEAL IS NOT JUST ANOTHER `respond`.
 *
 * A change request is a conversation with the person already reading your work;
 * ten characters of "fixed, please look again" is a reasonable thing to send.
 * An appeal asks a third person, who has never seen this internship, to
 * overrule a colleague. That reader starts with nothing, so the floor here is
 * four times higher and the copy asks for specifics rather than a protest.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * One appeal per internship, and the database agrees —
 * `internships_appeal_count_ck` caps `appeal_count` at 1.
 *
 * The number lives here rather than being written into three files, because
 * the controller enforces it, the model increments towards it and the UI
 * explains it, and those three must never disagree about what it is.
 */
export const MAX_APPEALS = 1;

/**
 * The one definition of "may this student appeal?".
 *
 * Two models build an `InternshipDetail` — the student's and the advisor's —
 * and `canAppeal` has to mean the same thing on both, or the button appears on
 * one screen and not the other for the same row.
 *
 * `appealed` is false here, not true: the appeal has already been made.
 */
export function canAppeal(status: InternshipStatus, appealCount: number): boolean {
  return status === "rejected" && appealCount < MAX_APPEALS;
}

/* ── the student's case ──────────────────────────────────────────────────── */

export const APPEAL_MIN = 40;
export const APPEAL_MAX = 5000;

const APPEAL_MESSAGE =
  "Explain what your advisor got wrong and what the attached proof shows — " +
  `at least ${APPEAL_MIN} characters.`;

export const appealSchema = z.object({
  reason: text(APPEAL_MIN, APPEAL_MAX, APPEAL_MESSAGE),
});

export type AppealInput = z.output<typeof appealSchema>;

/* ── the administrator's ruling ──────────────────────────────────────────── */

/**
 * Two outcomes, and deliberately no third.
 *
 * "Send it back to the advisor" was the obvious third option and it is the
 * wrong one: the advisor has already given their answer, so returning it there
 * is a loop with no new information in it. An administrator who wants the
 * advisor's view asks them, then rules.
 */
export const APPEAL_DECISIONS = ["overturn", "uphold"] as const;

export const DECISION_MIN = 10;
const DECISION_MESSAGE =
  "Write your reasoning — the student and their advisor both read this. " +
  `At least ${DECISION_MIN} characters.`;

/**
 * Ticked before an administrator may publish over an advisor's rejection.
 *
 * The same speed bump as the faculty verify form, for a stronger reason: this
 * one publishes a card that the person who actually read the documents said
 * should not be published. They are validated and thrown away — there is no
 * column for them and there should not be one.
 */
const OVERTURN_CONFIRMATIONS = [
  ["confirmEvidence", "Confirm you have opened the attached documents yourself."],
  ["confirmAdvisorConsidered", "Confirm you have considered the advisor's reason."],
] as const;

export const appealDecisionSchema = z
  .object({
    decision: z.enum(APPEAL_DECISIONS, "Choose whether to overturn or uphold the rejection."),
    /**
     * Compulsory on BOTH outcomes, unlike the faculty form where `verify` needs
     * no words. An administrator is overruling, or declining to overrule, a
     * colleague who read the evidence first; either way the reasoning is the
     * record, and `verification_events_reason_ck` refuses the row without it.
     */
    reason: text(DECISION_MIN, 2000, DECISION_MESSAGE),
    confirmEvidence: checkbox,
    confirmAdvisorConsidered: checkbox,
  })
  .superRefine((value, ctx) => {
    if (value.decision !== "overturn") return;

    for (const [field, message] of OVERTURN_CONFIRMATIONS) {
      if (!value[field]) {
        ctx.addIssue({ code: "custom", path: [field], message });
      }
    }
  });

export type AppealDecisionInput = z.output<typeof appealDecisionSchema>;
