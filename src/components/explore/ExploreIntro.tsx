import { CanvasPageHeader } from "@/components/student/primitives";



export function ExploreIntro() {

  return (

    <CanvasPageHeader

      eyebrow="InternLens Explore"

      title="Find an internship that fits you"

      lead="Compare real work, costs, mentorship and outcomes shared by FISAT students."

      action={

        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[color-mix(in_srgb,var(--il-lime)_40%,var(--il-border))] bg-[var(--il-white)] px-3 py-1.5 text-xs font-semibold text-[var(--il-moss)]">

          <span

            className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--il-lime)]"

            aria-hidden="true"

          />

          Faculty-verified experiences

        </span>

      }

      divider={false}

    />

  );

}
