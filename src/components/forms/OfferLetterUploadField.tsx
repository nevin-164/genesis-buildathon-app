"use client";



import { useRef, useState, useTransition, useEffect } from "react";



import {

  confirmOfferLetterUploadAction,

  requestOfferLetterUploadAction,

} from "@/app/(app)/student/application/actions";

import { ApplicationField } from "@/components/application/ApplicationField";

import {

  formatFileSize,

  OFFER_LETTER_ACCEPT_LABEL,

  OFFER_LETTER_MAX_SIZE_LABEL,

  validateOfferLetterFile,

} from "@/components/forms/upload-constraints";

import {

  BTN_PRIMARY,

  BTN_SECONDARY,

  FOCUS_RING,

  INK,

  INSET,

  INSET_MINT,

  MOTION,

  MUTED,

} from "@/components/student/student-ui";

import { cn } from "@/lib/cn";

import type { EvidenceRef } from "@/types/contracts";



type UploadPhase =

  | "idle"

  | "selected"

  | "uploading"

  | "confirming"

  | "success"

  | "error";



export function OfferLetterUploadField({

  applicationId,

  initialEvidence,

  error,

  disabled = false,

  onEvidenceChange,

  onBusyChange,

}: {

  applicationId: string;

  initialEvidence: EvidenceRef | null;

  error?: string;

  disabled?: boolean;

  onEvidenceChange?: (evidenceId: string | null) => void;

  onBusyChange?: (busy: boolean) => void;

}) {

  const inputRef = useRef<HTMLInputElement>(null);

  const [evidence, setEvidence] = useState<EvidenceRef | null>(initialEvidence);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [phase, setPhase] = useState<UploadPhase>(initialEvidence ? "success" : "idle");

  const [message, setMessage] = useState<string | null>(null);

  const [isWorking, startUpload] = useTransition();



  function resetSelection() {

    setSelectedFile(null);

    setMessage(null);

    setPhase(evidence ? "success" : "idle");

    if (inputRef.current) inputRef.current.value = "";

  }



  function handleFileChange(file: File | null) {

    if (!file) {

      resetSelection();

      return;

    }



    const validationError = validateOfferLetterFile(file);

    if (validationError) {

      setSelectedFile(null);

      setPhase(evidence ? "success" : "error");

      setMessage(validationError);

      if (inputRef.current) inputRef.current.value = "";

      return;

    }



    setSelectedFile(file);

    setMessage(null);

    setPhase("selected");

  }



  function runUpload(file: File) {

    startUpload(async () => {

      setPhase("uploading");

      setMessage(null);



      try {

        const ticket = await requestOfferLetterUploadAction({

          applicationId,

          filename: file.name,

          mimeType: file.type,

          sizeBytes: file.size,

        });



        const uploadResponse = await fetch(ticket.uploadUrl, {

          method: "PUT",

          body: file,

          headers: {

            "Content-Type": file.type,

          },

        });



        if (!uploadResponse.ok) {

          throw new Error("Upload failed. Please try again.");

        }



        setPhase("confirming");

        const confirmed = await confirmOfferLetterUploadAction(ticket.evidenceId);

        setEvidence(confirmed);

        onEvidenceChange?.(confirmed.id);

        setSelectedFile(null);

        setPhase("success");

        setMessage("Offer letter uploaded successfully.");

        if (inputRef.current) inputRef.current.value = "";

      } catch (uploadError) {

        setPhase("error");

        setMessage(

          uploadError instanceof Error

            ? uploadError.message

            : "Upload failed. Please try again.",

        );

      }

    });

  }



  const busy = isWorking || phase === "uploading" || phase === "confirming";



  useEffect(() => {

    onBusyChange?.(busy);

  }, [busy, onBusyChange]);



  return (

    <ApplicationField
      label="Offer letter (optional)"
      htmlFor="offer-letter-file"
      error={error}
      hint="Attach an offer letter if the company provided one. Accepted formats: PDF, PNG or JPEG. 10 MB maximum."
      className="sm:col-span-2"
    >

      <input type="hidden" name="offerLetterEvidenceId" value={evidence?.id ?? ""} />



      {evidence && phase === "success" && (

        <div

          className={cn(

            INSET_MINT,

            "mb-3 flex min-w-0 flex-col gap-2 p-3.5 sm:flex-row sm:items-center sm:justify-between",

          )}

        >

          <div className="min-w-0">

            <p className={cn("break-words text-sm font-semibold", INK)}>

              {evidence.originalFilename}

            </p>

            <p className={cn("text-xs", MUTED)}>{formatFileSize(evidence.sizeBytes)} uploaded</p>

          </div>

          <a

            href={evidence.downloadUrl}

            className={cn(

              "inline-flex min-h-11 items-center text-sm font-semibold underline-offset-2 hover:underline",

              INK,

              FOCUS_RING,

            )}

          >

            View current file

          </a>

        </div>

      )}



      <div className={cn(INSET, "min-w-0 p-3.5 sm:p-4")}>

        <input

          ref={inputRef}

          id="offer-letter-file"

          type="file"

          accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"

          disabled={disabled || busy}

          onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}

          className={cn(

            "block w-full min-w-0 text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-[var(--il-ink)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[var(--il-ivory)]",

            "hover:file:bg-[var(--il-moss)] disabled:opacity-60",

            FOCUS_RING,

          )}

        />



        {selectedFile && (

          <div className="mt-3 min-w-0 rounded-xl border border-[var(--il-border)] bg-[var(--il-white)] px-3.5 py-2.5">

            <p className={cn("break-words text-sm font-medium", INK)}>{selectedFile.name}</p>

            <p className={cn("text-xs", MUTED)}>{formatFileSize(selectedFile.size)} selected</p>

          </div>

        )}



        {message && (

          <p

            className={cn(

              "mt-3 text-sm",

              phase === "error" ? "font-medium text-[var(--il-error)]" : MUTED,

            )}

            role={phase === "error" ? "alert" : "status"}

          >

            {message}

          </p>

        )}



        {phase === "uploading" && (

          <p className={cn("mt-3 text-sm", MUTED)} role="status">

            Uploading offer letter…

          </p>

        )}



        {phase === "confirming" && (

          <p className={cn("mt-3 text-sm", MUTED)} role="status">

            Confirming upload…

          </p>

        )}



        <div className="mt-3 flex flex-col gap-2 sm:flex-row">

          {selectedFile && (

            <button

              type="button"

              disabled={disabled || busy}

              onClick={() => runUpload(selectedFile)}

              className={cn(

                BTN_PRIMARY,

                "inline-flex min-h-11 w-full items-center justify-center px-5 sm:w-auto",

                MOTION,

                FOCUS_RING,

              )}

            >

              {busy ? "Uploading…" : evidence ? "Replace offer letter" : "Upload offer letter"}

            </button>

          )}



          {(selectedFile || phase === "error") && !busy && (

            <button

              type="button"

              disabled={disabled}

              onClick={resetSelection}

              className={cn(

                BTN_SECONDARY,

                "inline-flex w-full items-center justify-center px-5 sm:w-auto",

                MOTION,

                FOCUS_RING,

              )}

            >

              Clear selection

            </button>

          )}

        </div>

      </div>

    </ApplicationField>

  );

}
