"use client";

import { useActionState, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { cn } from "@/lib/cn";
import { initialActionState, type OrgTree } from "@/types/contracts";

import {
  AUTH_FAINT,
  AUTH_LABEL,
  AUTH_MOTION,
  AuthAlert,
  AuthField,
  AuthInput,
  AuthNotice,
  AuthPasswordInput,
  AuthSelect,
  AuthSubmit,
} from "../auth-ui";
import { registerAction } from "./actions";

type SignupRole = "student" | "faculty";

const ROLE_CHOICES: { value: SignupRole; label: string; hint: string }[] = [
  { value: "student", label: "Student", hint: "Write up the internships you have done." },
  { value: "faculty", label: "Faculty", hint: "Verify the write-ups of the classes you advise." },
];

export function RegisterForm({
  tree,
  googleConfigured,
}: {
  tree: OrgTree;
  googleConfigured: boolean;
}) {
  const [state, formAction] = useActionState(registerAction, initialActionState);
  const searchParams = useSearchParams();

  // Every field is controlled. React 19 resets an uncontrolled form once the
  // action settles, and making somebody retype six fields because one of them
  // was wrong is how you lose a registration.
  const [role, setRole] = useState<SignupRole>("student");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [registerNumber, setRegisterNumber] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [classId, setClassId] = useState("");

  const batches = useMemo(
    () => tree.batches.filter((batch) => batch.departmentId === departmentId),
    [tree.batches, departmentId],
  );
  const classes = useMemo(
    () => tree.classes.filter((cls) => cls.batchId === batchId),
    [tree.classes, batchId],
  );

  const isStudent = role === "student";
  // Faculty must be able to register into an empty database: they are step one
  // of setting the college up, and a class cannot be created without one. So
  // this blocks the student branch only.
  const treeMissing = tree.classes.length === 0;

  return (
    <form action={formAction} className="space-y-4">
      {searchParams.get("error") === "oauth" && (
        <AuthAlert>That sign-up did not complete. Please try again.</AuthAlert>
      )}
      {state.message && <AuthAlert>{state.message}</AuthAlert>}

      {/*
        A segmented control, not a <select>: it changes the shape of the form
        below it, so it should not look like just another field.
      */}
      <fieldset className="space-y-1.5">
        <legend className={AUTH_LABEL}>I am a</legend>
        <div className="grid grid-cols-2 gap-2">
          {ROLE_CHOICES.map((choice) => {
            const active = role === choice.value;
            return (
              <label
                key={choice.value}
                className={cn(
                  "relative cursor-pointer select-none overflow-hidden rounded-lg border px-3 py-2.5",
                  "text-center focus-within:ring-2 focus-within:ring-[#c8ef5a]",
                  "focus-within:ring-offset-2 focus-within:ring-offset-white",
                  AUTH_MOTION,
                  active
                    ? "border-[#0f1812] bg-[#0f1812] text-white shadow-[inset_0_-2px_0_#c8ef5a]"
                    : "border-[#cdd8cf] bg-white text-[#3d4a42] hover:border-[#b5c4b8] hover:bg-[#f4f8f0]",
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={choice.value}
                  checked={active}
                  onChange={() => setRole(choice.value)}
                  className="sr-only"
                />
                <span className="block text-sm font-semibold tracking-tight">{choice.label}</span>
              </label>
            );
          })}
        </div>
        <p className={cn("text-xs", AUTH_FAINT)}>
          {ROLE_CHOICES.find((choice) => choice.value === role)?.hint}
        </p>
      </fieldset>

      <AuthField label="Full name" htmlFor="fullName" required error={state.fieldErrors?.fullName}>
        <AuthInput
          id="fullName"
          name="fullName"
          required
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          error={state.fieldErrors?.fullName}
          placeholder={isStudent ? "Priya Nair" : "Dr. Meera Raghunathan"}
        />
      </AuthField>

      <AuthField label="Email" htmlFor="email" required error={state.fieldErrors?.email}>
        <AuthInput
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
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
        hint="At least 8 characters."
      >
        <AuthPasswordInput
          id="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          error={state.fieldErrors?.password}
          placeholder="At least 8 characters"
        />
      </AuthField>

      {isStudent &&
        (treeMissing ? (
          <AuthNotice>
            Student registration is not open yet — an administrator still has to
            set up the department, batch and class list. Faculty can register now;
            students should try again once their class exists.
          </AuthNotice>
        ) : (
          <>
            <AuthField
              label="Register number"
              htmlFor="registerNumber"
              required
              error={state.fieldErrors?.registerNumber}
            >
              <AuthInput
                id="registerNumber"
                name="registerNumber"
                required
                value={registerNumber}
                onChange={(event) => setRegisterNumber(event.target.value)}
                error={state.fieldErrors?.registerNumber}
                placeholder="FIT22CS001"
              />
            </AuthField>

            {/*
              Department and batch narrow the list; only the class is submitted.
              It is the level that carries the faculty advisor, so it is the only
              one the student profile needs — and it is what decides who verifies
              everything this student goes on to write.
            */}
            <AuthField label="Department" htmlFor="departmentId" required>
              <AuthSelect
                id="departmentId"
                required
                placeholder="Select a department"
                options={tree.departments.map((department) => ({
                  value: department.id,
                  label: `${department.code} — ${department.name}`,
                }))}
                value={departmentId}
                onChange={(event) => {
                  setDepartmentId(event.target.value);
                  setBatchId("");
                  setClassId("");
                }}
              />
            </AuthField>

            <div className="grid gap-4 sm:grid-cols-2">
              <AuthField label="Batch" htmlFor="batchId" required>
                <AuthSelect
                  id="batchId"
                  required
                  disabled={!departmentId}
                  placeholder={departmentId ? "Select a batch" : "Department first"}
                  options={batches.map((batch) => ({ value: batch.id, label: batch.name }))}
                  value={batchId}
                  onChange={(event) => {
                    setBatchId(event.target.value);
                    setClassId("");
                  }}
                />
              </AuthField>

              <AuthField
                label="Class"
                htmlFor="classId"
                required
                error={state.fieldErrors?.classId}
              >
                <AuthSelect
                  id="classId"
                  name="classId"
                  required
                  disabled={!batchId}
                  error={state.fieldErrors?.classId}
                  placeholder={batchId ? "Select a class" : "Batch first"}
                  options={classes.map((cls) => ({ value: cls.id, label: cls.name }))}
                  value={classId}
                  onChange={(event) => setClassId(event.target.value)}
                />
              </AuthField>
            </div>
          </>
        ))}

      {isStudent && treeMissing ? null : (
        <div className="pt-1">
          <AuthSubmit pendingLabel="Creating account…">Create account</AuthSubmit>
        </div>
      )}

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
              href={`/api/auth/${provider.id}?intent=register`}
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
