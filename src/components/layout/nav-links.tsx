"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

const HEADER_FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c7f36b] focus-visible:ring-offset-2";

const MOTION = "transition-colors duration-200 motion-reduce:transition-none";

function isNavActive(href: string, pathname: string): boolean {
  if (href === "/student") return pathname === "/student";
  if (href === "/faculty") return pathname === "/faculty";
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({
  items,
}: {
  items: readonly { href: string; label: string }[];
}) {
  const pathname = usePathname();

  return (
    <>
      {items.map((item) => {
        const active = isNavActive(item.href, pathname);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-semibold sm:min-h-0",
              MOTION,
              HEADER_FOCUS,
              active
                ? "bg-[color-mix(in_srgb,#c7f36b_18%,transparent)] text-[#14261b]"
                : "text-[#66736a] hover:bg-[color-mix(in_srgb,#eef3ea_80%,white)] hover:text-[#14261b]",
            )}
          >
            {item.label}
            {active && (
              <span
                className="absolute inset-x-2.5 -bottom-[9px] h-0.5 rounded-full bg-[#c7f36b]"
                aria-hidden="true"
              />
            )}
          </Link>
        );
      })}
    </>
  );
}
