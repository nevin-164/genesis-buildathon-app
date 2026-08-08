"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";

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
import { ChevronRightIcon } from "@/components/explore/explore-icons";
import { exploreDisplay } from "@/components/explore/explore-font";
import {
  CARD_COMPANY,
  CARD_ROLE,
  CONTROL,
  DISPLAY_HERO,
  DISPLAY_SECTION,
  FOCUS_RING,
  INK,
  MOTION,
  MUTED,
  PANEL,
} from "@/components/explore/explore-ui";
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

  const fieldErrors = state.fieldErrors ?? {};
  const readOnly = !experience.canEdit;
  const facultyChanges = latestFacultyChanges(experience.timeline, experience.latestReason);
  const showProjectTitle = workNature !== "" && workNature !== "training_only";

  useEffect(() => {
    const suggested = weeksBetweenDates(startDate, endDate);
    if (suggested !== null) setDurationWeeks(String(suggested));
  }, [startDate, endDate]);

  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      <Link
        href={`/student/experience/${experience.id}`}
        className={cn(
          "inline-flex scroll-mt-20 items-center gap-1 text-sm font-medium sm:scroll-mt-24",
          INK,
          "hover:text-[#2d5038] hover:underline",
          MOTION,
          FOCUS_RING,
        )}
      >
        <ChevronRightIcon className="rotate-180" aria-hidden="true" />
        Back to report
      </Link>

      <header className={cn(PANEL, "relative min-w-0 overflow-hidden bg-[#f4f8f5] p-4 sm:p-5")}>
        <div
          className="pointer-events-none absolute bottom-4 left-0 top-4 w-1 rounded-full bg-[#c8ef5a]"
          aria-hidden="true"
        />
        <div className="min-w-0 pl-3">
          <p className={cn("text-xs font-medium tracking-wide", MUTED)}>
            {EXPERIENCE_STATUS_LABEL[experience.status]}
          </p>
          <h1 className={cn(exploreDisplay.className, DISPLAY_HERO, "mt-1 text-[1.625rem] sm:text-[1.875rem]")}>
            {experience.status === "changes_requested"
              ? "Update your experience report"
              : "Share your internship experience"}
          </h1>
          <p className={cn("mt-2 max-w-2xl text-sm leading-relaxed sm:text-[15px]", MUTED)}>
            Help future students understand what this internship was really like. Save a draft
            anytime, attach your certificate, then submit for faculty verification.
          </p>
        </div>
      </header>

      {experience.status === "changes_requested" && facultyChanges && (
        <section
          className={cn(PANEL, "min-w-0 border-amber-200/90 bg-amber-50/60 p-4 sm:p-5")}
          aria-labelledby="experience-changes-heading"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-900">
            Changes requested
          </p>
          <h2 id="experience-changes-heading" className={cn("mt-1 text-base", DISPLAY_SECTION)}>
            Faculty feedback
          </h2>
          <p className="mt-2 text-sm leading-relaxed break-words text-[#3d4a42]">
            {facultyChanges}
          </p>
          <p className={cn("mt-3 text-sm leading-relaxed", MUTED)}>
            Update the relevant sections below, keep or replace your certificate if needed, then
            resubmit for verification.
          </p>
        </section>
      )}

      {state.ok && state.message && (
        <p
          className="rounded-xl border border-[#b8d4bc] bg-[#ecf8ee] px-4 py-3 text-sm text-[#2d5038]"
          role="status"
        >
          {state.message}
        </p>
      )}

      {!state.ok && state.message && Object.keys(fieldErrors).length === 0 && (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          role="alert"
        >
          {state.message}
        </p>
      )}

      <form action={formAction} className="min-w-0 space-y-4 sm:space-y-5" noValidate>
        <input type="hidden" name="experienceId" value={experience.id} />

        <ApplicationFormSection
          id="experience-identity"
          title="Internship identity"
          description="These details come from your approved internship and stay fixed for this report."
        >
          <ApplicationFormSpan>
            <div className={cn(PANEL, "min-w-0 bg-[#fafbf9] p-4 sm:p-5")}>
              <div className="flex min-w-0 gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0f1812] text-xs font-bold text-[#c8ef5a]"
                  aria-hidden="true"
                >
                  {experience.companyName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className={cn("break-words", CARD_COMPANY, exploreDisplay.className)}>
                    {experience.companyName}
                  </p>
                  <p className={cn("mt-0.5 break-words", CARD_ROLE)}>{experience.roleTitle}</p>
                </div>
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
            />
          </ApplicationFormSpan>
        </ApplicationFormSection>

        {!readOnly && (
          <section
            className={cn(
              PANEL,
              "flex min-w-0 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5",
            )}
            aria-label="Save or submit experience report"
          >
            <p className={cn("text-sm", MUTED)}>
              Submit stays disabled until a certificate is attached and every required field is
              complete.
            </p>
            <ExperienceFormActions
              canSubmit={experience.canSubmit}
              hasCertificate={certificateAttached}
              status={experience.status}
            />
          </section>
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
      </form>
    </div>
  );
}
