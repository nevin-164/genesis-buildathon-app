/**
 * Shared UI primitives. Package 1 owns this file.
 *
 * You may ADD a new component here and tell the team. Never change the props
 * of one that already exists — five other people are using it.
 */
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/cn";

/* ─────────────── Button ─────────────── */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

const BUTTON_VARIANTS = {
  primary: "bg-zinc-900 text-white hover:bg-zinc-700",
  secondary: "bg-white text-zinc-900 border border-zinc-300 hover:bg-zinc-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
} as const;

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium",
        "transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        BUTTON_VARIANTS[variant],
        className,
      )}
    />
  );
}

/* ─────────────── Input ─────────────── */

type InputProps = InputHTMLAttributes<HTMLInputElement> & { error?: string };

const CONTROL_BASE =
  "w-full rounded-md border px-3 py-2 text-sm outline-none " +
  "focus:ring-2 focus:ring-zinc-400 disabled:bg-zinc-50 disabled:text-zinc-500";

export function Input({ error, className, ...props }: InputProps) {
  return (
    <input
      {...props}
      aria-invalid={error ? true : undefined}
      className={cn(CONTROL_BASE, error ? "border-red-500" : "border-zinc-300", className)}
    />
  );
}

/* ─────────────── Textarea ─────────────── */

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string };

export function Textarea({ error, className, rows = 4, ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      rows={rows}
      aria-invalid={error ? true : undefined}
      className={cn(CONTROL_BASE, error ? "border-red-500" : "border-zinc-300", className)}
    />
  );
}

/* ─────────────── Select ─────────────── */

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  error?: string;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
};

export function Select({
  error,
  options,
  placeholder = "Select…",
  className,
  ...props
}: SelectProps) {
  return (
    <select
      {...props}
      aria-invalid={error ? true : undefined}
      className={cn(CONTROL_BASE, error ? "border-red-500" : "border-zinc-300", className)}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/* ─────────────── Field ─────────────── */

export function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-zinc-800">
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

/* ─────────────── Badge ─────────────── */

export type BadgeTone = "gray" | "blue" | "green" | "amber" | "red";

const BADGE_TONES: Record<BadgeTone, string> = {
  gray: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  green: "bg-green-50 text-green-700 ring-green-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  red: "bg-red-50 text-red-700 ring-red-200",
};

export function Badge({ tone = "gray", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        BADGE_TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

/* ─────────────── Card ─────────────── */

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-zinc-200 bg-white p-5", className)}>
      {children}
    </div>
  );
}

/* ─────────────── EmptyState ─────────────── */

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 px-6 py-12 text-center">
      <p className="text-sm font-medium text-zinc-800">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
