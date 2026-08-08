"use client";



import Link from "next/link";

import { useActionState, useEffect, useState } from "react";



import { saveApplicationAction } from "@/app/(app)/student/application/actions";

import { ApplicationField } from "@/components/application/ApplicationField";

import {

  ApplicationFormSection,

  ApplicationFormSpan,

} from "@/components/application/ApplicationFormSection";

import { ApplicationFormActions } from "@/components/application/ApplicationFormActions";

import { CompanyAutocomplete } from "@/components/application/CompanyAutocomplete";

import {

  applicationToFormDefaults,

  weeksBetweenDates,

} from "@/components/application/form-utils";

import { TechnologiesInput } from "@/components/application/TechnologiesInput";

import { OfferLetterUploadField } from "@/components/forms/OfferLetterUploadField";

import {

  CONTROL,

  EXPLORE_PAGE,

  FOCUS_RING,

  INK,

  INSET_ERROR,

  INSET_MINT,

  MOTION,

  MUTED,

} from "@/components/student/student-ui";

import {

  BackLink,

  CanvasPageHeader,

  FormSectionNav,

  StickyFormActions,

} from "@/components/student/primitives";

import {

  APPLICATION_SOURCES,

  APPLICATION_STATUS_LABEL,

  DOMAINS,

  WORK_MODES,

} from "@/lib/constants/options";

import { cn } from "@/lib/cn";

import { initialActionState, type ApplicationDetail } from "@/types/contracts";



const FORM_SECTIONS = [

  { id: "application-company-role", label: "Company and role" },

  { id: "application-internship-details", label: "Internship details" },

  { id: "application-compensation", label: "Compensation" },

  { id: "application-planned-work", label: "Planned work" },

  { id: "application-source-offer", label: "Source and offer" },

];



export function ApplicationForm({ application }: { application: ApplicationDetail }) {

  const defaults = applicationToFormDefaults(application);

  const [state, formAction] = useActionState(saveApplicationAction, initialActionState);

  const [startDate, setStartDate] = useState(defaults.startDate);

  const [endDate, setEndDate] = useState(defaults.endDate);

  const [durationWeeks, setDurationWeeks] = useState(defaults.durationWeeks);

  const [workMode, setWorkMode] = useState(defaults.workMode);

  const [companyBusy, setCompanyBusy] = useState(false);

  const [uploadBusy, setUploadBusy] = useState(false);



  useEffect(() => {

    const suggested = weeksBetweenDates(startDate, endDate);

    if (suggested !== null) {

      setDurationWeeks(String(suggested));

    }

  }, [startDate, endDate]);



  const fieldErrors = state.fieldErrors ?? {};

  const readOnly = !application.canEdit;

  const isNew =

    !application.companyName.trim() && !application.roleTitle.trim();



  return (

    <div className={cn(EXPLORE_PAGE, "min-w-0")}>

      <BackLink href={`/student/application/${application.id}`} label="Back to application" />

      <CanvasPageHeader
        eyebrow={APPLICATION_STATUS_LABEL[application.status]}
        title={isNew ? "New internship application" : "Edit internship application"}
        lead="Save a draft while you gather details, then submit for faculty approval when required fields are complete."
        divider={false}
        className="mt-3"
      />



      {state.ok && state.message && (

        <p

          className={cn(INSET_MINT, "mt-6 px-4 py-3 text-sm text-[var(--il-moss)]")}

          role="status"

        >

          {state.message}

        </p>

      )}



      {!state.ok && state.message && Object.keys(fieldErrors).length === 0 && (

        <p

          className={cn(INSET_ERROR, "mt-6 px-4 py-3 text-sm font-medium text-[var(--il-error)]")}

          role="alert"

        >

          {state.message}

        </p>

      )}



      <form action={formAction} className="mt-6 min-w-0" noValidate>
        <input type="hidden" name="applicationId" value={application.id} />

        <div className="lg:grid lg:grid-cols-[12.5rem_minmax(0,1fr)] lg:items-start lg:gap-6">

          <FormSectionNav sections={FORM_SECTIONS} />



          <div className="min-w-0 space-y-6 sm:space-y-8">

            <ApplicationFormSection

              id="application-company-role"

              title="Company and role"

              description="Tell faculty where you will intern and what role you have been offered."

              variant="open"

            >

              <ApplicationFormSpan>

                <CompanyAutocomplete

                  initialCompanyId={defaults.companyId}

                  initialCompanyName={defaults.companyName}

                  error={fieldErrors.companyId}

                  disabled={readOnly}

                  onBusyChange={setCompanyBusy}

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

                  className={cn(

                    CONTROL,

                    MOTION,

                    FOCUS_RING,

                    fieldErrors.roleTitle && "border-[var(--il-error)]",

                  )}

                />

              </ApplicationField>



              <ApplicationField label="Domain" htmlFor="domain" required error={fieldErrors.domain}>

                <select

                  id="domain"

                  name="domain"

                  defaultValue={defaults.domain}

                  disabled={readOnly}

                  className={cn(

                    CONTROL,

                    MOTION,

                    FOCUS_RING,

                    fieldErrors.domain && "border-[var(--il-error)]",

                  )}

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

              variant="grouped"

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

                  className={cn(

                    CONTROL,

                    MOTION,

                    FOCUS_RING,

                    fieldErrors.workMode && "border-[var(--il-error)]",

                  )}

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

                  className={cn(

                    CONTROL,

                    MOTION,

                    FOCUS_RING,

                    fieldErrors.location && "border-[var(--il-error)]",

                  )}

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

                  className={cn(

                    CONTROL,

                    MOTION,

                    FOCUS_RING,

                    fieldErrors.startDate && "border-[var(--il-error)]",

                  )}

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

                  className={cn(

                    CONTROL,

                    MOTION,

                    FOCUS_RING,

                    fieldErrors.endDate && "border-[var(--il-error)]",

                  )}

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

                    fieldErrors.durationWeeks && "border-[var(--il-error)]",

                  )}

                />

              </ApplicationField>

            </ApplicationFormSection>



            <ApplicationFormSection

              id="application-compensation"

              title="Compensation"

              description="Whole rupee amounts. Leave blank when there is no fee or stipend."

              variant="open"

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

                  className={cn(

                    CONTROL,

                    MOTION,

                    FOCUS_RING,

                    fieldErrors.feeAmount && "border-[var(--il-error)]",

                  )}

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

                    fieldErrors.stipendAmount && "border-[var(--il-error)]",

                  )}

                />

              </ApplicationField>

            </ApplicationFormSection>



            <ApplicationFormSection

              id="application-planned-work"

              title="Planned work and technologies"

              description="Help faculty understand what you expect to work on."

              variant="grouped"

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

                      fieldErrors.expectedWork && "border-[var(--il-error)]",

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

              title="Application source and offer"

              description="How you secured the internship. Attach an offer letter if the company provided one."

              variant="open"

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

                    fieldErrors.applicationSource && "border-[var(--il-error)]",

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
                  onBusyChange={setUploadBusy}
                />

              </ApplicationFormSpan>

            </ApplicationFormSection>

          </div>

        </div>



        {!readOnly && (

          <StickyFormActions

            hint={
              <>
                Save a draft anytime. Submit when every required field is complete. Attach an offer
                letter if the company provided one.
              </>
            }
          >
            <ApplicationFormActions
              canSubmit={application.canSubmit}
              disabled={companyBusy || uploadBusy}
            />

          </StickyFormActions>

        )}



        {readOnly && (

          <p className={cn("mt-6 text-sm", MUTED)}>

            This application can no longer be edited here.{" "}

            <Link

              href={`/student/application/${application.id}`}

              className={cn("font-semibold underline-offset-2 hover:underline", INK)}

            >

              View application details

            </Link>

          </p>

        )}

      </form>

    </div>

  );

}
