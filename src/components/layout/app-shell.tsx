import Link from "next/link";

import { Suspense } from "react";



import { getSession } from "@/lib/auth/dal";

import { cn } from "@/lib/cn";

import { NAV_FOR_ROLE, ROLE_LABEL } from "@/lib/constants/roles";



import {

  APP_CONTAINER,

  APP_HEADER_HEIGHT,

  APP_MAIN_PADDING,

  STAFF_MAIN_CONTAINER,

  initialsFromSessionName,

} from "./app-container";

import { NavLinks } from "./nav-links";



const HEADER_FOCUS =

  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c7f36b]/80 focus-visible:ring-offset-2";



/**

 * The signed-in chrome.

 *

 * Deliberately does NO role checking. In Next 16 a layout does not re-run on

 * navigation and does not stop its children rendering, so a check here would

 * protect nothing. Guards live in each page.tsx.

 */

export function AppShell({ children }: { children: React.ReactNode }) {

  return (

    <div className="min-h-full min-w-0 overflow-x-clip">

      <header

        className={cn(

          "sticky top-0 z-50 border-b border-[#d8e2d6]",

          "bg-[#fbfaf5]/95 shadow-[0_1px_0_rgba(20,38,27,0.06)]",

          "backdrop-blur-md supports-[backdrop-filter]:bg-[#fbfaf5]/90",

        )}

      >

        <div

          className={cn(

            APP_CONTAINER,

            "grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 sm:gap-x-5",

            APP_HEADER_HEIGHT,

          )}

        >

          <Link

            href="/"

            className={cn(

              "group flex shrink-0 items-center gap-2 text-sm font-bold tracking-tight text-[#14261b]",

              "hover:text-[#294d38]",

              HEADER_FOCUS,

            )}

          >

            <span

              className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#14261b] text-[10px] font-extrabold text-[#c7f36b] shadow-[inset_0_0_0_1px_rgba(199,243,107,0.25)]"

              aria-hidden="true"

            >

              <span className="absolute inset-1 rounded-md border border-[#c7f36b]/20" />

              IL

            </span>

            <span className="hidden min-[360px]:inline">

              Intern<span className="text-[#294d38]">Lens</span>

            </span>

          </Link>



          <Suspense fallback={<div className="hidden h-4 min-w-0 sm:block" />}>

            <Nav />

          </Suspense>



          <Suspense fallback={<div className="h-8 w-8 rounded-full bg-[#e8ece4]" />}>

            <UserIdentity />

          </Suspense>

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

    <div className="relative min-w-0 justify-self-center">

      <nav

        className={cn(

          "flex min-w-0 items-center justify-center gap-1 overflow-x-auto overscroll-x-contain sm:gap-3",

          "max-w-full px-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",

        )}

        aria-label="Main navigation"

      >

        <NavLinks items={NAV_FOR_ROLE[user.role]} />

      </nav>

      <div

        className={cn(

          "pointer-events-none absolute inset-y-0 right-0 z-10 w-4",

          "bg-gradient-to-l from-[#fbfaf5] via-[#fbfaf5]/80 to-transparent",

          "supports-[backdrop-filter]:from-[#fbfaf5]/90 supports-[backdrop-filter]:via-[#fbfaf5]/70",

          "sm:hidden",

        )}

        aria-hidden="true"

      />

    </div>

  );

}



async function UserIdentity() {

  const user = await getSession();

  if (!user) {

    return (

      <Link

        href="/login"

        className={cn(

          "inline-flex min-h-11 items-center text-sm font-medium text-[#66736a]",

          "hover:text-[#14261b]",

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

    <div

      className="flex min-w-0 max-w-[9.5rem] items-center gap-2 justify-self-end sm:max-w-none sm:gap-2.5"

      aria-label={identityLabel}

    >

      <div

        className={cn(

          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-9 sm:w-9",

          "border border-[color-mix(in_srgb,#c7f36b_35%,#d8e2d6)] bg-[#14261b] text-[10px] font-bold tracking-wide text-[#c7f36b] sm:text-[11px]",

        )}

        aria-hidden="true"

      >

        {initials}

      </div>



      <div className="hidden min-w-0 sm:block">

        {user.fullName.trim() ? (

          <p className="truncate text-sm font-semibold leading-tight text-[#14261b]">

            {user.fullName}

          </p>

        ) : null}

        <p className="truncate text-[11px] font-medium leading-tight text-[#66736a]">

          {roleLabel}

        </p>

      </div>

    </div>

  );

}
