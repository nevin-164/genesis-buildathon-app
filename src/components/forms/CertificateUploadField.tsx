"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import {
  confirmCertificateUploadAction,
  requestCertificateUploadAction,
} from "@/app/(app)/student/experience/actions";
import { ApplicationField } from "@/components/application/ApplicationField";
import {
  CERTIFICATE_ACCEPT_LABEL,
  CERTIFICATE_MAX_SIZE_LABEL,
  formatFileSize,
  validateCertificateFile,
} from "@/components/forms/certificate-upload-constraints";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  FOCUS_RING,
  HOVER_LIFT,
  INK,
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

function uploadWithProgress(file: File, uploadUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        window.dispatchEvent(
          new CustomEvent("certificate-upload-progress", { detail: { percent } }),
        );
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error("Upload failed. Please try again."));
    };
    xhr.onerror = () => reject(new Error("Upload failed. Please try again."));
    xhr.send(file);
  });
}

export function CertificateUploadField({
  experienceId,
  initialEvidence,
  error,
  disabled = false,
  onEvidenceChange,
  onBusyChange,
}: {
  experienceId: string;
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
  const [progress, setProgress] = useState(0);
  const [isWorking, startUpload] = useTransition();

  function resetSelection() {
    setSelectedFile(null);
    setMessage(null);
    setProgress(0);
    setPhase(evidence ? "success" : "idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleFileChange(file: File | null) {
    if (!file) {
      resetSelection();
      return;
    }

    const validationError = validateCertificateFile(file);
    if (validationError) {
      setSelectedFile(null);
      setPhase(evidence ? "success" : "error");
      setMessage(validationError);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
    setMessage(null);
    setProgress(0);
    setPhase("selected");
  }

  function runUpload(file: File) {
    startUpload(async () => {
      setPhase("uploading");
      setMessage(null);
      setProgress(0);

      const progressHandler = (event: Event) => {
        const detail = (event as CustomEvent<{ percent: number }>).detail;
        setProgress(detail.percent);
      };
      window.addEventListener("certificate-upload-progress", progressHandler);

      try {
        const ticket = await requestCertificateUploadAction({
          experienceId,
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        });

        await uploadWithProgress(file, ticket.uploadUrl);

        setPhase("confirming");
        setProgress(100);
        const confirmed = await confirmCertificateUploadAction(ticket.evidenceId);
        setEvidence(confirmed);
        onEvidenceChange?.(confirmed.id);
        setSelectedFile(null);
        setPhase("success");
        setMessage("Certificate uploaded successfully.");
        if (inputRef.current) inputRef.current.value = "";
      } catch (uploadError) {
        setPhase("error");
        setMessage(
          uploadError instanceof Error
            ? uploadError.message
            : "Upload failed. Please try again.",
        );
        onEvidenceChange?.(null);
      } finally {
        window.removeEventListener("certificate-upload-progress", progressHandler);
      }
    });
  }

  const busy = isWorking || phase === "uploading" || phase === "confirming";

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  return (
    <ApplicationField
      label="Internship certificate"
      htmlFor="certificate-file"
      required
      error={error}
      hint={`${CERTIFICATE_ACCEPT_LABEL}. ${CERTIFICATE_MAX_SIZE_LABEL}. Your certificate stays private and is never shown on the public Reality Card.`}
      className="sm:col-span-2"
    >
      <input type="hidden" name="certificateEvidenceId" value={evidence?.id ?? ""} />

      {evidence && phase === "success" && (
        <div className="mb-5 flex min-w-0 flex-col gap-2 border-l-[3px] border-[var(--il-lime)] pl-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className={cn("text-sm font-semibold break-words", INK)}>
              {evidence.originalFilename}
            </p>
            <p className={cn("text-xs", MUTED)}>
              {formatFileSize(evidence.sizeBytes)} uploaded · private faculty evidence only
            </p>
          </div>
          <a
            href={evidence.downloadUrl}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center text-sm font-semibold underline-offset-2 hover:underline",
              INK,
              FOCUS_RING,
            )}
          >
            View uploaded file
          </a>
        </div>
      )}

      <div
        className={cn(
          "min-w-0 rounded-xl border border-dashed border-[color-mix(in_srgb,var(--il-leaf)_35%,var(--il-border))]",
          "bg-[color-mix(in_srgb,var(--il-lime)_4%,var(--il-canvas))] px-4 py-5 text-center",
        )}
      >
        <input
          ref={inputRef}
          id="certificate-file"
          type="file"
          accept=".pdf,application/pdf"
          disabled={disabled || busy}
          onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
          className={cn(
            "mx-auto block w-full max-w-sm min-w-0 text-sm",
            "file:mr-3 file:rounded-xl file:border-0 file:bg-[var(--il-ink)] file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-[var(--il-ivory)]",
            "hover:file:bg-[var(--il-moss)] disabled:opacity-60",
            FOCUS_RING,
          )}
        />
        <p className={cn("mt-2 text-xs", MUTED)}>PDF only · never published publicly</p>
      </div>

      {selectedFile && (
        <div className="mt-4 min-w-0 border-b border-[var(--il-border)] pb-4">
          <p className={cn("text-sm font-medium break-words", INK)}>{selectedFile.name}</p>
          <p className={cn("text-xs", MUTED)}>{formatFileSize(selectedFile.size)} selected</p>
        </div>
      )}

      {(phase === "uploading" || phase === "confirming") && (
        <div className="mt-4" role="status" aria-live="polite">
          <div className="flex items-center justify-between gap-3">
            <p className={cn("text-sm", MUTED)}>
              {phase === "uploading" ? "Uploading certificate…" : "Confirming upload…"}
            </p>
            <p className={cn("text-xs font-medium tabular-nums", INK)}>{progress}%</p>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--il-border)]">
            <div
              className="h-full rounded-full bg-[var(--il-lime)] transition-[width] duration-150 motion-reduce:transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {message && phase !== "uploading" && phase !== "confirming" && (
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

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {selectedFile && (
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => runUpload(selectedFile)}
            className={cn(
              BTN_PRIMARY,
              "inline-flex min-h-11 w-full items-center justify-center px-5 sm:w-auto",
              MOTION,
              HOVER_LIFT,
              FOCUS_RING,
            )}
          >
            {busy ? "Uploading…" : evidence ? "Replace certificate" : "Upload certificate"}
          </button>
        )}

        {(selectedFile || phase === "error") && !busy && (
          <button
            type="button"
            disabled={disabled}
            onClick={resetSelection}
            className={cn(
              BTN_SECONDARY,
              "inline-flex min-h-11 w-full items-center justify-center px-5 sm:w-auto",
              MOTION,
              FOCUS_RING,
            )}
          >
            Clear selection
          </button>
        )}
      </div>
    </ApplicationField>
  );
}
