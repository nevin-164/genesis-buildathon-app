import Link from "next/link";

import { ChevronRightIcon } from "@/components/explore/explore-icons";
import {
  DISPLAY_SECTION,
  FOCUS_RING,
  INK,
  MOTION,
  MUTED,
  MUTED_LIGHT,
  PANEL,
} from "@/components/explore/explore-ui";
import { cn } from "@/lib/cn";

import {
  ApplicationNavIcon,
  ExperienceNavIcon,
  ExploreNavIcon,
} from "./dashboard-icons";
import { DASH_CARD_HOVER, DASH_CARD_PAD, initialsFromFullName } from "./dashboard-utils";

const QUICK_LINKS = [
  { href: "/student/explore", label: "Explore", Icon: ExploreNavIcon },
  { href: "/student/application", label: "My application", Icon: ApplicationNavIcon },
  { href: "/student/experience", label: "My experience", Icon: ExperienceNavIcon },
] as const;

function ProfileCard({ fullName }: { fullName: string | null }) {
  const initials = fullName ? initialsFromFullName(fullName) : "?";

  return (
    <section
      className={cn(PANEL, DASH_CARD_PAD, DASH_CARD_HOVER, "min-w-0", MOTION)}
      aria-labelledby="dashboard-profile-heading"
    >
      <h2 id="dashboard-profile-heading" className="sr-only">
        Your profile
      </h2>

      <div className="flex flex-col items-center text-center">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#c8ef5a]/40 bg-[#0f1812] text-sm font-bold tracking-wide text-[#c8ef5a]"
          aria-hidden="true"
        >
          {initials}
        </div>

        {fullName ? (
          <p className={cn("mt-3 text-sm font-semibold leading-snug break-words", INK)}>
            {fullName}
          </p>
        ) : (
          <p className={cn("mt-3 text-sm font-semibold", INK)}>Student</p>
        )}

        <p className={cn("mt-1 text-xs font-medium", MUTED_LIGHT)}>Student</p>
      </div>
    </section>
  );
}

function QuickAccess() {
  return (
    <nav
      className={cn(PANEL, DASH_CARD_PAD, "min-w-0")}
      aria-labelledby="dashboard-quick-access-heading"
    >
      <h2
        id="dashboard-quick-access-heading"
        className={cn(DISPLAY_SECTION, "text-sm")}
      >
        Quick access
      </h2>

      <ul className="mt-3 space-y-1.5">
        {QUICK_LINKS.map(({ href, label, Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className={cn(
                "group flex min-h-11 items-center gap-3 rounded-lg border border-[#e4ebe4] bg-white px-3 py-2.5",
                INK,
                MOTION,
                FOCUS_RING,
                "hover:border-[#c8ef5a]/45 hover:bg-[#f4f8f5] active:bg-[#eef4ef]",
                "motion-reduce:hover:translate-y-0 hover:-translate-y-px",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#dde5dc] bg-[#fafbf9] text-[#5c6b62]",
                  "group-hover:border-[#b8d4bc] group-hover:bg-[#ecf8ee] group-hover:text-[#2d5038]",
                  MOTION,
                )}
              >
                <Icon />
              </span>
              <span className="min-w-0 flex-1 text-left text-sm font-medium">{label}</span>
              <ChevronRightIcon
                className={cn(
                  "shrink-0 text-[#8a968d] group-hover:text-[#2d5038]",
                  "motion-reduce:transition-none group-hover:translate-x-0.5",
                  MOTION,
                )}
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function DashboardSidebar({ fullName }: { fullName: string | null }) {
  return (
    <aside className="flex min-w-0 flex-col gap-4 lg:order-2 lg:gap-5">
      <ProfileCard fullName={fullName} />
      <QuickAccess />
    </aside>
  );
}
