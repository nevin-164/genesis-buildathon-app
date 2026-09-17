import { QueueTable } from "@/components/faculty/QueueTable";
import { StaffContent, StaffPageHeader } from "@/components/staff/StaffShell";
import { listVerificationQueue } from "@/controllers/verification.controller";
import { requireFacultyPage } from "@/lib/auth/dal";

export default async function VerificationQueuePage() {
  await requireFacultyPage();
  const items = await listVerificationQueue();

  return (
    <StaffContent>
      <StaffPageHeader
        eyebrow="Faculty console"
        title="Verification queue"
        subtitle="Internships waiting on your decision, oldest first."
      />

      <QueueTable
        items={items}
        baseLink="/faculty/verifications"
        heading="Internships waiting for verification"
        emptyStateText="No internships waiting."
      />
    </StaffContent>
  );
}
