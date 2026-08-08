import { BackLink, CanvasPageHeader } from "@/components/student/primitives";



export function CompareIntro({ backHref = "/student/explore" }: { backHref?: string }) {

  return (

    <div className="space-y-4">

      <BackLink href={backHref} label="Back to Explore" />

      <CanvasPageHeader

        eyebrow="Side-by-side comparison"

        title="Compare internships"

        lead="Line up two or three verified Reality Cards to see how internships differ in work nature, costs, mentorship, skills, and application pathways — before you decide where to apply."

        divider={false}

      />

    </div>

  );

}
