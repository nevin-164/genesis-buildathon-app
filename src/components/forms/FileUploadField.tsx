"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";

import {
  confirmUploadAction,
  requestUploadAction,
} from "@/app/(app)/student/internships/actions";
import {
  BTN_PRIMARY,
  CONTROL,
  FOCUS_RING,
  MOTION,
  MUTED,
  MUTED_LIGHT,
} from "@/components/explore/explore-ui";
import { Field } from "@/components/ui";
import { DOCUMENT_TYPES } from "@/lib/constants/options";
import { cn } from "@/lib/cn";

/**
 * Attaching one document.
 *
 * The bytes never pass through our own functions: a serverless request body is
 * capped near 4.5 MB and a document may be 10 MB, so the browser PUTs the file
 * straight to Supabase Storage using a URL the server signed for a path the
 * server chose.
 *
 *   1. ask the server for a signed URL   → it inserts the row and picks the path
 *   2. PUT the bytes to that URL          → the client controls what it sends
 *   3. ask the server to confirm          → it re-reads the object's REAL size
 *                                           and type and deletes it if either
 *                                           breaks the rules
 *
 * Step 3 is not a formality. Between 1 and 2 nothing but the client decides
 * what arrives, so the only trustworthy size and type are the ones Storage
 * reports afterwards.
 */

const ACCEPT = "application/pdf,image/png,image/jpeg";
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(["application/pdf", "image/png", "image/jpeg"]);

type Phase = "idle" | "signing" | "uploading" | "confirming";

const PHASE_LABEL: Record<Phase, string> = {
  idle: "Attach document",
  signing: "Preparing…",
  uploading: "Uploading…",
  confirming: "Checking the file…",
};

export function FileUploadField({ internshipId }: { internshipId: string }) {
  const router = useRouter();
  const listId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [docType, setDocType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const busy = phase !== "idle";

  function reset() {
    setFile(null);
    setDocType("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function attach() {
    setError(null);
    setNotice(null);

    if (!file) {
      setError("Choose a file first.");
      return;
    }
    if (!docType.trim()) {
      setError("Say what this document is.");
      return;
    }
    // A courtesy check so an obviously wrong file does not cost an upload.
    // The server checks the bytes that actually arrive regardless.
    if (!ALLOWED.has(file.type)) {
      setError("Only PDF, PNG and JPEG files can be attached.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That file is over the 10 MB limit.");
      return;
    }

    try {
      setPhase("signing");
      const signed = await requestUploadAction({
        internshipId,
        docType: docType.trim(),
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      });
      if (!signed.ok) {
        setError(signed.message);
        return;
      }

      setPhase("uploading");
      const upload = await fetch(signed.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "content-type": file.type },
      });
      if (!upload.ok) {
        setError("The upload did not finish. Check your connection and try again.");
        return;
      }

      setPhase("confirming");
      const confirmed = await confirmUploadAction(signed.documentId);
      if (!confirmed.ok) {
        setError(confirmed.message);
        return;
      }

      reset();
      setNotice(`Attached ${confirmed.document.originalFilename}.`);
      // The list is rendered by the server component above this one.
      router.refresh();
    } catch {
      setError("Something went wrong while attaching that file. Please try again.");
    } finally {
      setPhase("idle");
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-[#cdd8cf] bg-[#fafbf9] p-3 sm:p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="What is it?"
          htmlFor="docType"
          hint="Your own words. Pick a suggestion to keep the spelling consistent."
        >
          <input
            id="docType"
            list={listId}
            value={docType}
            onChange={(event) => setDocType(event.target.value)}
            disabled={busy}
            maxLength={200}
            autoComplete="off"
            placeholder="e.g. Completion certificate"
            className={cn(CONTROL, "h-10", MOTION)}
          />
          <datalist id={listId}>
            {DOCUMENT_TYPES.map((type) => (
              <option key={type} value={type} />
            ))}
          </datalist>
        </Field>

        <Field label="File" htmlFor="documentFile" hint="PDF, PNG or JPEG. Up to 10 MB.">
          <input
            ref={fileInputRef}
            id="documentFile"
            type="file"
            accept={ACCEPT}
            disabled={busy}
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setError(null);
            }}
            className={cn(
              "w-full text-sm text-[#0f1812] file:mr-3 file:rounded-lg file:border file:border-[#cdd8cf]",
              "file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#0f1812]",
              "hover:file:border-[#b5c4b8] disabled:opacity-60",
              MOTION,
              FOCUS_RING,
            )}
          />
        </Field>
      </div>

      {error && (
        <p className="mt-3 text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
      {notice && !error && (
        <p className="mt-3 text-sm text-[#2d5038]" role="status">
          {notice}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {/*
          A button, not a nested <form>. This panel is rendered inside the
          internship form, and a form inside a form is invalid HTML — the inner
          one is dropped and the attach click submits the internship instead.
        */}
        <button
          type="button"
          onClick={attach}
          disabled={busy}
          className={cn(BTN_PRIMARY, "h-9 px-4 text-sm", MOTION, FOCUS_RING)}
        >
          {PHASE_LABEL[phase]}
        </button>
        <p className={cn("text-xs", busy ? MUTED : MUTED_LIGHT)}>
          Only you, your advisor and an administrator can open what you attach.
        </p>
      </div>
    </div>
  );
}
