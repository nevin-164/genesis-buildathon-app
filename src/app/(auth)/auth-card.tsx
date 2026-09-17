import Link from "next/link";
import type { ReactNode } from "react";

import { exploreDisplay, exploreFont } from "@/components/explore/explore-font";
import { cn } from "@/lib/cn";

/**
 * Shared chrome for the two pages a signed-out visitor can reach.
 *
 * Drawn in the product palette rather than the neutral zinc it used to wear:
 * a green-black brand panel on the left — the same ink as the signed-in header
 * and the staff console — and the form on the sage canvas the student half is
 * painted in. Signing in should look like the front door of the app you are
 * about to be standing in, not a generic form on white.
 *
 * The panel collapses to a compact banner below `lg`, where a half-screen of
 * marketing would only push the password field under the fold. It stays short
 * on purpose: the pitch belongs on the landing page, and someone who has come
 * here to type a password is not reading it.
 */

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
  headline,
  blurb,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  /** Panel headline. Defaults to the product tagline. */
  headline?: ReactNode;
  /** One line under the headline. Keep it to one line. */
  blurb?: string;
}) {
  return (
    <div
      className={cn(
        exploreFont.className,
        exploreDisplay.variable,
        "flex min-h-[100dvh] flex-1 flex-col bg-[#e8ece4] lg:grid lg:grid-cols-2",
      )}
    >
      <BrandPanel headline={headline} blurb={blurb} />

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
        <div className="w-full max-w-[26rem]">
          <div
            className={cn(
              "rounded-2xl border border-[#dde5dc] bg-white p-6 sm:p-8",
              "shadow-[0_20px_60px_-30px_rgba(15,24,18,0.45)]",
            )}
          >
            <h1
              className={cn(
                "font-[family-name:var(--font-explore-display)]",
                "text-[1.5rem] font-bold leading-[1.15] tracking-[-0.025em] text-[#0f1812]",
              )}
            >
              {title}
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-[#5c6b62]">{subtitle}</p>

            <div className="mt-6">{children}</div>
          </div>

          <p className="mt-5 text-center text-sm text-[#5c6b62]">{footer}</p>
        </div>
      </main>
    </div>
  );
}

function BrandPanel({ headline, blurb }: { headline?: ReactNode; blurb?: string }) {
  return (
    <div className="relative isolate overflow-hidden bg-[#080e0b] lg:flex lg:flex-col lg:justify-center">
      {/* A single lime bloom off the top-left. Cheap depth, no image. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-32 h-[26rem] w-[26rem] rounded-full bg-[#c8ef5a]/[0.10] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#c8ef5a]/25 to-transparent lg:inset-y-0 lg:left-auto lg:right-0 lg:h-auto lg:w-px lg:bg-gradient-to-b"
      />

      <div className="relative mx-auto w-full max-w-lg px-4 py-6 sm:px-6 lg:px-10 lg:py-16">
        <Link
          href="/"
          className={cn(
            "group inline-flex items-center gap-2 rounded-lg text-base font-bold tracking-tight text-[#eaf2ec]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8ef5a]/70",
            "focus-visible:ring-offset-2 focus-visible:ring-offset-[#080e0b]",
          )}
        >
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full bg-[#c8ef5a] transition-transform duration-150 group-hover:scale-125 motion-reduce:transition-none"
          />
          InternLens
        </Link>

        <div className="hidden lg:block">
          <h2
            className={cn(
              "mt-14 font-[family-name:var(--font-explore-display)]",
              "text-[2.25rem] font-bold leading-[1.12] tracking-[-0.03em] text-[#f4f9f5]",
            )}
          >
            {headline ?? (
              <>
                See beyond the <span className="text-[#c8ef5a]">certificate</span>.
              </>
            )}
          </h2>

          {blurb && (
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-[#a4b5aa]">{blurb}</p>
          )}
        </div>

        {/* Below lg the panel is only a banner, so the tagline carries it. */}
        <p className="mt-1 text-sm text-[#8a998f] lg:hidden">See beyond the certificate.</p>
      </div>
    </div>
  );
}
