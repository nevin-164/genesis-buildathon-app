import { DominantActionPanel } from "@/components/student/primitives";
import type { StudentDashboard } from "@/types/contracts";

import { latestActionReason, resolveNextStep } from "./dashboard-next-step";

export function DashboardJourney({ dashboard }: { dashboard: StudentDashboard }) {
  const step = resolveNextStep(dashboard);
  const reason = latestActionReason(dashboard);

  const tone =
    dashboard.nextAction === "rejected"
      ? "rejected"
      : step.urgent
        ? "urgent"
        : "default";

  return (
    <DominantActionPanel
      eyebrow={step.urgent ? "Action required" : "Your next step"}
      title={step.title}
      description={step.text}
      reason={reason}
      reasonLabel={dashboard.nextAction === "rejected" ? "Feedback" : "Faculty message"}
      tone={tone}
      href={step.href}
      cta={step.cta}
    />
  );
}
