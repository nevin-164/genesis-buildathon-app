import { listVerificationQueue } from "@/controllers/experience-verification.controller";
import { requireFacultyPage } from "@/lib/auth/dal";
import { QueueTable } from "@/components/faculty/QueueTable";

export default async function VerificationQueuePage() {
  await requireFacultyPage();
  const items = await listVerificationQueue();

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 sm:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Verification Queue
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Verify completed internship experiences against certificates before publishing.
        </p>
      </div>

      <QueueTable
        items={items}
        baseLink="/faculty/verifications"
        heading="Experiences waiting for verification"
        emptyStateText="No experiences waiting."
      />
    </div>
  );
}
