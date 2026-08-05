import { requireStudentPage } from "@/lib/auth/dal";

export default async function Page() {
  await requireStudentPage();
  return (
    <div>
      <h1 className="text-2xl font-semibold">New application</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Placeholder. Work package 4 builds this screen &mdash; see the package PDF.
      </p>
    </div>
  );
}
