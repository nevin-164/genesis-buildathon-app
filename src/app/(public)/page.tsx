import Link from "next/link";
import type { ReactNode } from "react";

import { exploreDisplay, exploreFont } from "@/components/explore/explore-font";
import { SampleCard } from "@/components/landing/SampleCard";
import {
  BTN_LIME,
  BTN_ON_DARK,
  CARD_LIGHT,
  EYEBROW_DARK,
  EYEBROW_LIGHT,
  FOCUS_DARK,
  FONT_DISPLAY,
  MOTION,
  SECTION,
  SECTION_TITLE,
} from "@/components/landing/landing-ui";
import { getSession } from "@/lib/auth/dal";
import { cn } from "@/lib/cn";
import { HOME_FOR_ROLE } from "@/lib/constants/roles";

/**
 * The front door.
 *
 * Drawn in the product palette — green-black hero, sage body, one lime accent —
 * so a visitor who signs in does not land somewhere that looks like a different
 * site. The argument is made in the order a sceptic asks for it: what is wrong
 * with the status quo, what this replaces it with, who does the work, and only
 * then the sign-up.
 */

const STEPS: { n: string; title: string; body: string }[] = [
  {
    n: "01",
    title: "A student writes it up",
    body: "After the internship, in one form: the company, the money in and out, what they were actually given to build, how often a mentor showed up, and what it led to.",
  },
  {
    n: "02",
    title: "Their advisor verifies it",
    body: "The write-up goes to the faculty member who advises that class. They read it, ask for changes if it does not add up, and only then publish it.",
  },
  {
    n: "03",
    title: "The next batch compares",
    body: "Verified cards are searchable and stackable side by side, so a junior can weigh a stipend against a fee and real work against recorded video before applying.",
  },
];

const FACETS: { title: string; body: string }[] = [
  {
    title: "The money, both directions",
    body: "Stipend received and fee paid, as separate numbers. An unpaid internship and one that charges you are not the same thing.",
  },
  {
    title: "What the work actually was",
    body: "Training only, a guided project everyone else also built, or real work on the company codebase.",
  },
  {
    title: "Whether anyone mentored you",
    body: "Daily, weekly, occasionally, or never — the difference between an internship and a subscription to a video course.",
  },
  {
    title: "How they got in",
    body: "Referral, cold email, the college, a job portal. The route matters more than the posting when you are the one applying.",
  },
  {
    title: "What it led to",
    body: "An offer, a letter, a project you can show, or a certificate and nothing else. Recorded plainly either way.",
  },
  {
    title: "Proof, attached",
    body: "Offer letters, logbooks and completion certificates sit on the record the advisor checked.",
  },
];

const AUDIENCES: { role: string; body: string }[] = [
  {
    role: "Students",
    body: "Write up what you did, get it verified, and read what your seniors found before you commit a summer to something.",
  },
  {
    role: "Faculty",
    body: "See every write-up from the classes you advise in one queue. Ask for changes, verify, and keep the department record honest.",
  },
  {
    role: "Administrators",
    body: "Set up departments, batches and classes, assign advisors, and manage who has an account.",
  },
];

export default async function Home() {
  const user = await getSession();

  return (
    <div
      className={cn(
        exploreFont.className,
        exploreDisplay.variable,
        "flex min-h-[100dvh] flex-1 flex-col bg-[#e8ece4]",
      )}
    >
      <TopBar signedIn={Boolean(user)} />

      <main className="flex-1">
        <Hero
          cta={
            user ? (
              <Link href={HOME_FOR_ROLE[user.role]} className={BTN_LIME}>
                Go to your dashboard
              </Link>
            ) : (
              <>
                <Link href="/register" className={BTN_LIME}>
                  Create an account
                </Link>
                <Link href="/login" className={BTN_ON_DARK}>
                  Sign in
                </Link>
              </>
            )
          }
        />

        <Contrast />
        <HowItWorks />
        <WhatYouSee />
        <Audiences />
        {!user && <ClosingCta />}
      </main>

      <Footer />
    </div>
  );
}

/* ─────────────── Top bar ─────────────── */

function TopBar({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="bg-[#080e0b]">
      <div className={cn(SECTION, "flex h-14 items-center gap-4")}>
        <Link
          href="/"
          className={cn(
            "group inline-flex items-center gap-2 rounded-lg text-sm font-bold tracking-tight text-[#eaf2ec]",
            FOCUS_DARK,
          )}
        >
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-[#c8ef5a] transition-transform duration-150 group-hover:scale-125 motion-reduce:transition-none"
          />
          InternLens
        </Link>

        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          <a
            href="#how-it-works"
            className={cn(
              "hidden rounded-lg px-3 py-2 text-sm font-medium text-[#a4b5aa] hover:text-[#eaf2ec] sm:inline-flex",
              MOTION,
              FOCUS_DARK,
            )}
          >
            How it works
          </a>
          {signedIn ? null : (
            <Link
              href="/login"
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium text-[#a4b5aa] hover:text-[#eaf2ec]",
                MOTION,
                FOCUS_DARK,
              )}
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

/* ─────────────── Hero ─────────────── */

function Hero({ cta }: { cta: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden bg-[#080e0b]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-40 h-[34rem] w-[34rem] rounded-full bg-[#c8ef5a]/[0.09] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#c8ef5a]/25 to-transparent"
      />

      <div
        className={cn(
          SECTION,
          "relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:py-24",
        )}
      >
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#c8ef5a]/25 bg-[#c8ef5a]/[0.07] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#c8ef5a]">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#c8ef5a]" />
            Faculty-verified · FISAT
          </span>

          <h1
            className={cn(
              FONT_DISPLAY,
              "mt-6 text-[2.5rem] font-bold leading-[1.08] tracking-[-0.035em] text-[#eaf2ec]",
              "sm:text-[3.25rem] lg:text-[3.5rem]",
            )}
          >
            See beyond the <span className="text-[#c8ef5a]">certificate</span>.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-[#a4b5aa] sm:text-lg">
            An advertisement tells you an internship offers a certificate. It does not
            tell you about the fee, the recorded videos, or the project everyone else
            also built. Here, students write up what actually happened — the work, the
            money, the mentorship — and their advisor verifies it, so the next batch
            does not have to guess.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">{cta}</div>

          <p className="mt-6 text-sm text-[#71857a]">
            Free for everyone at the college. Sign in with your institute email.
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <SampleCard />
        </div>
      </div>
    </section>
  );
}

/* ─────────────── The problem ─────────────── */

function Contrast() {
  return (
    <section className="border-b border-[#d8e0d6] bg-[#f4f8f5] py-16 sm:py-20">
      <div className={SECTION}>
        <p className={EYEBROW_LIGHT}>The gap</p>
        <h2 className={cn(SECTION_TITLE, "mt-3 max-w-2xl text-[#0f1812]")}>
          Everything you need to judge an internship is the part nobody publishes.
        </h2>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5">
          <div className="rounded-xl border border-[#dde5dc] bg-[#eceee9] p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a968d]">
              What the listing says
            </p>
            <ul className="mt-4 space-y-3">
              {[
                "6 weeks · Certificate on completion",
                "Work on live industry projects",
                "Mentorship from experts",
                "Apply now — limited seats",
              ].map((line) => (
                <li key={line} className="flex gap-3 text-[15px] leading-snug text-[#6b776f]">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1 w-4 shrink-0 rounded-full bg-[#b5c4b8]"
                  />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-[#c8ef5a]/50 bg-white p-6 shadow-[0_10px_40px_-24px_rgba(15,24,18,0.4)]">
            <span
              aria-hidden="true"
              className="absolute bottom-5 left-0 top-5 w-1 rounded-full bg-[#c8ef5a]"
            />
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#3d5210]">
              What the write-up says
            </p>
            <ul className="mt-4 space-y-3">
              {[
                "₹6,000 fee paid, no stipend",
                "Recorded videos, one guided to-do app",
                "Mentor answered on Discord, occasionally",
                "Certificate issued. No offer, no code to show",
              ].map((line) => (
                <li key={line} className="flex gap-3 text-[15px] font-medium leading-snug text-[#0f1812]">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1 w-4 shrink-0 rounded-full bg-[#c8ef5a]"
                  />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── How it works ─────────────── */

function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 bg-[#e8ece4] py-16 sm:py-20">
      <div className={SECTION}>
        <p className={EYEBROW_LIGHT}>How it works</p>
        <h2 className={cn(SECTION_TITLE, "mt-3 max-w-2xl text-[#0f1812]")}>
          Three people, one record, nothing published on trust alone.
        </h2>

        <ol className="mt-10 grid gap-4 sm:gap-5 lg:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.n} className={cn(CARD_LIGHT, "flex flex-col")}>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    FONT_DISPLAY,
                    "text-sm font-bold tracking-[0.02em] text-[#3d5210]",
                  )}
                >
                  {step.n}
                </span>
                <span aria-hidden="true" className="h-px flex-1 bg-[#dde5dc]" />
              </div>

              <h3
                className={cn(
                  FONT_DISPLAY,
                  "mt-4 text-[17px] font-bold leading-snug tracking-[-0.02em] text-[#0f1812]",
                )}
              >
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#5c6b62]">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ─────────────── What a card carries ─────────────── */

function WhatYouSee() {
  return (
    <section className="bg-[#0f1812] py-16 sm:py-20">
      <div className={SECTION}>
        <p className={EYEBROW_DARK}>On every card</p>
        <h2 className={cn(SECTION_TITLE, "mt-3 max-w-2xl text-[#eaf2ec]")}>
          The six things you actually wanted to know.
        </h2>

        <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-[#25382c] bg-[#25382c] sm:grid-cols-2 lg:grid-cols-3">
          {FACETS.map((facet) => (
            <div key={facet.title} className="bg-[#0f1812] p-6">
              <h3 className="flex items-start gap-2.5 text-[15px] font-bold leading-snug tracking-tight text-[#eaf2ec]">
                <span
                  aria-hidden="true"
                  className="mt-[0.4rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#c8ef5a]"
                />
                {facet.title}
              </h3>
              <p className="mt-2 pl-[1rem] text-sm leading-relaxed text-[#9aaba0]">
                {facet.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Who it is for ─────────────── */

function Audiences() {
  return (
    <section className="bg-[#e8ece4] py-16 sm:py-20">
      <div className={SECTION}>
        <p className={EYEBROW_LIGHT}>Who signs in</p>
        <h2 className={cn(SECTION_TITLE, "mt-3 max-w-2xl text-[#0f1812]")}>
          One account, three jobs.
        </h2>

        <div className="mt-10 grid gap-4 sm:gap-5 lg:grid-cols-3">
          {AUDIENCES.map((audience) => (
            <div key={audience.role} className={CARD_LIGHT}>
              <h3
                className={cn(
                  FONT_DISPLAY,
                  "text-[17px] font-bold tracking-[-0.02em] text-[#0f1812]",
                )}
              >
                {audience.role}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#5c6b62]">{audience.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Closing ─────────────── */

function ClosingCta() {
  return (
    <section className="bg-[#e8ece4] pb-16 sm:pb-20">
      <div className={SECTION}>
        <div className="relative isolate overflow-hidden rounded-2xl border border-[#1b2a21] bg-[#080e0b] px-6 py-12 text-center sm:px-12 sm:py-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 left-1/2 h-64 w-[30rem] -translate-x-1/2 rounded-full bg-[#c8ef5a]/[0.10] blur-3xl"
          />

          <h2
            className={cn(
              FONT_DISPLAY,
              "relative text-[1.625rem] font-bold leading-tight tracking-[-0.03em] text-[#eaf2ec] sm:text-[2rem]",
            )}
          >
            Add the one you did. Read the ones you did not.
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-[#a4b5aa]">
            It takes one write-up to make the next student a better decision.
          </p>

          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className={BTN_LIME}>
              Create an account
            </Link>
            <Link href="/login" className={BTN_ON_DARK}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#d8e0d6] bg-[#e8ece4]">
      <div
        className={cn(
          SECTION,
          "flex flex-col items-center justify-between gap-3 py-8 sm:flex-row",
        )}
      >
        <p className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-[#0f1812]">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#c8ef5a]" />
          InternLens
        </p>
        <p className="text-sm text-[#5c6b62]">
          The verified internship memory of FISAT.
        </p>
      </div>
    </footer>
  );
}
