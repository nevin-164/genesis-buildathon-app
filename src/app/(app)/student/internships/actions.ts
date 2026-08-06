"use server";

import { revalidatePath } from "next/cache";

import { respondToVerification } from "@/controllers/internship.controller";
import { toActionState } from "@/lib/api/action-state";
import type { ActionState } from "@/types/contracts";

/**
 * The student's reply when their advisor asked for changes — action 'respond'
 * on the verification thread. It does not resubmit the internship; the advisor
 * still has to act on it.
 */
const MIN_REPLY_LENGTH = 10;

export async function respondToVerificationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const internshipId = formData.get("internshipId");
  const replyMessage = formData.get("replyMessage");

  if (typeof internshipId !== "string" || !internshipId.trim()) {
    return {
      ok: false,
      message: "Internship not found.",
      fieldErrors: { internshipId: "Missing internship." },
    };
  }

  const trimmed = typeof replyMessage === "string" ? replyMessage.trim() : "";
  if (trimmed.length < MIN_REPLY_LENGTH) {
    return {
      ok: false,
      message: "Please fix the errors below.",
      fieldErrors: {
        replyMessage: `Enter at least ${MIN_REPLY_LENGTH} characters.`,
      },
    };
  }

  try {
    await respondToVerification(internshipId, { reason: trimmed });
    revalidatePath(`/student/internships/${internshipId}`);
    revalidatePath("/student/internships");
    revalidatePath("/student");
    return {
      ok: true,
      message: "Your response has been sent to your faculty advisor.",
    };
  } catch (error) {
    return toActionState(error);
  }
}
