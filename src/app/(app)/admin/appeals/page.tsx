import { AppealQueueTable } from "@/components/admin/AppealQueueTable";
import { StaffContent, StaffPageHeader } from "@/components/staff/StaffShell";
import { listAppealQueue } from "@/controllers/appeal.controller";
import { requireAdminPage } from "@/lib/auth/dal";

/**
 * The one queue that belongs to an administrator rather than an advisor.
 *
 * Every other admin screen is about accounts and the org tree. This one is
 * about a decision, and it exists because the person appealed against cannot be
 * the person who hears the appeal — so it cannot live under /faculty, however
 * much it looks like the queue there.
 */
export default async function AdminAppealsPage() {
  await requireAdminPage();
  const items = await listAppealQueue();

  return (
    <StaffContent>
      <StaffPageHeader
        eyebrow="Admin console"
        title="Appeals"
        subtitle="Rejections a student has contested, oldest first. You are the second opinion, not a second advisor."
      />

      <AppealQueueTable items={items} />
    </StaffContent>
  );
}
