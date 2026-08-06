import { z } from "zod";

import { REASON_MESSAGE, REASON_MIN, checkbox, reason } from "./fields";

/**
 * The faculty decision form. Field names match the `name` attributes packages 5
 * builds, so a field error lands under the right control.
 */

/** The three actions a verifier can take. `respond` is the student's, not theirs. */
export const VERIFIER_ACTIONS = ["verify", "request_changes", "reject"] as const;
export type VerifierAction = (typeof VERIFIER_ACTIONS)[number];

/**
 * The confirmations are a deliberate speed bump so nobody publishes a card
 * without opening the certificate. They are validated and then thrown away —
 * there is no column for them, and there should not be one.
 */
const CONFIRMATIONS = [
  ["confirmIdentity", "Confirm the student really completed this internship."],
  ["confirmEvidence", "Confirm you have seen the attached documents."],
  ["confirmNoPrivateInfo", "Confirm no private information is included."],
] as const;

export const verificationSchema = z
  .object({
    action: z.enum(VERIFIER_ACTIONS, "Choose verify, request changes or reject."),
    reason,
    confirmIdentity: checkbox,
    confirmEvidence: checkbox,
    confirmNoPrivateInfo: checkbox,
  })
  .superRefine((value, ctx) => {
    if (value.action === "verify") {
      for (const [field, message] of CONFIRMATIONS) {
        if (!value[field]) {
          ctx.addIssue({ code: "custom", path: [field], message });
        }
      }
      return;
    }

    // request_changes and reject both go back to the student, so both need words.
    if (value.reason.length < REASON_MIN) {
      ctx.addIssue({ code: "custom", path: ["reason"], message: REASON_MESSAGE });
    }
  });

export type VerificationInput = z.output<typeof verificationSchema>;
