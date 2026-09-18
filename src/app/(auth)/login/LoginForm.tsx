"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";

import { initialActionState } from "@/types/contracts";

import {
  AuthAlert,
  AuthField,
  AuthInput,
  AuthPasswordInput,
  AuthSubmit,
} from "../auth-ui";
import { loginAction } from "./actions";

export function LoginForm({ googleConfigured }: { googleConfigured: boolean }) {
  const [state, formAction] = useActionState(loginAction, initialActionState);
  const searchParams = useSearchParams();

  // Controlled so a rejected sign-in does not also wipe what they typed —
  // React 19 resets uncontrolled fields once the action settles. The password
  // is left uncontrolled on purpose: clearing that one is the right behaviour.
  const [email, setEmail] = useState("");

  return (
    <form action={formAction} className="space-y-4">
      {searchParams.get("error") === "oauth_no_account" && (
        <AuthAlert>No account found for that Google email. Please register first.</AuthAlert>
      )}
      {searchParams.get("error") === "oauth" && (
        <AuthAlert>That sign-in did not complete. Please try again.</AuthAlert>
      )}
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

      <ProviderButtons googleConfigured={googleConfigured} />
    </form>
  );
}

const PROVIDERS = [{ id: "google", label: "Continue with Google" }] as const;

function ProviderButtons({ googleConfigured }: { googleConfigured: boolean }) {
  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-[#dfe6e0]" />
        <span className="text-[11px] font-medium tracking-wide text-[#8a968d] uppercase">
          or
        </span>
        <span className="h-px flex-1 bg-[#dfe6e0]" />
      </div>

      <div className="grid gap-2">
        {PROVIDERS.map((provider) =>
          googleConfigured ? (
            <a
              key={provider.id}
              href={`/api/auth/${provider.id}?intent=login`}
              className="flex min-h-11 w-full items-center justify-center rounded-lg border border-[#dfe6e0] bg-white px-4 text-sm font-medium text-[#5c6b62] transition-colors hover:border-[#b5c4b8] hover:bg-[#f4f8f0]"
            >
              {provider.label}
            </a>
          ) : (
            <button
              key={provider.id}
              type="button"
              disabled
              className="flex min-h-11 w-full items-center justify-center rounded-lg border border-[#dfe6e0] bg-white px-4 text-sm font-medium text-[#5c6b62] disabled:cursor-not-allowed disabled:opacity-55"
            >
              {provider.label}
            </button>
          ),
        )}
      </div>

      {!googleConfigured && (
        <p className="text-center text-[12px] text-[#8a968d]">
          Provider sign-in is coming soon.
        </p>
      )}
    </div>
  );
}
