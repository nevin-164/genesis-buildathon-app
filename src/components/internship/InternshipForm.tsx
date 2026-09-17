"use client";

import { useActionState, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import {
  BTN_GHOST,
  BTN_PRIMARY,
  CONTROL,
  FOCUS_RING,
  INK,
  MOTION,
  MUTED,
  MUTED_LIGHT,
  PANEL,
  SECTION_HEADING,
} from "@/components/explore/explore-ui";
import { CompanyField } from "@/components/internship/CompanyField";
import {
  EMPTY_INTERNSHIP_FORM,
  previewDurationWeeks,
  type InternshipFormValues,
} from "@/components/internship/internship-form-values";
import { Field } from "@/components/ui";
import {
  APPLICATION_SOURCES,
  DOMAINS,
  MENTOR_FREQUENCIES,
  WORK_MODES,
  WORK_NATURES,
} from "@/lib/constants/options";
import { cn } from "@/lib/cn";
import { initialActionState, type ActionState } from "@/types/contracts";

/** submitSchema's floor. Shown live so nobody discovers it on submit. */
const MIN_SUMMARY_LENGTH = 120;

type FormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

/* ── Small building blocks ───────────────────────────────────────────────── */

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className={cn(PANEL, "p-4 sm:p-5")}>
      <h2 className={SECTION_HEADING}>{title}</h2>
      <p className={cn("mt-1 text-sm", MUTED)}>{description}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

/** A field that should take the full width of the two-column grid. */
function Wide({ children }: { children: ReactNode }) {
  return <div className="sm:col-span-2">{children}</div>;
}

function TextControl({
  id,
  value,
  onChange,
  error,
  ...rest
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "value" | "onChange">) {
  return (
    <input
      {...rest}
      id={id}
      name={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-invalid={error ? true : undefined}
      className={cn(CONTROL, "h-10", MOTION, error && "border-red-500")}
    />
  );
}

function SelectControl({
  id,
  value,
  onChange,
  options,
  placeholder,
  error,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  placeholder: string;
  error?: string;
}) {
  return (
    <select
      id={id}
      name={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-invalid={error ? true : undefined}
      className={cn(CONTROL, "h-10", MOTION, error && "border-red-500")}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function TextareaControl({
  id,
  value,
  onChange,
  rows = 4,
  error,
  ...rest
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  error?: string;
} & Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "id" | "value" | "onChange" | "rows"
>) {
  return (
    <textarea
      {...rest}
      id={id}
      name={id}
      rows={rows}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-invalid={error ? true : undefined}
      className={cn(
        CONTROL,
        "h-auto resize-y py-2 leading-relaxed",
        MOTION,
        error && "border-red-500",
      )}
    />
  );
}

/**
 * Yes/no as two radios rather than a single checkbox.
 *
 * A checkbox has no way to say "I have not answered yet", so an unticked one
 * reads as a deliberate "no" — which is how an internship with a mentor gets
 * published saying it had none.
 */
function BooleanChoice({
  name,
  value,
  onChange,
  choices,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  choices: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby={`${name}-label`}>
      {choices.map((choice) => {
        const selected = value === choice.value;
        return (
          <label
            key={choice.value || "unset"}
            className={cn(
              "cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium",
              MOTION,
              FOCUS_RING,
              selected
                ? "border-[#c8ef5a] bg-[#0f1812] text-white"
                : cn("border-[#cdd8cf] bg-white hover:border-[#b5c4b8]", INK),
            )}
          >
            <input
              type="radio"
              name={name}
              value={choice.value}
              checked={selected}
              onChange={() => onChange(choice.value)}
              className="sr-only"
            />
            {choice.label}
          </label>
        );
      })}
    </div>
  );
}

/**
 * The buttons. Split out because `useFormStatus` only reports the pending
 * state of the form ABOVE it in the tree — read from the same component that
 * renders the <form> and it is always false.
 */
function FormActions({
  submitLabel,
  saveLabel,
  canSubmit,
  blockedReason,
}: {
  submitLabel: string;
  saveLabel: string;
  canSubmit: boolean;
  blockedReason: string | null;
}) {
  const { pending } = useFormStatus();

  return (
    <div className={cn(PANEL, "flex flex-col gap-3 p-4 sm:p-5")}>
      <div className="flex flex-col gap-2 sm:flex-row-reverse sm:items-center sm:justify-start">
        <button
          type="submit"
          name="intent"
          value="submit"
          disabled={pending || !canSubmit}
          className={cn(BTN_PRIMARY, "w-full sm:w-auto", MOTION, FOCUS_RING)}
        >
          {pending ? "Working…" : submitLabel}
        </button>
        <button
          type="submit"
          name="intent"
          value="save"
          disabled={pending}
          className={cn(
            BTN_GHOST,
            "w-full px-4 py-2.5 text-sm disabled:opacity-60 sm:w-auto",
            MOTION,
            FOCUS_RING,
          )}
        >
          {pending ? "Working…" : saveLabel}
        </button>
      </div>

      <p className={cn("text-sm", MUTED)}>
        {blockedReason ??
          "Your advisor reviews it after you submit. You cannot edit it while they have it."}
      </p>
    </div>
  );
}

/* ── The form ────────────────────────────────────────────────────────────── */

export function InternshipForm({
  action,
  internshipId,
  initialValues = EMPTY_INTERNSHIP_FORM,
  submitLabel = "Submit for verification",
  saveLabel = "Save draft",
  /** Rendered between the form fields and the buttons — the documents panel. */
  children,
}: {
  action: FormAction;
  internshipId?: string;
  initialValues?: InternshipFormValues;
  submitLabel?: string;
  saveLabel?: string;
  children?: ReactNode;
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  const [values, setValues] = useState<InternshipFormValues>(initialValues);

  /**
   * The form is controlled throughout. React clears an uncontrolled form once
   * its action resolves, which on a rejected submit would wipe everything the
   * student typed — the one moment they least want to retype it.
   */
  const set =
    <K extends keyof InternshipFormValues>(key: K) =>
    (value: string) =>
      setValues((current) => ({ ...current, [key]: value }));

  const errorFor = (field: string) => state.fieldErrors?.[field];

  const summaryLength = values.workSummary.trim().length;
  const summaryShort = summaryLength < MIN_SUMMARY_LENGTH;
  const durationWeeks = previewDurationWeeks(values.startDate, values.endDate);
  const locationRequired = values.workMode !== "" && values.workMode !== "remote";
  const hadMentor = values.hadMentor === "true";

  /**
   * A cheap client-side gate on the submit button, mirroring the required
   * fields in `submitSchema`. It is a courtesy, not a control: the action
   * re-validates and the controller validates again after that.
   */
  const missing =
    !values.companyName.trim() ||
    values.roleTitle.trim().length < 2 ||
    !values.domain ||
    !values.workMode ||
    !values.startDate ||
    !values.endDate ||
    !values.workNature ||
    summaryShort ||
    (locationRequired && !values.location.trim()) ||
    (hadMentor && !values.mentorFrequency);

  const blockedReason = missing
    ? "Fill in every required field before you can submit. You can save a draft at any time."
    : null;

  const formError = state.fieldErrors?._form;

  return (
    <form action={formAction} className="space-y-4 sm:space-y-5" noValidate>
      {internshipId && <input type="hidden" name="internshipId" value={internshipId} />}

      {state.message && (
        <p
          role={state.ok ? "status" : "alert"}
          className={cn(
            "rounded-lg border px-4 py-3 text-sm",
            state.ok
              ? "border-[#b8d4bc] bg-[#ecf8ee] text-[#2d5038]"
              : "border-red-200 bg-red-50 text-red-700",
          )}
        >
          {state.message}
          {formError && <span className="mt-1 block">{formError}</span>}
        </p>
      )}

      <Section
        title="The internship"
        description="Where you were, what you were called, and when it ran."
      >
        <Wide>
          <CompanyField
            value={values.companyName}
            onChange={set("companyName")}
            error={errorFor("companyName")}
          />
        </Wide>

        <Wide>
          <Field
            label="Role title"
            htmlFor="roleTitle"
            required
            error={errorFor("roleTitle")}
            hint="As the company titled it."
          >
            <TextControl
              id="roleTitle"
              value={values.roleTitle}
              onChange={set("roleTitle")}
              error={errorFor("roleTitle")}
              maxLength={200}
              placeholder="e.g. Backend Developer Intern"
            />
          </Field>
        </Wide>

        <Field label="Domain" htmlFor="domain" required error={errorFor("domain")}>
          <SelectControl
            id="domain"
            value={values.domain}
            onChange={set("domain")}
            options={DOMAINS}
            placeholder="Choose a domain"
            error={errorFor("domain")}
          />
        </Field>

        <Field label="Work mode" htmlFor="workMode" required error={errorFor("workMode")}>
          <SelectControl
            id="workMode"
            value={values.workMode}
            onChange={set("workMode")}
            options={WORK_MODES}
            placeholder="Choose a work mode"
            error={errorFor("workMode")}
          />
        </Field>

        <Wide>
          <Field
            label="Location"
            htmlFor="location"
            required={locationRequired}
            error={errorFor("location")}
            hint={
              locationRequired
                ? "Where you actually went. Required for on-site and hybrid."
                : "Optional for a remote internship."
            }
          >
            <TextControl
              id="location"
              value={values.location}
              onChange={set("location")}
              error={errorFor("location")}
              maxLength={500}
              placeholder="e.g. Kochi, Kerala"
            />
          </Field>
        </Wide>

        <Field label="Start date" htmlFor="startDate" required error={errorFor("startDate")}>
          <TextControl
            id="startDate"
            type="date"
            value={values.startDate}
            onChange={set("startDate")}
            error={errorFor("startDate")}
          />
        </Field>

        <Field
          label="End date"
          htmlFor="endDate"
          required
          error={errorFor("endDate")}
          hint={
            durationWeeks !== null
              ? `${durationWeeks} ${durationWeeks === 1 ? "week" : "weeks"}`
              : "Add this after the internship has finished."
          }
        >
          <TextControl
            id="endDate"
            type="date"
            value={values.endDate}
            onChange={set("endDate")}
            error={errorFor("endDate")}
          />
        </Field>
      </Section>

      <Section
        title="The money"
        description="Leave a box empty to skip it — that is recorded differently from zero."
      >
        <Field
          label="Fee you paid"
          htmlFor="feeAmount"
          error={errorFor("feeAmount")}
          hint="Enter 0 if it cost you nothing."
        >
          <TextControl
            id="feeAmount"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={values.feeAmount}
            onChange={(value) => set("feeAmount")(value.replace(/[^\d]/g, ""))}
            error={errorFor("feeAmount")}
            placeholder="₹"
          />
        </Field>

        <Field
          label="Stipend you received"
          htmlFor="stipendAmount"
          error={errorFor("stipendAmount")}
          hint="Enter 0 if it was unpaid."
        >
          <TextControl
            id="stipendAmount"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={values.stipendAmount}
            onChange={(value) => set("stipendAmount")(value.replace(/[^\d]/g, ""))}
            error={errorFor("stipendAmount")}
            placeholder="₹"
          />
        </Field>
      </Section>

      <Section
        title="The work"
        description="What you actually did day to day."
      >
        <Field label="Nature of work" htmlFor="workNature" required error={errorFor("workNature")}>
          <SelectControl
            id="workNature"
            value={values.workNature}
            onChange={set("workNature")}
            options={WORK_NATURES}
            placeholder="Choose what it really was"
            error={errorFor("workNature")}
          />
        </Field>

        <Field label="Project title" htmlFor="projectTitle" error={errorFor("projectTitle")}>
          <TextControl
            id="projectTitle"
            value={values.projectTitle}
            onChange={set("projectTitle")}
            error={errorFor("projectTitle")}
            maxLength={500}
            placeholder="If you built one thing in particular"
          />
        </Field>

        <Wide>
          <Field
            label="What the work was"
            htmlFor="workSummary"
            required
            error={errorFor("workSummary")}
          >
            <TextareaControl
              id="workSummary"
              rows={8}
              value={values.workSummary}
              onChange={set("workSummary")}
              error={errorFor("workSummary")}
              maxLength={10000}
              aria-describedby="workSummary-count"
              placeholder="A normal day, what you were given to do, and what the team actually used."
            />
            <p
              id="workSummary-count"
              className={cn("mt-1.5 text-xs", summaryShort ? "text-amber-800" : MUTED_LIGHT)}
            >
              {summaryLength} characters
              {summaryShort && ` — ${MIN_SUMMARY_LENGTH} minimum`}
            </p>
          </Field>
        </Wide>

        <Wide>
          <Field
            label="Technologies used"
            htmlFor="technologies"
            error={errorFor("technologies")}
            hint="Separate with commas. Up to 20."
          >
            <TextControl
              id="technologies"
              value={values.technologies}
              onChange={set("technologies")}
              error={errorFor("technologies")}
              placeholder="React, PostgreSQL, Docker"
            />
          </Field>
        </Wide>
      </Section>

      <Section
        title="Mentorship"
        description="Whether anyone was actually responsible for you."
      >
        <Wide>
          <p id="hadMentor-label" className="mb-1.5 block text-sm font-medium text-zinc-800">
            Did you have a mentor?
          </p>
          <BooleanChoice
            name="hadMentor"
            value={values.hadMentor}
            onChange={set("hadMentor")}
            choices={[
              { value: "true", label: "Yes" },
              { value: "false", label: "No" },
            ]}
          />
        </Wide>

        {hadMentor && (
          <Wide>
            <Field
              label="How often you met them"
              htmlFor="mentorFrequency"
              required
              error={errorFor("mentorFrequency")}
            >
              <SelectControl
                id="mentorFrequency"
                value={values.mentorFrequency}
                onChange={set("mentorFrequency")}
                options={MENTOR_FREQUENCIES}
                placeholder="Choose how often"
                error={errorFor("mentorFrequency")}
              />
            </Field>
          </Wide>
        )}
      </Section>

      <Section
        title="What changed"
        description="What you knew before, and what you knew after."
      >
        <Field
          label="Skills before"
          htmlFor="skillsBefore"
          error={errorFor("skillsBefore")}
          hint="Separate with commas."
        >
          <TextControl
            id="skillsBefore"
            value={values.skillsBefore}
            onChange={set("skillsBefore")}
            error={errorFor("skillsBefore")}
            placeholder="HTML, basic Python"
          />
        </Field>

        <Field
          label="Skills after"
          htmlFor="skillsAfter"
          error={errorFor("skillsAfter")}
          hint="Separate with commas."
        >
          <TextControl
            id="skillsAfter"
            value={values.skillsAfter}
            onChange={set("skillsAfter")}
            error={errorFor("skillsAfter")}
            placeholder="REST APIs, Git workflow, SQL joins"
          />
        </Field>
      </Section>

      <Section
        title="How you got in"
        description="How you found the role and got in."
      >
        <Field
          label="How you applied"
          htmlFor="applicationSource"
          error={errorFor("applicationSource")}
        >
          <SelectControl
            id="applicationSource"
            value={values.applicationSource}
            onChange={set("applicationSource")}
            options={APPLICATION_SOURCES}
            placeholder="Choose a route"
            error={errorFor("applicationSource")}
          />
        </Field>

        <Wide>
          <Field
            label="What the process was"
            htmlFor="applicationProcess"
            error={errorFor("applicationProcess")}
            hint="Rounds, tests, interviews, how long they took to reply."
          >
            <TextareaControl
              id="applicationProcess"
              rows={4}
              value={values.applicationProcess}
              onChange={set("applicationProcess")}
              error={errorFor("applicationProcess")}
              maxLength={5000}
              placeholder="One online test, then a 30-minute call about my project."
            />
          </Field>
        </Wide>
      </Section>

      <Section
        title="Who it suits"
        description="Guidance for the next batch."
      >
        <Wide>
          <p
            id="beginnerFriendly-label"
            className="mb-1.5 block text-sm font-medium text-zinc-800"
          >
            Would it suit a beginner?
          </p>
          <BooleanChoice
            name="beginnerFriendly"
            value={values.beginnerFriendly}
            onChange={set("beginnerFriendly")}
            choices={[
              { value: "true", label: "Yes" },
              { value: "false", label: "No" },
              { value: "", label: "Not sure" },
            ]}
          />
        </Wide>

        <Wide>
          <Field
            label="Who should consider it"
            htmlFor="suitsWhom"
            error={errorFor("suitsWhom")}
            hint="Be specific about what somebody needs to know first."
          >
            <TextareaControl
              id="suitsWhom"
              rows={3}
              value={values.suitsWhom}
              onChange={set("suitsWhom")}
              error={errorFor("suitsWhom")}
              maxLength={2000}
              placeholder="Anyone comfortable with JavaScript who has never worked on a real codebase."
            />
          </Field>
        </Wide>
      </Section>

      {children}

      <FormActions
        submitLabel={submitLabel}
        saveLabel={saveLabel}
        canSubmit={!missing}
        blockedReason={blockedReason}
      />
    </form>
  );
}
