"use client";



import { useActionState } from "react";

import { useFormStatus } from "react-dom";



import { createExperienceDraftAction } from "@/app/(app)/student/experience/actions";

import {

  BTN_LIME,

  FOCUS_RING,

  HOVER_LIFT,

  META,

  MOTION,

} from "@/components/student/student-ui";

import { cn } from "@/lib/cn";

import { initialActionState, type ContributableApplication } from "@/types/contracts";



function StartReportButton() {

  const { pending } = useFormStatus();



  return (

    <button

      type="submit"

      disabled={pending}

      className={cn(

        BTN_LIME,

        "inline-flex min-h-11 w-full items-center justify-center px-6 font-bold sm:w-auto",

        MOTION,

        HOVER_LIFT,

        FOCUS_RING,

        pending && "cursor-not-allowed opacity-60",

      )}

    >

      {pending ? "Starting report…" : "Start report"}

    </button>

  );

}



export function StartExperienceDraftForm({

  contributable,

}: {

  contributable: ContributableApplication;

}) {

  const [state, formAction] = useActionState(createExperienceDraftAction, initialActionState);



  return (

    <form action={formAction} className="min-w-0 lg:flex lg:flex-col lg:items-end">

      <input type="hidden" name="applicationId" value={contributable.applicationId} />



      {!state.ok && state.message && (

        <p className="mb-3 text-sm font-medium text-[var(--il-error)] lg:text-right" role="alert">

          {state.message}

        </p>

      )}



      <StartReportButton />



      <p className={cn(META, "mt-2 max-w-xs lg:text-right")}>

        One report per approved internship. You can save a draft and return anytime.

      </p>

    </form>

  );

}
