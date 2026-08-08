import type { ReactNode } from "react";

import { studentBody, studentDisplay } from "@/components/student/student-font";
import { cn } from "@/lib/cn";

import {
  APP_CONTAINER,
  STUDENT_PAGE_CANVAS,
  STUDENT_PAGE_STACK,
} from "../layout/app-container";

export function StudentPageShell({
  children,
  className,
  stack = true,
}: {
  children: ReactNode;
  className?: string;
  stack?: boolean;
}) {
  return (
    <div
      className={cn(
        studentBody.variable,
        studentDisplay.variable,
        "student-shell overflow-x-clip",
        STUDENT_PAGE_CANVAS,
      )}
    >
      <div
        className={cn(
          APP_CONTAINER,
          "relative",
          stack && STUDENT_PAGE_STACK,
          className,
        )}
      >
        <div
          className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-[color-mix(in_srgb,var(--il-lime)_6%,transparent)] blur-3xl"
          aria-hidden="true"
        />
        <div className="relative min-w-0">{children}</div>
      </div>
    </div>
  );
}
