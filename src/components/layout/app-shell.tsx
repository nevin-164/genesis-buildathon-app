import Link from "next/link";
import { Suspense } from "react";

import { getSession } from "@/lib/auth/dal";
import { NAV_FOR_ROLE, ROLE_LABEL } from "@/lib/constants/roles";
import { cn } from "@/lib/cn";

import {
  APP_CONTAINER,
  APP_HEADER_HEIGHT,
  APP_MAIN_PADDING,
  STAFF_MAIN_CONTAINER,
  initialsFromSessionName,
} from "./app-container";

const HEADER_FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8ef5a]/70 focus-visible:ring-offset-2";

/**
 * The signed-in chrome.
 *
 * Deliberately does NO role checking. In Next 16 a layout does not re-run on
 * navigation and does not stop its children rendering, so a check here would
 * protect nothing. Guards live in each page.tsx.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full min-w-0">
      <header
        className={cn(
          "sticky top-0 z-50 border-b border-[#cdd8cf]/90",
          "bg-[#fafbf9]/95 shadow-[0_1px_3px_rgba(15,24,18,0.06)]",
          "backdrop-blur-sm supports-[backdrop-filter]:bg-[#fafbf9]/90",
        )}
      >
        <div className={cn(APP_CONTAINER, "flex items-center gap-3 sm:gap-5 lg:gap-6", APP_HEADER_HEIGHT)}>
          <Link
            href="/"
            className={cn(
              "shrink-0 text-sm font-semibold tracking-tight text-[#0f1812]",
              "hover:text-[#2d5038]",
              HEADER_FOCUS,
            )}
          >
            InternLens
          </Link>

          <Suspense fallback={<div className="hidden h-4 w-48 sm:block" />}>
            <Nav />
          </Suspense>

          <div className="ml-auto shrink-0">
            <Suspense fallback={<div className="h-8 w-8 rounded-full bg-[#e8ece4]" />}>
              <UserIdentity />
            </Suspense>
          </div>
        </div>
      </header>

      <Suspense
        fallback={
          <main className={cn(STAFF_MAIN_CONTAINER, APP_MAIN_PADDING, "min-w-0")}>
            {children}
          </main>
        }
      >
        <Main>{children}</Main>
      </Suspense>
    </div>
  );
}

/** Role-aware main width: students get full-width canvas; staff keep max-w-6xl. */
async function Main({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  if (user?.role === "student") {
    return (
      <main className={cn("w-full min-w-0", APP_MAIN_PADDING)}>{children}</main>
    );
  }

  return (
    <main className={cn(STAFF_MAIN_CONTAINER, APP_MAIN_PADDING, "min-w-0")}>
      {children}
    </main>
  );
}

/** Nested so the session query does not hold up the page below it. */
async function Nav() {
  const user = await getSession();
  if (!user) return null;

  return (
    <nav
      className={cn(
        "flex min-w-0 flex-1 items-center gap-3 overflow-x-auto sm:gap-4",
        "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
      )}
      aria-label="Main navigation"
    >
      {NAV_FOR_ROLE[user.role].map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "shrink-0 py-2 text-sm font-medium text-[#5c6b62]",
            "hover:text-[#0f1812]",
            "min-h-11 inline-flex items-center sm:min-h-0",
            HEADER_FOCUS,
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

async function UserIdentity() {
  const user = await getSession();
  if (!user) {
    return (
      <Link
        href="/login"
        className={cn(
          "inline-flex min-h-11 items-center text-sm font-medium text-[#5c6b62]",
          "hover:text-[#0f1812]",
          HEADER_FOCUS,
        )}
      >
        Sign in
      </Link>
    );
  }

  const initials = initialsFromSessionName(user.fullName);
  const roleLabel = ROLE_LABEL[user.role];
  const identityLabel = user.fullName.trim()
    ? `Signed in as ${user.fullName}, ${roleLabel}`
    : `Signed in as ${roleLabel}`;

  return (
    <div className="flex min-w-0 items-center gap-2.5" aria-label={identityLabel}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          "border border-[#c8ef5a]/35 bg-[#0f1812] text-[11px] font-bold tracking-wide text-[#c8ef5a]",
        )}
        aria-hidden="true"
      >
        {initials}
      </div>

      <div className="hidden min-w-0 text-left sm:block">
        {user.fullName.trim() ? (
          <p className="truncate text-sm font-medium leading-tight text-[#0f1812]">
            {user.fullName}
          </p>
        ) : null}
        <p className="text-[11px] font-medium leading-tight text-[#8a968d]">{roleLabel}</p>
      </div>
    </div>
  );
}
