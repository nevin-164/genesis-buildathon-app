"use client";

import { useActionState, useState } from "react";

import { Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/types/contracts";

import { loginAction } from "./actions";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialActionState);

  // Controlled so a rejected sign-in does not also wipe what they typed —
  // React 19 resets uncontrolled fields once the action settles. The password
  // is left uncontrolled on purpose: clearing that one is the right behaviour.
  const [email, setEmail] = useState("");

  return (
    <form action={formAction} className="space-y-4">
      {state.message && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.message}
        </p>
      )}

      <Field label="Email" htmlFor="email" required error={state.fieldErrors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={state.fieldErrors?.email}
          placeholder="you@fisat.ac.in"
        />
      </Field>

      <Field label="Password" htmlFor="password" required error={state.fieldErrors?.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          error={state.fieldErrors?.password}
        />
      </Field>

      <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
