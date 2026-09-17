import Link from "next/link";
import { Suspense } from "react";

import { NavLinks } from "@/components/layout/NavLinks";
import { signOutAction } from "@/lib/auth/actions";
import { getSession } from "@/lib/auth/dal";
import { NAV_FOR_ROLE, ROLE_LABEL } from "@/lib/constants/roles";
import { cn } from "@/lib/cn";

import {
  APP_CONTAINER,
  APP_HEADER_HEIGHT,
  APP_MAIN_PADDING,
  initialsFromSessionName,
} from "./app-container";

const HEADER_FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8ef5a]/70 " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-[#080e0b]";

/**
 * The signed-in chrome.
 *
 * The bar is dark green-black with the lime accent — the same ink the Explore
 * hero and the staff console are drawn in. It used to be near-white, which read
 * fine over the student sage but left the dark admin screens looking like a
 * panel someone had pasted into a different app.
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
          "sticky top-0 z-50 border-b border-[#1b2a21]",
          "bg-[#080e0b]/95 shadow-[0_1px_0_rgba(200,239,90,0.06)]",
          "backdrop-blur-sm supports-[backdrop-filter]:bg-[#080e0b]/85",
        )}
      >
        <div
          className={cn(
            APP_CONTAINER,
            "flex items-center gap-3 sm:gap-5 lg:gap-6",
            APP_HEADER_HEIGHT,
          )}
        >
          <Link
            href="/"
            className={cn(
              "group inline-flex shrink-0 items-center gap-2 rounded-lg text-sm font-semibold",
              "tracking-tight text-[#eaf2ec]",
              HEADER_FOCUS,
            )}
          >
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-[#c8ef5a] transition-transform duration-150 group-hover:scale-125 motion-reduce:transition-none"
            />
            InternLens
          </Link>

          <Suspense fallback={<div className="hidden h-4 w-48 flex-1 sm:block" />}>
            <Nav />
          </Suspense>

          <div className="ml-auto shrink-0">
            <Suspense fallback={<div className="h-8 w-8 rounded-full bg-[#121e17]" />}>
              <UserIdentity />
            </Suspense>
          </div>
        </div>
      </header>

      {/*
        Full-width canvas for everyone. Both halves of the app paint their own
        background edge to edge — sage for students, green-black for staff — so
        the column is set by the page, not clamped here. This used to await the
        session to pick a width, which is why it needed a Suspense boundary of
        its own; it does not any more, so the page below renders straight away.
      */}
      <main className={cn("w-full min-w-0", APP_MAIN_PADDING)}>{children}</main>
    </div>
  );
}

/** Nested so the session query does not hold up the page below it. */
async function Nav() {
  const user = await getSession();
  if (!user) return null;

  return <NavLinks items={NAV_FOR_ROLE[user.role]} />;
}

async function UserIdentity() {
  const user = await getSession();
  if (!user) {
    return (
      <Link
        href="/login"
        className={cn(
          "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-[#93a89b]",
          "transition-colors duration-150 hover:text-[#eaf2ec] motion-reduce:transition-none",
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
          "bg-[#c8ef5a] text-[11px] font-bold tracking-wide text-[#0b120e]",
        )}
        aria-hidden="true"
      >
        {initials}
      </div>

      <div className="hidden min-w-0 text-left sm:block">
        {user.fullName.trim() ? (
          <p className="truncate text-sm font-medium leading-tight text-[#eaf2ec]">
            {user.fullName}
          </p>
        ) : null}
        <p className="text-[11px] font-medium leading-tight text-[#71857a]">{roleLabel}</p>
      </div>

      {/* Now that sessions are real, there has to be a way out of one. */}
      <form action={signOutAction}>
        <button
          type="submit"
          className={cn(
            "shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-[#93a89b]",
            "transition-colors duration-150 hover:bg-white/5 hover:text-[#eaf2ec]",
            "motion-reduce:transition-none",
            HEADER_FOCUS,
          )}
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
