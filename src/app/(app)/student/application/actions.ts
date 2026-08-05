"use server";

import { revalidatePath } from "next/cache";

import { respondToClarification } from "@/controllers/application.controller";
import { toActionState } from "@/lib/api/action-state";
import type { ActionState } from "@/types/contracts";

const MIN_REPLY_LENGTH = 10;

export async function replyToClarificationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const applicationId = formData.get("applicationId");
  const replyMessage = formData.get("replyMessage");

  if (typeof applicationId !== "string" || !applicationId.trim()) {
    return {
      ok: false,
      message: "Application not found.",
      fieldErrors: { applicationId: "Missing application." },
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
    await respondToClarification(applicationId, { replyMessage: trimmed });
    revalidatePath(`/student/application/${applicationId}`);
    revalidatePath("/student/application");
    revalidatePath("/student");
    return {
      ok: true,
      message: "Your response has been sent to your faculty advisor.",
    };
  } catch (error) {
    return toActionState(error);
  }
}
