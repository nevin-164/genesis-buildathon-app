"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

export type NavItem = { href: string; label: string };

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8ef5a]/70 " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-[#080e0b]";

/**
 * The header links, with the current one marked.
 *
 * A client component because the pathname is only readable from one — and this
 * is the whole reason it is client, so it stays as small as it can be while the
 * rest of the header renders on the server.
 *
 * "Current" is prefix-based so a detail page keeps its section lit:
 * /faculty/verifications/abc still highlights Verifications. The dashboard
 * entries are exact-matched instead, or /faculty would light up on every faculty
 * screen. Longest match wins, so /student and /student/explore never both win.
 */
export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  const activeHref = items
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav
      className={cn(
        "flex min-w-0 flex-1 items-center gap-1 overflow-x-auto",
        "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
      )}
      aria-label="Main navigation"
    >
      {items.map((item) => {
        const isActive = item.href === activeHref;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-medium sm:min-h-9",
              "transition-colors duration-150 motion-reduce:transition-none",
              isActive
                ? "bg-[#c8ef5a]/10 text-[#eaf2ec]"
                : "text-[#93a89b] hover:bg-white/5 hover:text-[#eaf2ec]",
              FOCUS,
            )}
          >
            {item.label}
            {isActive && (
              <span
                aria-hidden="true"
                className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[#c8ef5a]"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
