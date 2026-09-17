"use client";

import { useActionState, useState } from "react";

import { initialActionState } from "@/types/contracts";

import {
  AuthAlert,
  AuthField,
  AuthInput,
  AuthPasswordInput,
  AuthSubmit,
} from "../auth-ui";
import { loginAction } from "./actions";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialActionState);

  // Controlled so a rejected sign-in does not also wipe what they typed —
  // React 19 resets uncontrolled fields once the action settles. The password
  // is left uncontrolled on purpose: clearing that one is the right behaviour.
  const [email, setEmail] = useState("");

  return (
    <form action={formAction} className="space-y-4">
      {state.message && <AuthAlert>{state.message}</AuthAlert>}

      <AuthField label="Email" htmlFor="email" required error={state.fieldErrors?.email}>
        <AuthInput
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={state.fieldErrors?.email}
          placeholder="you@fisat.ac.in"
        />
      </AuthField>

      <AuthField
        label="Password"
        htmlFor="password"
        required
        error={state.fieldErrors?.password}
      >
        <AuthPasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          error={state.fieldErrors?.password}
          placeholder="Your password"
        />
      </AuthField>

      <div className="pt-1">
        <AuthSubmit pendingLabel="Signing in…">Sign in</AuthSubmit>
      </div>
    </form>
  );
}
