import Link from "next/link";

import { getSession } from "@/lib/auth/dal";
import { HOME_FOR_ROLE } from "@/lib/constants/roles";

export default async function Home() {
  const user = await getSession();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-4 text-center">
      <div>
        <h1 className="text-5xl font-bold">InternLens</h1>
        <p className="mt-2 text-xl text-zinc-500">See beyond the certificate.</p>
      </div>

      <p className="text-sm leading-relaxed text-zinc-600">
        Get your internship approved before you start it. Afterwards, share what actually
        happened — the work, the money, the mentorship — so the next batch does not have to
        guess.
      </p>

      <div className="flex gap-3">
        {user ? (
          <Link
            href={HOME_FOR_ROLE[user.role]}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Go to your dashboard
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium"
            >
              Create an account
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
