import type { ReactNode } from "react";

import { DISPLAY_SECTION, MUTED, PANEL } from "@/components/explore/explore-ui";
import { cn } from "@/lib/cn";

export function ApplicationFormSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(PANEL, "min-w-0 p-4 sm:p-5")}
      aria-labelledby={id}
    >
      <h2 id={id} className={cn(DISPLAY_SECTION, "text-base sm:text-lg")}>
        {title}
      </h2>
      {description && <p className={cn("mt-1 text-sm leading-relaxed", MUTED)}>{description}</p>}
      <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function ApplicationFormSpan({ children }: { children: ReactNode }) {
  return <div className="min-w-0 sm:col-span-2">{children}</div>;
}
