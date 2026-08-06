"use client";

import { useActionState, useMemo, useState } from "react";

import { Field, Input, Select } from "@/components/ui";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState, type OrgTree } from "@/types/contracts";

import { registerAction } from "./actions";

export function RegisterForm({ tree }: { tree: OrgTree }) {
  const [state, formAction] = useActionState(registerAction, initialActionState);

  // Every field is controlled. React 19 resets an uncontrolled form once the
  // action settles, and making somebody retype six fields because one of them
  // was wrong is how you lose a registration.
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

  if (tree.departments.length === 0) {
    return (
      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Registration is not open yet — an administrator still has to set up the department, batch
        and class list. Please try again later.
      </p>
    );
  }

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

      <Field label="Full name" htmlFor="fullName" required error={state.fieldErrors?.fullName}>
        <Input
          id="fullName"
          name="fullName"
          required
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          error={state.fieldErrors?.fullName}
          placeholder="Priya Nair"
        />
      </Field>

      <Field label="Email" htmlFor="email" required error={state.fieldErrors?.email}>
        <Input
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
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        required
        error={state.fieldErrors?.password}
        hint="At least 6 characters."
      >
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          error={state.fieldErrors?.password}
        />
      </Field>

      <Field
        label="Register number"
        htmlFor="registerNumber"
        required
        error={state.fieldErrors?.registerNumber}
      >
        <Input
          id="registerNumber"
          name="registerNumber"
          required
          value={registerNumber}
          onChange={(event) => setRegisterNumber(event.target.value)}
          error={state.fieldErrors?.registerNumber}
          placeholder="FIT22CS001"
        />
      </Field>

      {/*
        Department and batch narrow the list; only the class is submitted. It is
        the level that carries the faculty advisor, so it is the only one the
        student profile needs.
      */}
      <Field label="Department" htmlFor="departmentId" required>
        <Select
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
      </Field>

      <Field label="Batch" htmlFor="batchId" required>
        <Select
          id="batchId"
          required
          disabled={!departmentId}
          placeholder={departmentId ? "Select a batch" : "Choose a department first"}
          options={batches.map((batch) => ({ value: batch.id, label: batch.name }))}
          value={batchId}
          onChange={(event) => {
            setBatchId(event.target.value);
            setClassId("");
          }}
        />
      </Field>

      <Field label="Class" htmlFor="classId" required error={state.fieldErrors?.classId}>
        <Select
          id="classId"
          name="classId"
          required
          disabled={!batchId}
          error={state.fieldErrors?.classId}
          placeholder={batchId ? "Select a class" : "Choose a batch first"}
          options={classes.map((cls) => ({ value: cls.id, label: cls.name }))}
          value={classId}
          onChange={(event) => setClassId(event.target.value)}
        />
      </Field>

      <SubmitButton pendingLabel="Creating account…">Create account</SubmitButton>
    </form>
  );
}
