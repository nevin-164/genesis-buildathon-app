"use client";

import { useState } from "react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/cn";

/**
 * Form furniture for the two signed-out screens.
 *
 * These do not reuse `@/components/ui` because the auth pages are drawn in the
 * product palette — sage canvas, `#0f1812` ink, `#c8ef5a` lime — while those
 * primitives are the neutral zinc set the internship forms use. Same shapes,
 * different key. Props mirror `Field`/`Input`/`Select` so a form reads the same.
 */

/* ─────────────── Tokens ─────────────── */

export const AUTH_INK = "text-[#0f1812]";
export const AUTH_MUTED = "text-[#5c6b62]";
export const AUTH_FAINT = "text-[#8a968d]";

export const AUTH_MOTION =
  "transition-[color,background-color,border-color,box-shadow] duration-150 " +
  "motion-reduce:transition-none";

/** Lime ring on a light surface — the same focus signal Explore uses. */
export const AUTH_FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8ef5a] " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-white";

export const AUTH_CONTROL =
  "h-11 w-full min-w-0 rounded-lg border bg-white px-3.5 text-[15px] text-[#0f1812] " +
  "placeholder:text-[#98a79d] hover:border-[#b5c4b8] " +
  "focus:border-[#9ec45f] focus:outline-none focus:ring-4 focus:ring-[#c8ef5a]/35 " +
  "disabled:cursor-not-allowed disabled:border-[#dde5dc] disabled:bg-[#f4f6f3] " +
  "disabled:text-[#8a968d] " +
  AUTH_MOTION;

export const AUTH_LABEL = "block text-[13px] font-semibold tracking-tight text-[#26382d]";

export const AUTH_LINK =
  "rounded-sm font-semibold text-[#2d5038] underline decoration-[#c8ef5a] decoration-2 " +
  `underline-offset-4 hover:text-[#0f1812] hover:decoration-[#9ec45f] ${AUTH_MOTION} ${AUTH_FOCUS}`;

/* ─────────────── Notices ─────────────── */

/** The one that matters here: a rejected sign-in. */
export function AuthAlert({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-[#f0b9b9] bg-[#fdf2f2] px-3.5 py-3 text-sm font-medium leading-snug text-[#9b2c2c]"
    >
      <span
        aria-hidden="true"
        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d95555]"
      />
      {children}
    </p>
  );
}

export function AuthNotice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-[#e6d6a8] bg-[#fdf8ec] px-3.5 py-3 text-sm leading-relaxed text-[#6b5520]">
      {children}
    </p>
  );
}

/* ─────────────── Field ─────────────── */

export function AuthField({
  label,
  htmlFor,
  required,
  error,
  hint,
  action,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  /** Rendered on the label row, right-aligned — "Forgot password?" and friends. */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className={AUTH_LABEL}>
          {label}
          {required && (
            <span className="ml-0.5 text-[#c05252]" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {action}
      </div>
      {children}
      {hint && !error && <p className={cn("text-xs", AUTH_FAINT)}>{hint}</p>}
      {error && <p className="text-xs font-semibold text-[#c05252]">{error}</p>}
    </div>
  );
}

/* ─────────────── Input ─────────────── */

type AuthInputProps = InputHTMLAttributes<HTMLInputElement> & { error?: string };

export function AuthInput({ error, className, ...props }: AuthInputProps) {
  return (
    <input
      {...props}
      aria-invalid={error ? true : undefined}
      className={cn(
        AUTH_CONTROL,
        error ? "border-[#e09a9a] bg-[#fffafa]" : "border-[#cdd8cf]",
        className,
      )}
    />
  );
}

/* ─────────────── Password ─────────────── */

/**
 * A password box with a reveal toggle.
 *
 * Worth the extra element: this is the field people mistype, and on a form that
 * answers every failure with one deliberately vague message, being able to see
 * what you typed is the only debugging the user gets.
 */
export function AuthPasswordInput({ error, ...props }: AuthInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <AuthInput
        {...props}
        type={visible ? "text" : "password"}
        error={error}
        className="pr-[4.5rem]"
      />
      <button
        type="button"
        onClick={() => setVisible((shown) => !shown)}
        aria-pressed={visible}
        aria-label={visible ? "Hide password" : "Show password"}
        className={cn(
          "absolute inset-y-1 right-1 rounded-md px-2.5 text-xs font-bold uppercase",
          "tracking-[0.08em] text-[#5c6b62] hover:bg-[#eef3ea] hover:text-[#0f1812]",
          AUTH_MOTION,
          AUTH_FOCUS,
        )}
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}

/* ─────────────── Select ─────────────── */

type AuthSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  error?: string;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
};

export function AuthSelect({
  error,
  options,
  placeholder = "Select…",
  className,
  ...props
}: AuthSelectProps) {
  return (
    <select
      {...props}
      aria-invalid={error ? true : undefined}
      className={cn(
        AUTH_CONTROL,
        "cursor-pointer appearance-none bg-[length:1.1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10",
        // Chevron as a data URI so the control needs no icon component.
        "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20stroke%3D%22%235c6b62%22%20stroke-width%3D%221.75%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')]",
        error ? "border-[#e09a9a] bg-[#fffafa]" : "border-[#cdd8cf]",
        className,
      )}
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

/* ─────────────── Submit ─────────────── */

/** Full-width dark-green primary — the light half of the app's loud button. */
export function AuthSubmit({
  children,
  pendingLabel,
}: {
  children: ReactNode;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-5",
        "text-sm font-semibold tracking-tight text-white",
        "bg-[#0f1812] hover:bg-[#1a2e22] hover:shadow-[inset_0_0_0_1px_rgba(200,239,90,0.35)]",
        "active:bg-[#0a120e] disabled:cursor-not-allowed disabled:opacity-60",
        AUTH_MOTION,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8ef5a]",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-white",
      )}
    >
      {pending && (
        <span
          aria-hidden="true"
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-[#c8ef5a] motion-reduce:animate-none"
        />
      )}
      {pending ? pendingLabel : children}
    </button>
  );
}
