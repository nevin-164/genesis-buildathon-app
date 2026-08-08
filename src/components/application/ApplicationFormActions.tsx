"use client";



import { useFormStatus } from "react-dom";



import { BTN_PRIMARY, BTN_SECONDARY, FOCUS_RING, MOTION } from "@/components/student/student-ui";

import { cn } from "@/lib/cn";



export function ApplicationFormActions({

  canSubmit,

  disabled = false,

}: {

  canSubmit: boolean;

  disabled?: boolean;

}) {

  const { pending } = useFormStatus();

  const formDisabled = pending || disabled;

  const submitDisabled = formDisabled || !canSubmit;



  return (

    <>

      <button

        type="submit"

        name="intent"

        value="draft"

        disabled={formDisabled}

        className={cn(

          BTN_SECONDARY,

          "min-h-11 w-full px-5 sm:w-auto",

          MOTION,

          FOCUS_RING,

          formDisabled && "cursor-not-allowed opacity-60",

        )}

      >

        {pending ? "Saving…" : "Save draft"}

      </button>

      <button

        type="submit"

        name="intent"

        value="submit"

        disabled={submitDisabled}

        className={cn(

          BTN_PRIMARY,

          "min-h-11 w-full px-5 sm:w-auto",

          MOTION,

          FOCUS_RING,

          submitDisabled && "cursor-not-allowed opacity-60",

        )}

      >

        {pending ? "Submitting…" : "Submit for approval"}

      </button>

    </>

  );

}
