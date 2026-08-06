import Link from "next/link";
import type { ReactNode } from "react";

/** Shared chrome for the two pages a signed-out visitor can reach. */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-12">
      <div className="text-center">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          InternLens
        </Link>
        <p className="mt-1 text-sm text-zinc-500">See beyond the certificate.</p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h1 className="text-lg font-semibold text-zinc-900">{title}</h1>
        <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>

      <p className="text-center text-sm text-zinc-600">{footer}</p>
    </main>
  );
}
