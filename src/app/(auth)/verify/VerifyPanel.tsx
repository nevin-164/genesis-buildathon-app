"use client";

import { useActionState } from "react";

import type { ActionState } from "@/types/contracts";

import { AuthAlert, AuthSubmit } from "../auth-ui";
import { confirmEmailAction, resendVerificationAction } from "./actions";

export function VerifyPanel({
  token,
  userEmail,
}: {
  token?: string;
  userEmail?: string;
}) {
  const [confirmState, confirmFormAction] = useActionState(confirmEmailAction, { ok: false });
  const [resendState, resendFormAction] = useActionState(resendVerificationAction, { ok: false });

  if (token) {
    return (
      <div className="space-y-4">
        {confirmState.message && !confirmState.ok && (
          <AuthAlert>{confirmState.message}</AuthAlert>
        )}
        <form action={confirmFormAction} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <p className="text-sm text-[#5c6b62]">
            Please click the button below to confirm your email address and verify your account.
          </p>
          <AuthSubmit pendingLabel="Confirming…">Confirm my address</AuthSubmit>
        </form>

        {confirmState.message && !confirmState.ok && (
          <div className="border-t border-[#dde5dc] pt-4">
            <p className="mb-3 text-xs text-[#5c6b62]">Need a new verification link?</p>
            <ResendForm state={resendState} action={resendFormAction} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#5c6b62]">
        We sent a verification link to{" "}
        <strong className="text-[#0f1812]">{userEmail || "your email address"}</strong>. Please check
        your inbox and click the link to verify your account.
      </p>

      <ResendForm state={resendState} action={resendFormAction} />
    </div>
  );
}

function ResendForm({
  state,
  action,
}: {
  state: ActionState;
  action: (payload: FormData) => void;
}) {
  return (
    <form action={action} className="space-y-3">
      {state.message &&
        (state.ok ? (
          <p className="rounded-lg border border-[#c3e6cb] bg-[#d4edda] px-3.5 py-2.5 text-sm text-[#155724]">
            {state.message}
          </p>
        ) : (
          <AuthAlert>{state.message}</AuthAlert>
        ))}
      <AuthSubmit pendingLabel="Sending resend email…">Resend verification email</AuthSubmit>
    </form>
  );
}
