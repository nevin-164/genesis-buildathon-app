"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";

import { saveApplicationAction } from "@/app/(app)/student/application/actions";
import { ApplicationField } from "@/components/application/ApplicationField";
import {
  ApplicationFormSection,
  ApplicationFormSpan,
} from "@/components/application/ApplicationFormSection";
import { CompanyAutocomplete } from "@/components/application/CompanyAutocomplete";
import {
  applicationToFormDefaults,
  weeksBetweenDates,
} from "@/components/application/form-utils";
import { TechnologiesInput } from "@/components/application/TechnologiesInput";
import { OfferLetterUploadField } from "@/components/forms/OfferLetterUploadField";
import { ChevronRightIcon } from "@/components/explore/explore-icons";
import { exploreDisplay } from "@/components/explore/explore-font";
import {
  CONTROL,
  DISPLAY_HERO,
  FOCUS_RING,
  INK,
  MOTION,
  MUTED,
  PANEL,
} from "@/components/explore/explore-ui";
import { ApplicationFormActions } from "@/components/application/ApplicationFormActions";
import {
  APPLICATION_SOURCES,
  APPLICATION_STATUS_LABEL,
  DOMAINS,
  WORK_MODES,
} from "@/lib/constants/options";
import { cn } from "@/lib/cn";
import { initialActionState, type ApplicationDetail } from "@/types/contracts";

export function ApplicationForm({ application }: { application: ApplicationDetail }) {
  const defaults = applicationToFormDefaults(application);
  const [state, formAction] = useActionState(saveApplicationAction, initialActionState);
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [durationWeeks, setDurationWeeks] = useState(defaults.durationWeeks);
  const [workMode, setWorkMode] = useState(defaults.workMode);

  useEffect(() => {
    const suggested = weeksBetweenDates(startDate, endDate);
    if (suggested !== null) {
      setDurationWeeks(String(suggested));
    }
  }, [startDate, endDate]);

  const fieldErrors = state.fieldErrors ?? {};
  const readOnly = !application.canEdit;

  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      <Link
        href={`/student/application/${application.id}`}
        className={cn(
          "inline-flex scroll-mt-20 items-center gap-1 text-sm font-medium sm:scroll-mt-24",
          INK,
          "hover:text-[#2d5038] hover:underline",
          MOTION,
          FOCUS_RING,
        )}
      >
        <ChevronRightIcon className="rotate-180" aria-hidden="true" />
        Back to application
      </Link>

      <header className={cn(PANEL, "relative min-w-0 overflow-hidden bg-[#f4f8f5] p-4 sm:p-5")}>
        <div
          className="pointer-events-none absolute bottom-4 left-0 top-4 w-1 rounded-full bg-[#c8ef5a]"
          aria-hidden="true"
        />
        <div className="min-w-0 pl-3">
          <p className={cn("text-xs font-medium tracking-wide", MUTED)}>
            {APPLICATION_STATUS_LABEL[application.status]}
          </p>
          <h1 className={cn(exploreDisplay.className, DISPLAY_HERO, "mt-1 text-[1.625rem] sm:text-[1.875rem]")}>
            {application.companyName.trim() && application.roleTitle.trim()
              ? "Edit internship application"
              : "New internship application"}
          </h1>
          <p className={cn("mt-2 max-w-2xl text-sm leading-relaxed sm:text-[15px]", MUTED)}>
            Save a draft while you gather details, then submit for faculty approval when
            everything — including your offer letter — is ready.
          </p>
        </div>
      </header>

      {state.ok && state.message && (
        <p
          className="rounded-xl border border-[#b8d4bc] bg-[#ecf8ee] px-4 py-3 text-sm text-[#2d5038]"
          role="status"
        >
          {state.message}
        </p>
      )}

      {!state.ok && state.message && Object.keys(fieldErrors).length === 0 && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
          {state.message}
        </p>
      )}

      <form action={formAction} className="min-w-0 space-y-4 sm:space-y-5" noValidate>
        <input type="hidden" name="applicationId" value={application.id} />

        <ApplicationFormSection
          id="application-company-role"
          title="Company and role"
          description="Tell faculty where you will intern and what role you have been offered."
        >
          <ApplicationFormSpan>
            <CompanyAutocomplete
              initialCompanyId={defaults.companyId}
              initialCompanyName={defaults.companyName}
              error={fieldErrors.companyId}
              disabled={readOnly}
            />
          </ApplicationFormSpan>

          <ApplicationField
            label="Role title"
            htmlFor="roleTitle"
            required
            error={fieldErrors.roleTitle}
          >
            <input
              id="roleTitle"
              name="roleTitle"
              type="text"
              defaultValue={defaults.roleTitle}
              disabled={readOnly}
              placeholder="e.g. Frontend Developer Intern"
              className={cn(CONTROL, MOTION, FOCUS_RING, fieldErrors.roleTitle && "border-red-400")}
            />
          </ApplicationField>

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
        </ApplicationFormSection>

        <ApplicationFormSection
          id="application-internship-details"
          title="Internship details"
          description="Dates and work arrangement for the planned internship."
        >
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
              placeholder={workMode === "remote" ? "Remote" : "e.g. Kochi"}
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
            hint="Auto-calculated from your dates — adjust if your internship length differs."
          >
            <input
              id="durationWeeks"
              name="durationWeeks"
              type="number"
              min={1}
              max={52}
              inputMode="numeric"
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
        </ApplicationFormSection>

        <ApplicationFormSection
          id="application-compensation"
          title="Compensation"
          description="Whole rupee amounts. Leave blank when there is no fee or stipend."
        >
          <ApplicationField
            label="Fee (₹)"
            htmlFor="feeAmount"
            error={fieldErrors.feeAmount}
            hint="Amount the student pays to the company, if any."
          >
            <input
              id="feeAmount"
              name="feeAmount"
              type="number"
              min={0}
              inputMode="numeric"
              defaultValue={defaults.feeAmount}
              disabled={readOnly}
              placeholder="0"
              className={cn(CONTROL, MOTION, FOCUS_RING, fieldErrors.feeAmount && "border-red-400")}
            />
          </ApplicationField>

          <ApplicationField
            label="Stipend (₹)"
            htmlFor="stipendAmount"
            error={fieldErrors.stipendAmount}
            hint="Monthly or total stipend in whole rupees, if offered."
          >
            <input
              id="stipendAmount"
              name="stipendAmount"
              type="number"
              min={0}
              inputMode="numeric"
              defaultValue={defaults.stipendAmount}
              disabled={readOnly}
              placeholder="0"
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
          id="application-planned-work"
          title="Planned work and technologies"
          description="Help faculty understand what you expect to work on."
        >
          <ApplicationFormSpan>
            <ApplicationField
              label="Expected work and responsibilities"
              htmlFor="expectedWork"
              required
              error={fieldErrors.expectedWork}
            >
              <textarea
                id="expectedWork"
                name="expectedWork"
                rows={6}
                defaultValue={defaults.expectedWork}
                disabled={readOnly}
                placeholder="Describe the projects, tasks, or responsibilities you expect during the internship."
                className={cn(
                  CONTROL,
                  "min-h-[9rem] resize-y py-2.5",
                  MOTION,
                  FOCUS_RING,
                  fieldErrors.expectedWork && "border-red-400",
                )}
              />
            </ApplicationField>
          </ApplicationFormSpan>

          <TechnologiesInput
            initialValues={defaults.technologies}
            error={fieldErrors.technologies}
            disabled={readOnly}
          />
        </ApplicationFormSection>

        <ApplicationFormSection
          id="application-source-offer"
          title="Application source and offer letter"
          description="How you secured the internship and proof of the offer."
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
            <OfferLetterUploadField
              applicationId={application.id}
              initialEvidence={application.offerLetter}
              error={fieldErrors.offerLetter}
              disabled={readOnly}
            />
          </ApplicationFormSpan>
        </ApplicationFormSection>

        {!readOnly && (
          <section
            className={cn(PANEL, "sticky bottom-3 z-10 flex min-w-0 flex-col gap-3 bg-white/95 p-4 backdrop-blur-sm sm:static sm:flex-row sm:items-center sm:justify-between sm:p-5")}
            aria-label="Save or submit application"
          >
            <p className={cn("text-sm", MUTED)}>
              Save a draft anytime. Submit only when every required field and your offer letter
              are complete.
            </p>
            <ApplicationFormActions canSubmit={application.canSubmit} />
          </section>
        )}

        {readOnly && (
          <p className={cn("text-sm", MUTED)}>
            This application can no longer be edited here.{" "}
            <Link href={`/student/application/${application.id}`} className={cn("font-semibold underline-offset-2 hover:underline", INK)}>
              View application details
            </Link>
          </p>
        )}
      </form>
    </div>
  );
}
