import type { ReactNode } from "react";



import { INSET_MINT, META, SECTION_TITLE } from "@/components/student/student-ui";

import { cn } from "@/lib/cn";



export function ApplicationFormSection({

  id,

  title,

  description,

  variant = "open",

  children,

}: {

  id: string;

  title: string;

  description?: string;

  variant?: "open" | "grouped";

  children: ReactNode;

}) {

  return (

    <section

      id={id}

      className={cn(

        "min-w-0 scroll-mt-24 sm:scroll-mt-28",

        variant === "open" && "border-b border-[var(--il-border)] pb-8 last:border-b-0 last:pb-0",

        variant === "grouped" && cn(INSET_MINT, "rounded-xl p-4 sm:p-5"),

      )}

      aria-labelledby={`${id}-heading`}

    >

      <h2 id={`${id}-heading`} className={SECTION_TITLE}>

        {title}

      </h2>

      {description && (

        <p className={cn("mt-1.5 max-w-prose text-sm leading-relaxed", META)}>{description}</p>

      )}

      <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2">{children}</div>

    </section>

  );

}



export function ApplicationFormSpan({ children }: { children: ReactNode }) {

  return <div className="min-w-0 sm:col-span-2">{children}</div>;

}
