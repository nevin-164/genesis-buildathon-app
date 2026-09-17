import type { ReactNode } from "react";

import { exploreDisplay, exploreFont } from "@/components/explore/explore-font";
import { cn } from "@/lib/cn";

import {
  EYEBROW,
  PAGE_SUBTITLE,
  PAGE_TITLE,
  STAFF_CANVAS,
  STAFF_CONTENT,
  STAFF_CONTENT_NARROW,
  STAFF_STACK,
} from "./staff-ui";

/**
 * The console background, applied once per section by `admin/layout.tsx` and
 * `faculty/layout.tsx`.
 *
 * It carries the two things that were previously repeated on every page and
 * drifted between them: the dark canvas, and Manrope/Sora. Those fonts are the
 * student side's, and that is the point — one product, two halves.
 *
 * It deliberately does not set a column width. Screens differ (a directory
 * table wants the wide one, editing one user wants the narrow one) and a layout
 * cannot know which, so that job belongs to `StaffContent` below.
 */
export function StaffCanvas({ children }: { children: ReactNode }) {
  return (
    <div className={cn(exploreFont.className, exploreDisplay.variable, STAFF_CANVAS)}>
      {children}
    </div>
  );
}

/** The column a staff screen's content sits in, plus its vertical rhythm. */
export function StaffContent({
  children,
  width = "wide",
  className,
}: {
  children: ReactNode;
  /** `narrow` is for single-record screens; the default is the directory width. */
  width?: "wide" | "narrow";
  className?: string;
}) {
  return (
    <div
      className={cn(
        width === "narrow" ? STAFF_CONTENT_NARROW : STAFF_CONTENT,
        STAFF_STACK,
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Title block.
 *
 * `eyebrow` names the section the screen belongs to, which is what tells you at
 * a glance whether you are in the admin console or the faculty one now that
 * both are drawn the same way.
 */
export function StaffPageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  back,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Buttons or links pinned to the right of the title on wide screens. */
  actions?: ReactNode;
  /** A back link rendered above the eyebrow. */
  back?: ReactNode;
}) {
  return (
    <header>
      {back && <div className="mb-3">{back}</div>}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <p className={cn(EYEBROW, "mb-2")}>{eyebrow}</p>}
          <h1 className={PAGE_TITLE}>{title}</h1>
          {subtitle && <p className={PAGE_SUBTITLE}>{subtitle}</p>}
        </div>

        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
