import { requireAdminPage } from "@/lib/auth/dal";

export default async function Page() {
  await requireAdminPage();
  return (
    <div>
      <h1 className="text-2xl font-semibold">Class</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Placeholder. Work package 6 builds this screen &mdash; see the package PDF.
      </p>
    </div>
  );
}
