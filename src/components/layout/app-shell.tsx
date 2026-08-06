import Link from "next/link";
import { Suspense } from "react";

import { signOutAction } from "@/lib/auth/actions";
import { getSession } from "@/lib/auth/dal";
import { NAV_FOR_ROLE, ROLE_LABEL } from "@/lib/constants/roles";

/**
 * The signed-in chrome.
 *
 * Deliberately does NO role checking. In Next 16 a layout does not re-run on
 * navigation and does not stop its children rendering, so a check here would
 * protect nothing. Guards live in each page.tsx.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            InternLens
          </Link>
          <Suspense fallback={<div className="h-4 w-64" />}>
            <Nav />
          </Suspense>
          <div className="ml-auto">
            <Suspense fallback={<div className="h-4 w-32 rounded bg-zinc-100" />}>
              <UserMenu />
            </Suspense>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

/** Nested so the session query does not hold up the page below it. */
async function Nav() {
  const user = await getSession();
  if (!user) return null;

  return (
    <nav className="flex items-center gap-4 text-sm">
      {NAV_FOR_ROLE[user.role].map((item) => (
        <Link key={item.href} href={item.href} className="text-zinc-600 hover:text-zinc-900">
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

async function UserMenu() {
  const user = await getSession();
  if (!user) {
    return (
      <Link href="/login" className="text-sm text-zinc-600 hover:text-zinc-900">
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-zinc-700">
        {user.fullName}
        <span className="ml-1.5 text-zinc-400">{ROLE_LABEL[user.role]}</span>
      </span>
      <form action={signOutAction}>
        <button type="submit" className="text-zinc-500 hover:text-zinc-900">
          Sign out
        </button>
      </form>
    </div>
  );
}
