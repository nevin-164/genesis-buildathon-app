"use client";

import { useActionState, useMemo, useState } from "react";

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
  AuthSelect,
  AuthSubmit,
} from "../auth-ui";
import { onboardingAction } from "./actions";

type OnboardingRole = "student" | "faculty";

const ROLE_CHOICES: { value: OnboardingRole; label: string; hint: string }[] = [
  { value: "student", label: "Student", hint: "Write up the internships you have done." },
  { value: "faculty", label: "Faculty", hint: "Verify the write-ups of the classes you advise." },
];

export function OnboardingForm({ tree }: { tree: OrgTree }) {
  const [state, formAction] = useActionState(onboardingAction, initialActionState);
  const [role, setRole] = useState<OnboardingRole>("student");
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
  const treeMissing = tree.classes.length === 0;

  return (
    <form action={formAction} className="space-y-4">
      {state.message && <AuthAlert>{state.message}</AuthAlert>}

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

      {isStudent &&
        (treeMissing ? (
          <AuthNotice>
            Student onboarding is not open yet — an administrator still has to set up the class
            list. You can continue as faculty if that is your role.
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

              <AuthField label="Class" htmlFor="classId" required error={state.fieldErrors?.classId}>
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

      {(!isStudent || !treeMissing) && (
        <div className="pt-1">
          <AuthSubmit pendingLabel="Finishing setup…">Finish setup</AuthSubmit>
        </div>
      )}
    </form>
  );
}
