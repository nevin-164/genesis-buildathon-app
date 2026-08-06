import { getSession } from "@/lib/auth/dal";

import { Pill, Section } from "./_ui";

export const dynamic = "force-dynamic";

/** Same uuids as `src/db/seed.ts` and `src/lib/auth/dal.ts`. */
const ACCOUNTS = [
  ["student", "11111111-1111-4111-8111-111111111111", "Priya Nair"],
  ["faculty", "22222222-2222-4222-8222-222222222222", "Dr. Meera Raghunathan"],
  ["admin", "33333333-3333-4333-8333-333333333333", "System Administrator"],
] as const;

export default async function DevIndexPage() {
  const session = await getSession();

  return (
    <>
      <Section
        title="who am I"
        subtitle="Identity now comes from a real session cookie — package 1 landed, so DEV_FAKE_ROLE no longer does anything. Switching roles means signing in as a different seeded account."
      >
        {session ? (
          <p className="font-mono text-xs">
            <Pill tone="ok">{session.role}</Pill> {session.fullName} · {session.email} ·{" "}
            <span className="text-zinc-500">{session.id}</span>
          </p>
        ) : (
          <div className="space-y-2 text-xs">
            <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-red-800">
              No session. Every controller here will throw <strong>UnauthorizedError</strong> until
              you sign in.
            </p>
            <pre className="rounded bg-zinc-900 px-3 py-2 font-mono text-[11px] text-zinc-100">
              {`npm run db:seed      # prints the shared password\nthen sign in at /login as admin@example.com`}
            </pre>
          </div>
        )}

        <table className="text-xs">
          <tbody>
            {ACCOUNTS.map(([role, id, name]) => (
              <tr key={role}>
                <td className="py-0.5 pr-3 font-mono">{role}</td>
                <td className="py-0.5 pr-3">{name}</td>
                <td className="py-0.5 font-mono text-[11px] text-zinc-500">{id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section
        title="what to test where"
        subtitle="Each page calls the real controllers — the same import paths packages 5 and 6 use."
      >
        <table className="w-full text-xs">
          <tbody>
            {[
              ["/dev/faculty", "faculty", "counts, roster, queue, one student's history"],
              ["/dev/faculty/verify/[id]", "faculty", "detail + the verify / request changes / reject form"],
              ["/dev/admin/org", "admin", "departments → batches → classes, and the advisor"],
              ["/dev/admin/users", "admin", "list, filters, create, edit, deactivate, reset password"],
              ["/dev/admin/assignments", "admin", "stuck internships, classes with no advisor, overrides"],
              ["/dev/checks", "faculty or admin", "the authorisation and state-machine assertions"],
            ].map(([href, role, what]) => (
              <tr key={href} className="border-b border-zinc-100">
                <td className="py-1 pr-3">
                  <a className="font-mono text-blue-700 underline" href={href.replace("/[id]", "")}>
                    {href}
                  </a>
                </td>
                <td className="py-1 pr-3">
                  <Pill tone="mute">{role}</Pill>
                </td>
                <td className="py-1 text-zinc-600">{what}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section
        title="before anything works"
        subtitle="Both are one-time setup."
      >
        <ol className="list-decimal space-y-1 pl-5 text-xs text-zinc-700">
          <li>
            <code className="font-mono">npm run db:migrate</code> then{" "}
            <code className="font-mono">npm run db:seed</code> — the seed truncates every table, so
            point it at a development database only.
          </li>
          <li>
            Sign in at <code className="font-mono">/login</code>{" "}
            <code className="font-mono">.env.local</code> and restart{" "}
            <code className="font-mono">next dev</code>.
          </li>
        </ol>
      </Section>
    </>
  );
}
