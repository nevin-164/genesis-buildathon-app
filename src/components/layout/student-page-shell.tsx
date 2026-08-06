import type { ReactNode } from "react";

import { exploreDisplay, exploreFont } from "@/components/explore/explore-font";
import { cn } from "@/lib/cn";

import {
  APP_CONTAINER,
  STUDENT_PAGE_CANVAS,
  STUDENT_PAGE_STACK,
} from "./app-container";

export function StudentPageShell({
  children,
  className,
  stack = true,
}: {
  children: ReactNode;
  className?: string;
  /** Apply standard vertical spacing between direct children. */
  stack?: boolean;
}) {
  return (
    <div className={cn(exploreFont.className, exploreDisplay.variable, STUDENT_PAGE_CANVAS)}>
      <div className={cn(APP_CONTAINER, stack && STUDENT_PAGE_STACK, className)}>
        {children}
      </div>
    </div>
  );
}
