import type { ReactNode } from "react";

/**
 * Plain building blocks for the package-3 test harness.
 *
 * Deliberately not `@/components/ui` — those belong to package 1, and this whole
 * folder is deleted before the frontend packages merge. Nothing here is product
 * styling; it is instrumentation.
 */

export type ProbeResult<T> =
  | { ok: true; value: T }
  | { ok: false; name: string; message: string };

/**
 * Run a controller and capture whatever it throws.
 *
 * The harness does NOT call `requireFacultyPage()` / `requireAdminPage()`,
 * because those redirect. Seeing `ForbiddenError` rendered on the page is the
 * point — it is how the authorisation checks are read.
 */
export async function probe<T>(run: () => Promise<T>): Promise<ProbeResult<T>> {
  try {
    return { ok: true, value: await run() };
  } catch (error) {
    if (error instanceof Error) {
      return { ok: false, name: error.name, message: error.message };
    }
    return { ok: false, name: "Unknown", message: String(error) };
  }
}

export function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-zinc-300 bg-white">
      <header className="border-b border-zinc-200 bg-zinc-50 px-4 py-2">
        <h2 className="font-mono text-sm font-semibold text-zinc-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-zinc-600">{subtitle}</p>}
      </header>
      <div className="space-y-3 p-4">{children}</div>
    </section>
  );
}

/** Renders either the data or the error, in the same slot. */
export function Result<T>({
  result,
  children,
}: {
  result: ProbeResult<T>;
  children: (value: T) => ReactNode;
}) {
  if (!result.ok) {
    return (
      <p className="rounded border border-red-300 bg-red-50 px-3 py-2 font-mono text-xs text-red-800">
        <strong>{result.name}</strong> — {result.message}
      </p>
    );
  }
  return <>{children(result.value)}</>;
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-zinc-300">
            {head.map((cell) => (
              <th key={cell} className="px-2 py-1.5 font-semibold text-zinc-700">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <tr className="border-b border-zinc-100 align-top">{children}</tr>;
}

export function Cell({ children, mono }: { children?: ReactNode; mono?: boolean }) {
  return (
    <td className={`px-2 py-1.5 ${mono ? "font-mono text-[11px]" : ""}`}>{children ?? "—"}</td>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded border border-dashed border-zinc-300 px-3 py-4 text-xs text-zinc-500">{children}</p>;
}

/** A short id, so a uuid does not eat the whole column. */
export function ShortId({ id }: { id: string }) {
  return (
    <span className="font-mono text-[11px] text-zinc-500" title={id}>
      {id.slice(0, 8)}
    </span>
  );
}

export function Pill({ tone, children }: { tone: "ok" | "warn" | "bad" | "mute"; children: ReactNode }) {
  const tones = {
    ok: "bg-green-100 text-green-800",
    warn: "bg-amber-100 text-amber-800",
    bad: "bg-red-100 text-red-800",
    mute: "bg-zinc-100 text-zinc-700",
  } as const;
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 font-mono text-[11px] ${tones[tone]}`}>
      {children}
    </span>
  );
}

/* ── plain form controls ─────────────────────────────────────────────────── */

export function Text({
  name,
  placeholder,
  defaultValue,
  type = "text",
  required,
}: {
  name: string;
  placeholder?: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
}) {
  return (
    <input
      type={type}
      name={name}
      required={required}
      placeholder={placeholder ?? name}
      defaultValue={defaultValue}
      className="rounded border border-zinc-300 px-2 py-1 font-mono text-xs"
    />
  );
}

export function Picker({
  name,
  options,
  defaultValue,
  blank = "— none —",
}: {
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  blank?: string | null;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue ?? ""}
      className="rounded border border-zinc-300 px-2 py-1 font-mono text-xs"
    >
      {blank !== null && <option value="">{blank}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function Go({ children, tone = "normal" }: { children: ReactNode; tone?: "normal" | "danger" }) {
  return (
    <button
      type="submit"
      className={`rounded px-2.5 py-1 text-xs font-medium text-white ${
        tone === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-zinc-800 hover:bg-zinc-700"
      }`}
    >
      {children}
    </button>
  );
}

/** The banner an action redirects back to. */
export function Flash({ ok, message }: { ok?: string; message?: string }) {
  if (!message) return null;
  const good = ok === "true";
  return (
    <p
      className={`rounded border px-3 py-2 text-xs ${
        good ? "border-green-300 bg-green-50 text-green-900" : "border-red-300 bg-red-50 text-red-900"
      }`}
    >
      {message}
    </p>
  );
}

/** searchParams values arrive as string | string[] | undefined. */
export function one(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}
