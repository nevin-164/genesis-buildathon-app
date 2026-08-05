import { requireFacultyPage } from "@/lib/auth/dal";

export default async function Page() {
  await requireFacultyPage();
  return (
    <div>
      <h1 className="text-2xl font-semibold">Experiences to verify</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Placeholder. Work package 5 builds this screen &mdash; see the package PDF.
      </p>
    </div>
  );
}
