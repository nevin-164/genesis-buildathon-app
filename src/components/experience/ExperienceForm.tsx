"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, type ReactNode } from "react";

import { saveExperienceAction } from "@/app/(app)/student/experience/actions";
import { ApplicationField } from "@/components/application/ApplicationField";
import {
  ApplicationFormSection,
  ApplicationFormSpan,
} from "@/components/application/ApplicationFormSection";
import { ExperienceFormActions } from "@/components/experience/ExperienceFormActions";
import {
  experienceToFormDefaults,
  latestFacultyChanges,
  weeksBetweenDates,
} from "@/components/experience/form-utils";
import { CertificateUploadField } from "@/components/forms/CertificateUploadField";
import { TagListInput } from "@/components/forms/TagListInput";
import {
  BODY_LEAD,
  CARD_COMPANY,
  CARD_ROLE,
  CONTROL,
  FOCUS_RING,
  INK,
  MOTION,
  MUTED,
} from "@/components/student/student-ui";
import {
  BackLink,
  CanvasPageHeader,
  CompanyMark,
  FormSectionNav,
  InsetPanel,
  QuoteBlock,
  StickyFormActions,
} from "@/components/student/primitives";
import {
  APPLICATION_SOURCES,
  DOMAINS,
  EXPERIENCE_STATUS_LABEL,
  MENTOR_FREQUENCIES,
  WORK_MODES,
  WORK_NATURES,
} from "@/lib/constants/options";
import { cn } from "@/lib/cn";
import { initialActionState, type ExperienceDetail } from "@/types/contracts";

const FORM_SECTIONS = [
  { id: "experience-identity", label: "Internship identity" },
  { id: "experience-work", label: "Actual work" },
  { id: "experience-skills-mentorship", label: "Skills & mentorship" },
  { id: "experience-application-pathway", label: "Application pathway" },
  { id: "experience-guidance", label: "Student guidance" },
  { id: "experience-certificate", label: "Certificate" },
];

function FormSectionShell({
  tinted,
  children,
}: {
  tinted: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        tinted &&
          "-mx-4 rounded-none px-4 py-6 sm:-mx-5 sm:rounded-xl sm:px-5 sm:py-7 bg-[color-mix(in_srgb,var(--il-lime)_5%,var(--il-canvas))]",
      )}
    >
      {children}
    </div>
  );
}

export function ExperienceForm({ experience }: { experience: ExperienceDetail }) {
  const defaults = experienceToFormDefaults(experience);
  const [state, formAction] = useActionState(saveExperienceAction, initialActionState);
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [durationWeeks, setDurationWeeks] = useState(defaults.durationWeeks);
  const [workMode, setWorkMode] = useState(defaults.workMode);
  const [workNature, setWorkNature] = useState(defaults.workNature);
  const [hadMentor, setHadMentor] = useState(defaults.hadMentor);
  const [certificateAttached, setCertificateAttached] = useState(
    Boolean(defaults.certificateEvidenceId),
  );
  const [uploadBusy, setUploadBusy] = useState(false);

  const fieldErrors = state.fieldErrors ?? {};
  const readOnly = !experience.canEdit;
  const facultyChanges = latestFacultyChanges(experience.timeline, experience.latestReason);
  const showProjectTitle = workNature !== "" && workNature !== "training_only";

  useEffect(() => {
    const suggested = weeksBetweenDates(startDate, endDate);
    if (suggested !== null) setDurationWeeks(String(suggested));
  }, [startDate, endDate]);

  return (
    <div className="min-w-0">
      <BackLink href={`/student/experience/${experience.id}`} label="Back to report" />

      <CanvasPageHeader
        divider={false}
        eyebrow={EXPERIENCE_STATUS_LABEL[experience.status]}
        title={
          experience.status === "changes_requested"
            ? "Update your experience report"
            : "Share your internship experience"
        }
        lead="Help future students understand what this internship was really like. Save a draft anytime, attach your certificate, then submit for faculty verification."
      />

      {experience.status === "changes_requested" && facultyChanges && (
        <div className="mt-6 min-w-0">
          <QuoteBlock label="Faculty feedback" variant="attention">
            {facultyChanges}
          </QuoteBlock>
          <p className={cn(BODY_LEAD, "mt-3")}>
            Update the relevant sections below, keep or replace your certificate if needed, then
            resubmit for verification.
          </p>
        </div>
      )}

      {state.ok && state.message && (
        <InsetPanel variant="mint" className="mt-6">
          <p className="text-sm text-[var(--il-moss)]" role="status">
            {state.message}
          </p>
        </InsetPanel>
      )}

      {!state.ok && state.message && Object.keys(fieldErrors).length === 0 && (
        <InsetPanel variant="error" className="mt-6">
          <p className="text-sm font-medium text-[var(--il-error)]" role="alert">
            {state.message}
          </p>
        </InsetPanel>
      )}

      <form action={formAction} className="mt-6 min-w-0" noValidate>
        <input type="hidden" name="experienceId" value={experience.id} />

        <div className="grid min-w-0 gap-6 lg:grid-cols-[12.5rem_minmax(0,1fr)] lg:gap-6">
          {!readOnly && <FormSectionNav sections={FORM_SECTIONS} />}

          <div className="min-w-0 space-y-2 sm:space-y-3">
            <FormSectionShell tinted={false}>
              <ApplicationFormSection
                id="experience-identity"
                title="Internship identity"
                description="These details come from your approved internship and stay fixed for this report."
              >
                <ApplicationFormSpan>
                  <div className="flex min-w-0 gap-3.5 border-b border-[var(--il-border)] pb-4">
                    <CompanyMark name={experience.companyName} size="md" />
                    <div className="min-w-0">
                      <p className={cn("break-words", CARD_COMPANY)}>{experience.companyName}</p>
                      <p className={cn("mt-0.5 break-words", CARD_ROLE)}>{experience.roleTitle}</p>
                    </div>
                  </div>
                </ApplicationFormSpan>

                <ApplicationField label="Domain" htmlFor="domain" required error={fieldErrors.domain}>
                  <select
                    id="domain"
                    name="domain"
                    defaultValue={defaults.domain}
                    disabled={readOnly}
                    className={cn(CONTROL, MOTION, FOCUS_RING, fieldErrors.domain && "border-red-400")}
                  >
                    <option value="">Select a domain…</option>
                    {DOMAINS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </ApplicationField>

                <ApplicationField
                  label="Work mode"
                  htmlFor="workMode"
                  required
                  error={fieldErrors.workMode}
                >
                  <select
                    id="workMode"
                    name="workMode"
                    value={workMode}
                    disabled={readOnly}
                    onChange={(event) => setWorkMode(event.target.value as typeof workMode)}
                    className={cn(CONTROL, MOTION, FOCUS_RING, fieldErrors.workMode && "border-red-400")}
                  >
                    <option value="">Select work mode…</option>
                    {WORK_MODES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </ApplicationField>

                <ApplicationField
                  label="Location"
                  htmlFor="location"
                  error={fieldErrors.location}
                  hint={
                    workMode === "remote"
                      ? "Optional for remote internships."
                      : "City or office location for on-site or hybrid roles."
                  }
                >
                  <input
                    id="location"
                    name="location"
                    type="text"
                    defaultValue={defaults.location}
                    disabled={readOnly}
                    className={cn(CONTROL, MOTION, FOCUS_RING, fieldErrors.location && "border-red-400")}
                  />
                </ApplicationField>

                <ApplicationField
                  label="Start date"
                  htmlFor="startDate"
                  required
                  error={fieldErrors.startDate}
                >
                  <input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={startDate}
                    disabled={readOnly}
                    onChange={(event) => setStartDate(event.target.value)}
                    className={cn(CONTROL, MOTION, FOCUS_RING, fieldErrors.startDate && "border-red-400")}
                  />
                </ApplicationField>

                <ApplicationField
                  label="End date"
                  htmlFor="endDate"
                  required
                  error={fieldErrors.endDate}
                >
                  <input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={endDate}
                    disabled={readOnly}
                    onChange={(event) => setEndDate(event.target.value)}
                    className={cn(CONTROL, MOTION, FOCUS_RING, fieldErrors.endDate && "border-red-400")}
                  />
                </ApplicationField>

                <ApplicationField
                  label="Duration (weeks)"
                  htmlFor="durationWeeks"
                  required
                  error={fieldErrors.durationWeeks}
                >
                  <input
                    id="durationWeeks"
                    name="durationWeeks"
                    type="number"
                    min={1}
                    max={52}
                    value={durationWeeks}
                    disabled={readOnly}
                    onChange={(event) => setDurationWeeks(event.target.value.replace(/\D/g, ""))}
                    className={cn(
                      CONTROL,
                      MOTION,
                      FOCUS_RING,
                      fieldErrors.durationWeeks && "border-red-400",
                    )}
                  />
                </ApplicationField>

                <ApplicationField label="Fee (₹)" htmlFor="feeAmount" error={fieldErrors.feeAmount}>
                  <input
                    id="feeAmount"
                    name="feeAmount"
                    type="number"
                    min={0}
                    defaultValue={defaults.feeAmount}
                    disabled={readOnly}
                    className={cn(CONTROL, MOTION, FOCUS_RING, fieldErrors.feeAmount && "border-red-400")}
                  />
                </ApplicationField>

                <ApplicationField
                  label="Stipend (₹)"
                  htmlFor="stipendAmount"
                  error={fieldErrors.stipendAmount}
                >
                  <input
                    id="stipendAmount"
                    name="stipendAmount"
                    type="number"
                    min={0}
                    defaultValue={defaults.stipendAmount}
                    disabled={readOnly}
                    className={cn(
                      CONTROL,
                      MOTION,
                      FOCUS_RING,
                      fieldErrors.stipendAmount && "border-red-400",
                    )}
                  />
                </ApplicationField>
              </ApplicationFormSection>
            </FormSectionShell>

            <FormSectionShell tinted>
              <ApplicationFormSection
                id="experience-work"
                title="Actual internship work"
                description="Describe what you really did — this becomes the core of your Reality Card."
              >
                <ApplicationField
                  label="Work nature"
                  htmlFor="workNature"
                  required
                  error={fieldErrors.workNature}
                >
                  <select
                    id="workNature"
                    name="workNature"
                    value={workNature}
                    disabled={readOnly}
                    onChange={(event) =>
                      setWorkNature(event.target.value as typeof workNature)
                    }
                    className={cn(CONTROL, MOTION, FOCUS_RING, fieldErrors.workNature && "border-red-400")}
                  >
                    <option value="">Select work nature…</option>
                    {WORK_NATURES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </ApplicationField>

                {showProjectTitle && (
                  <ApplicationField
                    label="Project title"
                    htmlFor="projectTitle"
                    required
                    error={fieldErrors.projectTitle}
                  >
                    <input
                      id="projectTitle"
                      name="projectTitle"
                      type="text"
                      defaultValue={defaults.projectTitle}
                      disabled={readOnly}
                      className={cn(
                        CONTROL,
                        MOTION,
                        FOCUS_RING,
                        fieldErrors.projectTitle && "border-red-400",
                      )}
                    />
                  </ApplicationField>
                )}

                <ApplicationFormSpan>
                  <ApplicationField
                    label="Work summary and responsibilities"
                    htmlFor="workSummary"
                    required
                    error={fieldErrors.workSummary}
                  >
                    <textarea
                      id="workSummary"
                      name="workSummary"
                      rows={7}
                      defaultValue={defaults.workSummary}
                      disabled={readOnly}
                      className={cn(
                        CONTROL,
                        "min-h-[10rem] resize-y py-2.5",
                        MOTION,
                        FOCUS_RING,
                        fieldErrors.workSummary && "border-red-400",
                      )}
                    />
                  </ApplicationField>
                </ApplicationFormSpan>

                <TagListInput
                  name="technologies"
                  label="Technologies used"
                  htmlFor="experience-technologies"
                  initialValues={defaults.technologies}
                  error={fieldErrors.technologies}
                  disabled={readOnly}
                  required
                  className="sm:col-span-2"
                  placeholder="e.g. Python, React, Docker"
                />
              </ApplicationFormSection>
            </FormSectionShell>

            <FormSectionShell tinted={false}>
              <ApplicationFormSection
                id="experience-skills-mentorship"
                title="Skills and mentorship"
                description="Show how the internship changed your skills and what support was available."
              >
                <TagListInput
                  name="skillsBefore"
                  label="Skills before the internship"
                  htmlFor="experience-skills-before"
                  initialValues={defaults.skillsBefore}
                  error={fieldErrors.skillsBefore}
                  disabled={readOnly}
                  className="sm:col-span-2"
                  placeholder="Skills you already had"
                  emptyMessage="Optional — add skills you started with."
                />

                <TagListInput
                  name="skillsAfter"
                  label="Skills gained during the internship"
                  htmlFor="experience-skills-after"
                  initialValues={defaults.skillsAfter}
                  error={fieldErrors.skillsAfter}
                  disabled={readOnly}
                  required
                  className="sm:col-span-2"
                  placeholder="Skills you developed"
                />

                <ApplicationField
                  label="Was a mentor available?"
                  htmlFor="hadMentor"
                  required
                  error={fieldErrors.hadMentor}
                >
                  <select
                    id="hadMentor"
                    name="hadMentor"
                    value={hadMentor}
                    disabled={readOnly}
                    onChange={(event) =>
                      setHadMentor(event.target.value as typeof hadMentor)
                    }
                    className={cn(CONTROL, MOTION, FOCUS_RING, fieldErrors.hadMentor && "border-red-400")}
                  >
                    <option value="">Select…</option>
                    <option value="true">Yes, I had a mentor</option>
                    <option value="false">No dedicated mentor</option>
                  </select>
                </ApplicationField>

                {hadMentor === "true" && (
                  <ApplicationField
                    label="Mentor interaction frequency"
                    htmlFor="mentorFrequency"
                    required
                    error={fieldErrors.mentorFrequency}
                  >
                    <select
                      id="mentorFrequency"
                      name="mentorFrequency"
                      defaultValue={defaults.mentorFrequency}
                      disabled={readOnly}
                      className={cn(
                        CONTROL,
                        MOTION,
                        FOCUS_RING,
                        fieldErrors.mentorFrequency && "border-red-400",
                      )}
                    >
                      <option value="">Select frequency…</option>
                      {MENTOR_FREQUENCIES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </ApplicationField>
                )}
              </ApplicationFormSection>
            </FormSectionShell>

            <FormSectionShell tinted>
              <ApplicationFormSection
                id="experience-application-pathway"
                title="Application pathway"
                description="Help future students understand how you secured this internship."
              >
                <ApplicationField
                  label="Application source"
                  htmlFor="applicationSource"
                  required
                  error={fieldErrors.applicationSource}
                >
                  <select
                    id="applicationSource"
                    name="applicationSource"
                    defaultValue={defaults.applicationSource}
                    disabled={readOnly}
                    className={cn(
                      CONTROL,
                      MOTION,
                      FOCUS_RING,
                      fieldErrors.applicationSource && "border-red-400",
                    )}
                  >
                    <option value="">Select how you applied…</option>
                    {APPLICATION_SOURCES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </ApplicationField>

                <ApplicationFormSpan>
                  <ApplicationField
                    label="Application process and tips"
                    htmlFor="applicationProcess"
                    required
                    error={fieldErrors.applicationProcess}
                  >
                    <textarea
                      id="applicationProcess"
                      name="applicationProcess"
                      rows={5}
                      defaultValue={defaults.applicationProcess}
                      disabled={readOnly}
                      className={cn(
                        CONTROL,
                        "min-h-[8rem] resize-y py-2.5",
                        MOTION,
                        FOCUS_RING,
                        fieldErrors.applicationProcess && "border-red-400",
                      )}
                    />
                  </ApplicationField>
                </ApplicationFormSpan>
              </ApplicationFormSection>
            </FormSectionShell>

            <FormSectionShell tinted={false}>
              <ApplicationFormSection
                id="experience-guidance"
                title="Student guidance"
                description="Tell future students who would benefit from this internship."
              >
                <ApplicationField
                  label="Beginner friendly?"
                  htmlFor="beginnerFriendly"
                  required
                  error={fieldErrors.beginnerFriendly}
                >
                  <select
                    id="beginnerFriendly"
                    name="beginnerFriendly"
                    defaultValue={defaults.beginnerFriendly}
                    disabled={readOnly}
                    className={cn(
                      CONTROL,
                      MOTION,
                      FOCUS_RING,
                      fieldErrors.beginnerFriendly && "border-red-400",
                    )}
                  >
                    <option value="">Select…</option>
                    <option value="true">Yes, suitable for beginners</option>
                    <option value="false">Not really for beginners</option>
                  </select>
                </ApplicationField>

                <ApplicationFormSpan>
                  <ApplicationField
                    label="Who would benefit from this internship?"
                    htmlFor="suitsWhom"
                    required
                    error={fieldErrors.suitsWhom}
                  >
                    <textarea
                      id="suitsWhom"
                      name="suitsWhom"
                      rows={4}
                      defaultValue={defaults.suitsWhom}
                      disabled={readOnly}
                      className={cn(
                        CONTROL,
                        "min-h-[7rem] resize-y py-2.5",
                        MOTION,
                        FOCUS_RING,
                        fieldErrors.suitsWhom && "border-red-400",
                      )}
                    />
                  </ApplicationField>
                </ApplicationFormSpan>
              </ApplicationFormSection>
            </FormSectionShell>

            <FormSectionShell tinted>
              <ApplicationFormSection
                id="experience-certificate"
                title="Certificate"
                description="Faculty use your certificate to verify the internship. It is never published on your Reality Card."
              >
                <ApplicationFormSpan>
                  <CertificateUploadField
                    experienceId={experience.id}
                    initialEvidence={experience.certificate}
                    error={fieldErrors.certificate}
                    disabled={readOnly}
                    onEvidenceChange={(evidenceId) => setCertificateAttached(Boolean(evidenceId))}
                    onBusyChange={setUploadBusy}
                  />
                </ApplicationFormSpan>
              </ApplicationFormSection>
            </FormSectionShell>

            {!readOnly && (
              <StickyFormActions
                hint="Submit stays disabled until a certificate is attached and every required field is complete."
              >
                <ExperienceFormActions
                  canSubmit={experience.canSubmit}
                  hasCertificate={certificateAttached}
                  status={experience.status}
                  disabled={uploadBusy}
                />
              </StickyFormActions>
            )}

            {readOnly && (
              <p className={cn("text-sm", MUTED)}>
                This report can no longer be edited here.{" "}
                <Link
                  href={`/student/experience/${experience.id}`}
                  className={cn("font-semibold underline-offset-2 hover:underline", INK)}
                >
                  View report details
                </Link>
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
