import type { ReactNode } from "react";



import { LABEL, META } from "@/components/student/student-ui";

import { cn } from "@/lib/cn";



export function ApplicationField({

  label,

  htmlFor,

  required,

  error,

  hint,

  className,

  children,

}: {

  label: string;

  htmlFor: string;

  required?: boolean;

  error?: string;

  hint?: string;

  className?: string;

  children: ReactNode;

}) {

  return (

    <div className={cn("min-w-0 space-y-1.5", className)}>

      <label htmlFor={htmlFor} className={LABEL}>

        {label}

        {required && (

          <span className="ml-0.5 text-[var(--il-error)]" aria-hidden="true">

            *

          </span>

        )}

      </label>

      {children}

      {hint && !error && <p className={cn("text-xs leading-relaxed", META)}>{hint}</p>}

      {error && (

        <p className="text-xs font-medium text-[var(--il-error)]" role="alert">

          {error}

        </p>

      )}

    </div>

  );

}
