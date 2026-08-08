import Link from "next/link";
import type { ReactNode } from "react";

import { ChevronRightIcon } from "@/components/explore/explore-icons";
import { cn } from "@/lib/cn";

import {
  BODY,
  BODY_LEAD,
  BTN_LIME,
  BTN_PRIMARY,
  BTN_SECONDARY,
  DISPLAY_TITLE,
  DISPLAY_TITLE_SM,
  DIVIDER,
  EDITORIAL_SHEET,
  EDITORIAL_SHEET_IVORY,
  EDITORIAL_SHEET_PAD,
  EYEBROW,
  FOCUS_RING,
  FONT_DISPLAY,
  GREETING_DISPLAY,
  HOVER_LIFT,
  INK,
  INSET,
  INSET_ATTENTION,
  INSET_DARK,
  INSET_ERROR,
  INSET_MINT,
  INSET_NEUTRAL,
  META,
  MOTION,
  MUTED,
  PAGE_CONTENT_GAP,
  PAGE_DISPLAY_HEADING,
  SECTION_TITLE,
  WORKFLOW_SHEET,
  WORKFLOW_SHEET_PAD,
} from "./student-ui";

export function companyMonogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function CompanyMark({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = {
    sm: "h-9 w-9 text-[10px] rounded-lg",
    md: "h-11 w-11 text-xs rounded-xl",
    lg: "h-14 w-14 text-sm rounded-2xl",
    xl: "h-16 w-16 text-base rounded-2xl",
  };

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center bg-[var(--il-ink)] font-bold tracking-wide text-[var(--il-lime)]",
        sizes[size],
        className,
      )}
      aria-hidden="true"
    >
      {companyMonogram(name)}
    </div>
  );
}

/** Page heading directly on canvas — no card wrapper. */
export function CanvasPageHeader({
  eyebrow,
  title,
  lead,
  action,
  variant = "page",
  divider = false,
  contentGap = true,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  action?: ReactNode;
  /** "page" = standard page heading; "greeting" = dashboard welcome line. */
  variant?: "page" | "greeting";
  divider?: boolean;
  contentGap?: boolean;
  className?: string;
}) {
  return (
    <header
      className={cn("relative min-w-0", contentGap && PAGE_CONTENT_GAP, className)}
    >
      {eyebrow && <p className={EYEBROW}>{eyebrow}</p>}
      <div
        className={cn(
          "flex flex-col gap-4",
          action != null &&
            action !== false &&
            "sm:flex-row sm:items-end sm:justify-between sm:gap-6",
          eyebrow ? "mt-2" : "",
        )}
      >
        <div className="min-w-0 flex-1">
          <h1 className={variant === "greeting" ? GREETING_DISPLAY : PAGE_DISPLAY_HEADING}>
            {title}
          </h1>
          {lead && <p className={cn(BODY_LEAD, "mt-2")}>{lead}</p>}
        </div>
        {action && <div className="w-full shrink-0 sm:w-auto">{action}</div>}
      </div>
      {divider && <div className={cn(DIVIDER, "mt-6")} aria-hidden="true" />}
    </header>
  );
}

export function SectionHeading({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className={SECTION_TITLE}>{title}</h2>
        {description && <p className={cn(META, "mt-1 max-w-prose")}>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Keyline({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)} aria-hidden="true">
      <span className="h-px flex-1 bg-[var(--il-border)]" />
      <span className="h-1.5 w-1.5 rotate-45 bg-[var(--il-lime)]" />
      <span className="h-px w-8 bg-[var(--il-border)]" />
    </div>
  );
}

/** Level 2 — major white editorial sheet for one record or report. */
export function EditorialSheet({
  children,
  className,
  variant = "white",
  id,
}: {
  children: ReactNode;
  className?: string;
  variant?: "white" | "ivory";
  id?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        variant === "ivory" ? EDITORIAL_SHEET_IVORY : EDITORIAL_SHEET,
        EDITORIAL_SHEET_PAD,
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Level 2 — list workflow surface for one application or experience row. */
export function WorkflowSheet({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <article className={cn(WORKFLOW_SHEET, WORKFLOW_SHEET_PAD, className)}>{children}</article>
  );
}

export function SheetDivider({ className }: { className?: string }) {
  return <div className={cn(DIVIDER, className)} aria-hidden="true" />;
}

/** Level 3 — tinted inset for status, feedback, evidence. */
export function InsetPanel({
  children,
  variant = "default",
  className,
  id,
}: {
  children: ReactNode;
  variant?: "default" | "mint" | "attention" | "error" | "dark" | "neutral";
  className?: string;
  id?: string;
}) {
  const styles = {
    default: INSET,
    mint: INSET_MINT,
    attention: INSET_ATTENTION,
    error: INSET_ERROR,
    dark: INSET_DARK,
    neutral: INSET_NEUTRAL,
  };

  return (
    <div id={id} className={cn(styles[variant], "p-4 sm:p-5", className)}>
      {children}
    </div>
  );
}

export function QuoteBlock({
  label,
  children,
  variant = "attention",
}: {
  label?: string;
  children: ReactNode;
  variant?: "attention" | "error";
}) {
  return (
    <figure
      className={cn(
        "relative min-w-0 border-l-[3px] pl-4 sm:pl-5",
        variant === "attention"
          ? "border-[var(--il-amber)]"
          : "border-[var(--il-error)]",
      )}
    >
      {label && (
        <figcaption className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--il-muted)]">
          {label}
        </figcaption>
      )}
      <blockquote className={cn(BODY, "mt-1 leading-relaxed")}>{children}</blockquote>
    </figure>
  );
}

export function DefinitionStrip({
  items,
  className,
}: {
  items: { label: string; value: ReactNode }[];
  className?: string;
}) {
  const visible = items.filter((item) => item.value !== null && item.value !== undefined && item.value !== "");

  if (visible.length === 0) return null;

  return (
    <dl
      className={cn(
        "flex min-w-0 flex-wrap gap-x-6 gap-y-3 border-y border-[var(--il-border)] py-3 sm:gap-x-8 sm:py-3.5",
        className,
      )}
    >
      {visible.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--il-muted)]">
            {item.label}
          </dt>
          <dd className={cn("mt-0.5 text-sm font-medium", INK)}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function MetaGrid({
  children,
  columns = 2,
  className,
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid min-w-0 gap-x-8 gap-y-5",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {children}
    </dl>
  );
}

export function MetaItem({
  label,
  value,
  children,
}: {
  label: string;
  value?: ReactNode;
  children?: ReactNode;
}) {
  const content = children ?? value;
  if (content === null || content === undefined || content === "") return null;

  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--il-muted)]">
        {label}
      </dt>
      <dd className={cn("mt-1 text-sm leading-relaxed", INK)}>{content}</dd>
    </div>
  );
}

export function BackLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex scroll-mt-20 items-center gap-1.5 text-sm font-semibold text-[var(--il-moss)] sm:scroll-mt-24",
        "hover:text-[var(--il-ink)] hover:underline",
        MOTION,
        FOCUS_RING,
        className,
      )}
    >
      <ChevronRightIcon className="rotate-180" aria-hidden="true" />
      {label}
    </Link>
  );
}

export function EmptyCanvas({
  title,
  description,
  action,
}: {
  title: string;
  description: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-16 text-center">
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-[var(--il-border)] bg-[color-mix(in_srgb,var(--il-lime)_8%,var(--il-ivory))]"
        aria-hidden="true"
      >
        <span className="h-2 w-2 rounded-full bg-[var(--il-lime)]" />
      </div>
      <h2 className={SECTION_TITLE}>{title}</h2>
      <p className={cn(META, "mx-auto mt-2 max-w-md")}>{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/** Legacy aliases — migrate away from card wrappers */
export const PageIntro = CanvasPageHeader;
export const EmptyState = EmptyCanvas;
export const Surface = InsetPanel;

export function DominantActionPanel({
  eyebrow,
  title,
  description,
  reason,
  reasonLabel = "Faculty message",
  tone = "default",
  href,
  cta,
  className,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  reason?: string | null;
  reasonLabel?: string;
  tone?: "default" | "urgent" | "rejected";
  href: string;
  cta: string;
  className?: string;
}) {
  const isDark = tone === "default";
  const isUrgent = tone === "urgent";
  const isRejected = tone === "rejected";

  return (
    <article
      className={cn(
        "relative isolate min-w-0 w-full rounded-2xl p-5 sm:p-6 lg:p-7",
        isDark &&
          "border border-[color-mix(in_srgb,var(--il-lime)_18%,var(--il-ink))] bg-[var(--il-ink)] text-[var(--il-ivory)]",
        isUrgent &&
          "border border-[color-mix(in_srgb,var(--il-amber)_40%,var(--il-border))] bg-[var(--il-amber-pale)] text-[var(--il-ink)]",
        isRejected &&
          "border border-[color-mix(in_srgb,var(--il-error)_35%,var(--il-border))] bg-[var(--il-error-pale)] text-[var(--il-ink)]",
        className,
      )}
      aria-labelledby="next-action-title"
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
        aria-hidden="true"
      >
        <div className="absolute right-0 top-0 h-32 w-32 translate-x-6 -translate-y-6 rounded-full bg-[color-mix(in_srgb,var(--il-lime)_12%,transparent)] blur-2xl" />
      </div>

      <div className="relative grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-8">
        <div className="min-w-0">
          {eyebrow && (
            <p
              className={cn(
                EYEBROW,
                isDark && "text-[color-mix(in_srgb,var(--il-lime)_85%,var(--il-ivory))]",
              )}
            >
              {eyebrow}
            </p>
          )}
          <h2 id="next-action-title" className={cn(FONT_DISPLAY, "mt-1 text-xl font-semibold tracking-[-0.03em] sm:text-2xl", isDark && "text-[var(--il-ivory)]")}>
            {title}
          </h2>
          <p className={cn("mt-2 max-w-prose text-sm leading-relaxed sm:text-[15px]", isDark ? "text-[color-mix(in_srgb,var(--il-ivory)_75%,transparent)]" : MUTED)}>
            {description}
          </p>
          {reason && (
            <QuoteBlock label={reasonLabel} variant={isRejected ? "error" : "attention"}>
              {reason}
            </QuoteBlock>
          )}
        </div>

        <Link
          href={href}
          className={cn(
            isDark ? BTN_LIME : BTN_PRIMARY,
            "inline-flex min-h-11 w-full items-center justify-center gap-1.5 px-6 font-bold lg:w-auto lg:min-w-[11rem]",
            MOTION,
            HOVER_LIFT,
            FOCUS_RING,
          )}
        >
          {cta}
          <ChevronRightIcon aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

const JOURNEY_ICONS: Record<string, ReactNode> = {
  apply: (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M4 6h12M4 10h8M4 14h10" strokeLinecap="round" />
    </svg>
  ),
  approval: (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M6 10l2.5 2.5L14 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  share: (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M10 4v8M7 9l3 3 3-3M5 16h10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  verify: (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <circle cx="10" cy="10" r="6" />
      <path d="M7.5 10l1.75 1.75L12.5 8.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  published: (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M6 5h8v10H6z" />
      <path d="M8 8h4M8 11h4" strokeLinecap="round" />
    </svg>
  ),
};

const JOURNEY_STAGES = [
  { id: "apply", label: "Apply", hint: "Request approval" },
  { id: "approval", label: "Approval", hint: "Faculty review" },
  { id: "share", label: "Share", hint: "Write your report" },
  { id: "verify", label: "Verify", hint: "Faculty checks" },
  { id: "published", label: "Published", hint: "Reality Card live" },
] as const;

export function InternshipJourneyPathway({
  activeIndex,
  className,
}: {
  activeIndex: number;
  className?: string;
}) {
  return (
    <nav className={cn("min-w-0", className)} aria-label="Internship journey">
      <p className={EYEBROW}>Internship journey</p>
      <h2 className={cn(SECTION_TITLE, "mt-1")}>Your pathway</h2>

      <ol className="relative mt-5 space-y-0">
        {JOURNEY_STAGES.map((stage, index) => {
          const isComplete = index < activeIndex;
          const isCurrent = index === activeIndex;

          return (
            <li key={stage.id} className="relative flex gap-3.5 pb-5 last:pb-0">
              {index < JOURNEY_STAGES.length - 1 && (
                <span
                  className={cn(
                    "absolute left-[17px] top-9 h-[calc(100%-1.25rem)] w-0.5 rounded-full",
                    isComplete ? "bg-[var(--il-lime)]" : "bg-[var(--il-border)]",
                  )}
                  aria-hidden="true"
                />
              )}

              <span
                className={cn(
                  "relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2",
                  isComplete && "border-[var(--il-lime)] bg-[var(--il-ink)] text-[var(--il-lime)]",
                  isCurrent && "border-[var(--il-ink)] bg-[var(--il-lime)] text-[var(--il-ink)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--il-lime)_25%,transparent)]",
                  !isComplete && !isCurrent && "border-[var(--il-border)] bg-[var(--il-ivory)] text-[var(--il-muted)]",
                  MOTION,
                )}
              >
                {JOURNEY_ICONS[stage.id]}
              </span>

              <div className="min-w-0 flex-1 pt-1">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    isCurrent ? INK : isComplete ? "text-[var(--il-leaf)]" : MUTED,
                  )}
                >
                  {stage.label}
                  {isCurrent && (
                    <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-[var(--il-amber)]">
                      Now
                    </span>
                  )}
                </p>
                <p className={cn(META, "mt-0.5")}>{stage.hint}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function FormSectionNav({
  sections,
}: {
  sections: { id: string; label: string }[];
}) {
  return (
    <>
      <nav
        className="-mx-4 overflow-x-auto px-4 pb-1 lg:hidden"
        aria-label="Form sections"
      >
        <ol className="flex min-w-0 gap-2">
          {sections.map((section, index) => (
            <li key={section.id} className="shrink-0">
              <a
                href={`#${section.id}`}
                className={cn(
                  "inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[var(--il-border)] bg-[var(--il-white)] px-3 text-xs font-medium text-[var(--il-muted)]",
                  "hover:border-[var(--il-leaf)] hover:text-[var(--il-ink)]",
                  MOTION,
                  FOCUS_RING,
                )}
              >
                <span className="font-bold tabular-nums text-[var(--il-leaf)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {section.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <nav
        className="sticky top-24 hidden max-h-[calc(100dvh-7rem)] w-full max-w-[13.75rem] overflow-y-auto lg:block"
        aria-label="Form sections"
      >
        <p className={EYEBROW}>Sections</p>
        <ol className="relative mt-3 space-y-0 border-l border-[var(--il-border)]">
          {sections.map((section, index) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={cn(
                  "group flex items-start gap-2 py-1.5 pl-3",
                  MOTION,
                  FOCUS_RING,
                )}
              >
                <span className="text-[10px] font-bold tabular-nums text-[var(--il-muted)] group-hover:text-[var(--il-leaf)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-[13px] font-medium leading-snug text-[var(--il-muted)] group-hover:text-[var(--il-ink)]">
                  {section.label}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

export function StickyFormActions({
  hint,
  children,
}: {
  hint: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 -mx-4 border-t border-[var(--il-border)] bg-[color-mix(in_srgb,var(--il-ivory)_92%,transparent)] px-4 py-4 backdrop-blur-md sm:static sm:mx-0 sm:rounded-2xl sm:border sm:bg-[var(--il-ivory)] sm:px-5 sm:py-4",
      )}
      aria-label="Form actions"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className={cn(META, "max-w-prose sm:text-sm")}>{hint}</p>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">{children}</div>
      </div>
    </div>
  );
}

export function IdentityMasthead({
  back,
  companyName,
  roleTitle,
  badge,
  meta,
  trailing,
  accent = true,
}: {
  back?: ReactNode;
  companyName: string;
  roleTitle: string;
  badge?: ReactNode;
  meta?: ReactNode;
  /** Status block aligned to the right inside a sheet masthead. */
  trailing?: ReactNode;
  accent?: boolean;
}) {
  return (
    <header className="relative min-w-0">
      {back}
      <div
        className={cn(
          "mt-3 flex flex-col gap-4",
          trailing ? "lg:flex-row lg:items-start lg:justify-between" : "sm:flex-row sm:items-start sm:gap-5",
        )}
      >
        <div className="flex min-w-0 gap-4">
          <CompanyMark name={companyName} size="xl" />
          <div className="min-w-0 flex-1">
            <h1 className={DISPLAY_TITLE_SM}>{companyName}</h1>
            {!trailing ? (
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="text-base font-medium text-[var(--il-moss)] sm:text-lg">{roleTitle}</p>
                {badge}
              </div>
            ) : (
              <p className="mt-1 text-base font-medium text-[var(--il-moss)] sm:text-lg">{roleTitle}</p>
            )}
            {!trailing && meta && <div className="mt-3">{meta}</div>}
          </div>
        </div>
        {trailing && (
          <div className="flex min-w-0 flex-col items-start gap-2 lg:items-end lg:pt-1">
            {trailing}
          </div>
        )}
      </div>
      {accent && (
        <div className="mt-4 h-0.5 w-16 bg-[var(--il-lime)]" aria-hidden="true" />
      )}
    </header>
  );
}

export function DashboardDiscoverySection() {
  return (
    <section
      className={cn(
        EDITORIAL_SHEET_IVORY,
        "relative overflow-hidden p-5 sm:p-6 lg:p-8",
        "border-[color-mix(in_srgb,var(--il-moss)_22%,var(--il-border))]",
      )}
      aria-labelledby="dashboard-discovery-heading"
    >
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-40 sm:w-48"
        aria-hidden="true"
      >
        <div className="absolute right-3 top-4 h-14 w-20 rotate-[-7deg] rounded-xl border border-[color-mix(in_srgb,var(--il-lime)_35%,var(--il-border))] bg-[color-mix(in_srgb,var(--il-lime)_10%,var(--il-white))]" />
        <div className="absolute right-10 top-10 h-14 w-20 rotate-[8deg] rounded-xl border border-[var(--il-border)] bg-[var(--il-white)]" />
        <div className="absolute right-5 bottom-5 h-2.5 w-2.5 rounded-full bg-[var(--il-lime)]" />
      </div>

      <div className="relative grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-8">
        <div className="min-w-0 max-w-2xl">
          <p className={EYEBROW}>Discover</p>
          <h2
            id="dashboard-discovery-heading"
            className={cn(FONT_DISPLAY, "mt-1 text-xl font-semibold tracking-[-0.03em] text-[var(--il-ink)] sm:text-2xl")}
          >
            Learn from verified internship experiences
          </h2>
          <p className={cn(BODY_LEAD, "mt-2 text-sm sm:text-[15px]")}>
            Honest write-ups from FISAT students — work, costs, mentorship, and outcomes faculty
            have verified.
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row lg:flex-col lg:min-w-[13rem]">
          <Link
            href="/student/explore"
            className={cn(
              BTN_PRIMARY,
              "inline-flex min-h-11 items-center justify-center gap-1.5 px-5",
              MOTION,
              HOVER_LIFT,
              FOCUS_RING,
            )}
          >
            Explore internships
            <ChevronRightIcon aria-hidden="true" />
          </Link>
          <Link
            href="/student/explore/compare"
            className={cn(
              BTN_SECONDARY,
              "inline-flex min-h-11 items-center justify-center px-5",
              MOTION,
              FOCUS_RING,
            )}
          >
            Compare Reality Cards
          </Link>
        </div>
      </div>
    </section>
  );
}

export function DiscoveryStrip({
  eyebrow,
  title,
  description,
  href,
  cta,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-2xl bg-[var(--il-ink)] px-5 py-6 sm:px-7 sm:py-7">
      <div
        className="pointer-events-none absolute -right-6 bottom-0 top-0 w-40 opacity-30"
        aria-hidden="true"
      >
        <div className="absolute right-4 top-6 h-16 w-24 rotate-[-8deg] rounded-lg border border-[color-mix(in_srgb,var(--il-lime)_30%,transparent)] bg-[color-mix(in_srgb,var(--il-moss)_80%,var(--il-ink))]" />
        <div className="absolute right-10 top-12 h-16 w-24 rotate-[6deg] rounded-lg border border-[color-mix(in_srgb,var(--il-lime)_20%,transparent)] bg-[color-mix(in_srgb,var(--il-leaf)_60%,var(--il-ink))]" />
      </div>

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--il-lime)_80%,var(--il-ivory))]">
            {eyebrow}
          </p>
          <h2 className={cn(FONT_DISPLAY, "mt-1 text-lg font-bold text-[var(--il-ivory)] sm:text-xl")}>
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[color-mix(in_srgb,var(--il-ivory)_72%,transparent)]">
            {description}
          </p>
        </div>
        <Link
          href={href}
          className={cn(BTN_LIME, "inline-flex min-h-11 items-center gap-1.5 px-5 font-bold", MOTION, FOCUS_RING)}
        >
          {cta}
          <ChevronRightIcon aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

export {
  BTN_PRIMARY,
  BTN_SECONDARY,
  DISPLAY_TITLE,
  DISPLAY_TITLE_SM,
  EYEBROW,
  FOCUS_RING,
  HOVER_LIFT,
  INK,
  MOTION,
  MUTED,
  SECTION_TITLE,
};
