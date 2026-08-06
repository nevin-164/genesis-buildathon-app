import type { ReactNode } from "react";

import { getSession } from "@/lib/auth/dal";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PACKAGE 3 TEST HARNESS — delete this whole folder before merging packages
 * 4, 5 and 6. Nothing outside `src/app/(dev)/` depends on it, except
 * `src/models/dev-fixtures.model.ts`, which goes at the same time.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `(dev)` is a route group, so it never appears in a URL and never collides
 * with `(app)`. The frontend packages own `src/app/(app)/faculty/**` and
 * `src/app/(app)/admin/**` and will never open this folder — which is the whole
 * reason the harness lives here rather than in the real screens.
 */

const NAV = [
  ["/dev", "Index"],
  ["/dev/faculty", "Faculty"],
  ["/dev/admin/org", "Org tree"],
  ["/dev/admin/users", "Users"],
  ["/dev/admin/assignments", "Assignments"],
  ["/dev/checks", "Checks"],
] as const;

export default async function DevLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-zinc-100">
      <header className="border-b border-zinc-300 bg-zinc-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
          <span className="font-mono text-sm font-semibold">package-3 harness</span>

          <nav className="flex flex-wrap gap-3">
            {NAV.map(([href, label]) => (
              // Plain anchors, not <Link>: a full reload guarantees fresh
              // server data, which is what you want when the thing under test
              // is the query itself.
              <a key={href} href={href} className="text-xs text-zinc-300 hover:text-white">
                {label}
              </a>
            ))}
          </nav>

          <span className="ml-auto font-mono text-xs">
            {session ? (
              <>
                <span className="text-amber-300">{session.role}</span>
                <span className="text-zinc-400"> · {session.fullName}</span>
              </>
            ) : (
              <span className="text-red-300">no session — set DEV_FAKE_ROLE</span>
            )}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6">{children}</main>
    </div>
  );
}
