import { setClassAdvisor } from "@/controllers/admin/assignment.controller";
import { listClasses } from "@/controllers/admin/org.controller";
import {
  getUser,
  listFacultyOptions,
  listUsers,
  setUserActive,
  updateUser,
} from "@/controllers/admin/user.controller";
import { getFacultyCounts, getStudentHistory } from "@/controllers/faculty.controller";
import { getVerificationDetail, verifyInternship } from "@/controllers/verification.controller";
import { getSession } from "@/lib/auth/dal";
import { protectedPrefixes } from "@/lib/auth/route-policy";
import { DevFixtures, type Scratch } from "@/models/dev-fixtures.model";

import { Cell, Pill, Row, Section, Table } from "../_ui";

/**
 * A copy of `config.matcher` from `src/proxy.ts`, kept honest by check 14.
 *
 * Next reads that export statically at build time, so the proxy cannot import
 * the policy table and the matcher cannot be generated from it. This assertion
 * is what stops a newly guarded route from having no proxy at all.
 */
const PROXY_MATCHER = [
  "/student",
  "/student/:path*",
  "/faculty",
  "/faculty/:path*",
  "/admin",
  "/admin/:path*",
];

export const dynamic = "force-dynamic";

/**
 * The package-3 assertions, run against the real database.
 *
 * Some checks only mean something as a faculty member (an admin deliberately
 * bypasses the ownership guard) and some need admin rights. Anything the
 * current role cannot exercise is reported as SKIP with the role it needs —
 * run this page once as `faculty` and once as `admin` for full coverage.
 *
 * Scratch rows are created and removed inside each check. Nothing seeded is
 * left modified.
 */

type Status = "pass" | "fail" | "skip";
type Outcome = { n: number; name: string; status: Status; detail: string };

const ALL_TICKED = {
  confirmIdentity: "on",
  confirmEvidence: "on",
  confirmNoPrivateInfo: "on",
};

/** Run a call that is supposed to throw, and report which error came back. */
async function expectThrow(
  run: () => Promise<unknown>,
  expected: string,
): Promise<{ status: Status; detail: string }> {
  try {
    await run();
    return { status: "fail", detail: `expected ${expected}, but the call succeeded` };
  } catch (error) {
    const name = error instanceof Error ? error.name : "Unknown";
    const message = error instanceof Error ? error.message : String(error);
    return name === expected
      ? { status: "pass", detail: `${name} — "${message}"` }
      : { status: "fail", detail: `expected ${expected}, got ${name} — "${message}"` };
  }
}

async function expectFieldError(
  run: () => Promise<unknown>,
  field: string,
): Promise<{ status: Status; detail: string }> {
  try {
    await run();
    return { status: "fail", detail: `expected a field error on "${field}", but it succeeded` };
  } catch (error) {
    const fieldErrors =
      error && typeof error === "object" && "fieldErrors" in error
        ? (error as { fieldErrors: Record<string, string> }).fieldErrors
        : undefined;

    if (!fieldErrors) {
      const name = error instanceof Error ? error.name : "Unknown";
      return { status: "fail", detail: `expected ValidationError, got ${name}` };
    }
    return fieldErrors[field]
      ? { status: "pass", detail: `${field}: ${fieldErrors[field]}` }
      : {
          status: "fail",
          detail: `ValidationError, but not on "${field}" — got ${Object.keys(fieldErrors).join(", ")}`,
        };
  }
}

export default async function DevChecksPage() {
  const session = await getSession();
  const results: Outcome[] = [];
  const add = (n: number, name: string, r: { status: Status; detail: string }) =>
    results.push({ n, name, ...r });
  const skip = (n: number, name: string, needs: string) =>
    results.push({ n, name, status: "skip", detail: `needs a signed-in ${needs}` });

  if (!session) {
    return (
      <Section title="/dev/checks" subtitle="">
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">
          No session. Sign in at <code className="font-mono">/login</code>{" "}
          <code className="font-mono">.env.local</code> and restart the dev server.
        </p>
      </Section>
    );
  }

  const isFaculty = session.role === "faculty";
  const isAdmin = session.role === "admin";

  // Clear anything an interrupted run left behind before making new rows.
  const swept = await DevFixtures.sweep();

  const student = await DevFixtures.anyStudent();
  const otherFaculty = await DevFixtures.someOtherFaculty(session.id);

  /* ── 1 & 2 · the IDOR pair ───────────────────────────────────────────── */

  if (!isFaculty) {
    skip(1, "read another advisor's internship → NotFoundError", "faculty");
    skip(2, "verify another advisor's internship → ForbiddenError", "faculty");
  } else if (!student || !otherFaculty) {
    add(1, "read another advisor's internship → NotFoundError", {
      status: "skip",
      detail: "needs a second active faculty account and one student in the database",
    });
    add(2, "verify another advisor's internship → ForbiddenError", {
      status: "skip",
      detail: "needs a second active faculty account and one student in the database",
    });
  } else {
    let theirs: Scratch | null = null;
    try {
      theirs = await DevFixtures.createSubmittedInternship({
        studentId: student.id,
        facultyId: otherFaculty.id,
      });

      add(
        1,
        `read an internship assigned to ${otherFaculty.fullName} → NotFoundError`,
        await expectThrow(() => getVerificationDetail(theirs!.internshipId), "NotFoundError"),
      );

      add(
        2,
        `verify an internship assigned to ${otherFaculty.fullName} → ForbiddenError`,
        await expectThrow(
          () =>
            verifyInternship(theirs!.internshipId, { action: "verify", reason: "", ...ALL_TICKED }),
          "ForbiddenError",
        ),
      );
    } finally {
      if (theirs) await DevFixtures.remove(theirs);
    }
  }

  /* ── 3 to 7 · validation and the state machine, on my own row ────────── */

  if (!isFaculty && !isAdmin) {
    for (const [n, name] of [
      [3, "verify twice → InvalidStateError"],
      [4, "reject with an empty reason → field error"],
      [5, "reject with a 3-character reason → field error"],
      [6, "verify with two of three checkboxes → field error"],
      [7, "verify sets verified_at and verified_by, and writes one event"],
    ] as const) {
      skip(n, name, "faculty");
    }
  } else if (!student) {
    add(3, "state machine checks", { status: "skip", detail: "no student in the database" });
  } else {
    let mine: Scratch | null = null;
    try {
      mine = await DevFixtures.createSubmittedInternship({
        studentId: student.id,
        // An admin bypasses the ownership guard, so pointing the scratch row at
        // themselves is fine — but it can no longer be null: the CHECK
        // constraint refuses a submitted internship with no reviewer.
        facultyId: session.id,
      });
      const id = mine.internshipId;

      add(
        4,
        "reject with an empty reason → field error on reason",
        await expectFieldError(
          () => verifyInternship(id, { action: "reject", reason: "" }),
          "reason",
        ),
      );

      add(
        5,
        "reject with a 3-character reason → field error on reason",
        await expectFieldError(
          () => verifyInternship(id, { action: "reject", reason: "no." }),
          "reason",
        ),
      );

      add(
        6,
        "verify with two of the three checkboxes → field error",
        await expectFieldError(
          () =>
            verifyInternship(id, {
              action: "verify",
              reason: "",
              confirmIdentity: "on",
              confirmEvidence: "on",
            }),
          "confirmNoPrivateInfo",
        ),
      );

      // The real one. Everything above must have left the row untouched.
      try {
        await verifyInternship(id, { action: "verify", reason: "", ...ALL_TICKED });
        const row = await DevFixtures.readInternship(id);
        const events = await DevFixtures.countEvents(id);

        const ok =
          row?.status === "verified" &&
          row.verifiedAt !== null &&
          row.verifiedBy === session.id &&
          events === 1;

        add(7, "verify sets verified_at and verified_by, and writes one event", {
          status: ok ? "pass" : "fail",
          detail: `status=${row?.status} verifiedAt=${row?.verifiedAt ? "set" : "NULL"} verifiedBy=${
            row?.verifiedBy === session.id ? "actor" : String(row?.verifiedBy)
          } events=${events}`,
        });

        add(
          3,
          "verify the same internship again → InvalidStateError",
          await expectThrow(
            () => verifyInternship(id, { action: "verify", reason: "", ...ALL_TICKED }),
            "InvalidStateError",
          ),
        );
      } catch (error) {
        const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
        add(7, "verify sets verified_at and verified_by", {
          status: "fail",
          detail: `the verify call itself threw — ${message}`,
        });
        add(3, "verify twice → InvalidStateError", {
          status: "skip",
          detail: "the first verify did not succeed",
        });
      }
    } finally {
      if (mine) await DevFixtures.remove(mine);
    }
  }

  /* ── 8 · changing a class advisor must not move a submitted internship ── */

  if (!isAdmin) {
    skip(8, "setClassAdvisor does not touch a submitted internship", "admin");
  } else if (!student || !otherFaculty) {
    add(8, "setClassAdvisor does not touch a submitted internship", {
      status: "skip",
      detail: "needs a second active faculty account and one student",
    });
  } else {
    let scratch: Scratch | null = null;
    let restore: { classId: string; advisorId: string } | null = null;
    try {
      scratch = await DevFixtures.createSubmittedInternship({
        studentId: student.id,
        facultyId: otherFaculty.id,
      });

      const classes = await listClasses();
      const target = classes[0];
      const faculty = await listFacultyOptions();

      // The advisor cannot be cleared any more, so the handover needs a real
      // second faculty member to hand it to.
      const next = target ? faculty.find((f) => f.id !== target.advisor.id) : undefined;

      if (!target) {
        add(8, "setClassAdvisor does not touch a submitted internship", {
          status: "skip",
          detail: "no class exists — build one at /dev/admin/org first",
        });
      } else if (!next) {
        add(8, "setClassAdvisor does not touch a submitted internship", {
          status: "skip",
          detail: `every faculty account already advises ${target.name}; needs a second one`,
        });
      } else {
        restore = { classId: target.id, advisorId: target.advisor.id };

        await setClassAdvisor(target.id, next.id);

        const after = await DevFixtures.readInternship(scratch.internshipId);
        const unchanged = after?.assignedFacultyId === otherFaculty.id;

        add(8, "setClassAdvisor does not touch a submitted internship", {
          status: unchanged ? "pass" : "fail",
          detail: unchanged
            ? `assigned_faculty_id still ${otherFaculty.fullName} after handing ${target.name} to ${next.fullName}`
            : `assigned_faculty_id changed to ${String(after?.assignedFacultyId)} — the advisor must be frozen at submit time`,
        });
      }
    } finally {
      if (restore) await setClassAdvisor(restore.classId, restore.advisorId);
      if (scratch) await DevFixtures.remove(scratch);
    }
  }

  /* ── 9 · a duplicate email is a field error, not a 500 ────────────────── */

  if (!isAdmin) {
    skip(9, "duplicate email → field error on email", "admin");
  } else {
    // There is no createUser any more, so the unique index is exercised through
    // an edit: rename a faculty account onto somebody else's email. Faculty
    // rather than student, so the student-field rules cannot fire first and
    // produce a field error on the wrong control.
    const existing = await listUsers({ page: 1 });
    const subject = existing.items.find((row) => row.role === "faculty");
    const other = existing.items.find((row) => subject && row.id !== subject.id);

    if (!subject || !other) {
      add(9, "duplicate email → field error on email", {
        status: "skip",
        detail: "needs a faculty account and one other user in the database",
      });
    } else {
      const result = await expectFieldError(
        () => updateUser(subject.id, { fullName: subject.fullName, email: other.email }),
        "email",
      );

      // If the constraint did NOT fire, the rename went through. Undo it, or
      // the harness has quietly renamed a real account.
      if (result.status === "fail") {
        const now = await getUser(subject.id);
        if (now.email !== subject.email) {
          await updateUser(subject.id, { fullName: subject.fullName, email: subject.email });
        }
      }

      add(9, `move a faculty account onto ${other.email} → field error on email`, result);
    }
  }

  /* ── 10 · deactivation bumps session_version ──────────────────────────── */

  if (!isAdmin) {
    skip(10, "deactivate bumps session_version and revokes sessions", "admin");
  } else if (!student) {
    add(10, "deactivate bumps session_version", { status: "skip", detail: "no student" });
  } else {
    const before = await DevFixtures.readUser(student.id);
    try {
      await setUserActive(student.id, false);
      const after = await DevFixtures.readUser(student.id);

      const ok =
        after?.isActive === false &&
        before !== null &&
        after !== null &&
        after.sessionVersion > before.sessionVersion;

      add(10, "deactivate sets is_active=false and increments session_version", {
        status: ok ? "pass" : "fail",
        detail: `is_active ${before?.isActive} → ${after?.isActive}, session_version ${before?.sessionVersion} → ${after?.sessionVersion}`,
      });
    } finally {
      // Put them back the way they were.
      if (before?.isActive) await setUserActive(student.id, true);
    }
  }

  /* ── 11 · self-deactivation is refused ────────────────────────────────── */

  if (!isAdmin) {
    skip(11, "an admin cannot deactivate their own account", "admin");
  } else {
    add(
      11,
      "an admin cannot deactivate their own account",
      await expectThrow(() => setUserActive(session.id, false), "ForbiddenError"),
    );
  }

  /* ── 12 · an admin passes every faculty guard ─────────────────────────── */

  if (!isAdmin) {
    skip(12, "an admin may call the faculty controllers", "admin");
  } else {
    try {
      const counts = await getFacultyCounts();
      add(12, "an admin may call the faculty controllers, unscoped", {
        status: "pass",
        detail: `getFacultyCounts() returned ${counts.assignedStudents} students college-wide`,
      });
    } catch (error) {
      add(12, "an admin may call the faculty controllers", {
        status: "fail",
        detail: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
      });
    }
  }

  /* ── 13 · a student who is not on my roster is invisible ──────────────── */

  if (!isFaculty) {
    skip(13, "getStudentHistory for a student who is not mine → NotFoundError", "faculty");
  } else {
    const stranger = await DevFixtures.studentNotAdvisedBy(session.id);
    if (!stranger) {
      add(13, "getStudentHistory for a student who is not mine → NotFoundError", {
        status: "skip",
        detail: "every student in the database is advised by you",
      });
    } else {
      add(
        13,
        "getStudentHistory for a student who is not mine → NotFoundError",
        await expectThrow(() => getStudentHistory(stranger.id), "NotFoundError"),
      );
    }
  }

  /* ── 14 · every guarded route is actually behind the proxy ────────── */

  {
    const uncovered = protectedPrefixes().filter(
      (prefix) => !PROXY_MATCHER.includes(prefix) || !PROXY_MATCHER.includes(`${prefix}/:path*`),
    );

    add(14, "route-policy prefixes all appear in the proxy matcher", {
      status: uncovered.length === 0 ? "pass" : "fail",
      detail:
        uncovered.length === 0
          ? `${protectedPrefixes().join(", ")} — each with its /:path* wildcard`
          : `missing from config.matcher in src/proxy.ts: ${uncovered.join(", ")}`,
    });
  }

  /* ── 15 · a handed-over advisor can still open their own review ────── */

  if (!isFaculty) {
    skip(15, "a student off my roster but holding my internship is visible", "faculty");
  } else {
    const stranger = await DevFixtures.studentNotAdvisedBy(session.id);

    if (!stranger) {
      add(15, "a student off my roster but holding my internship is visible", {
        status: "skip",
        detail: "every student in the database is already advised by you",
      });
    } else {
      let handover: Scratch | null = null;
      try {
        // Exactly the shape a class handover leaves behind: the student's class
        // now belongs to somebody else, but this internship was submitted to me
        // and is frozen that way.
        handover = await DevFixtures.createSubmittedInternship({
          studentId: stranger.id,
          facultyId: session.id,
        });

        const history = await getStudentHistory(stranger.id);
        const ok = history.internships.some((row) => row.id === handover!.internshipId);

        add(15, "a student off my roster but holding my internship is visible", {
          status: ok ? "pass" : "fail",
          detail: ok
            ? `getStudentHistory returned ${history.internships.length} internship(s) for a student I no longer advise`
            : "the internship assigned to me was missing from their history",
        });
      } catch (error) {
        const name = error instanceof Error ? error.name : "Unknown";
        add(15, "a student off my roster but holding my internship is visible", {
          status: "fail",
          detail: `getStudentHistory threw ${name} — clicking through from my own queue would 404`,
        });
      } finally {
        if (handover) await DevFixtures.remove(handover);
      }
    }
  }

  /* ── 16 · an advisor holding classes cannot be deactivated ─────────── */

  if (!isAdmin) {
    skip(16, "deactivating a faculty member who still advises a class is refused", "admin");
  } else {
    const faculty = await listFacultyOptions();
    // Pick one that actually holds classes — the guard is a no-op otherwise.
    const counts = await Promise.all(
      faculty.map(async (f) => ({ f, n: (await listClasses()).filter((c) => c.advisor.id === f.id).length })),
    );
    const holder = counts.find((c) => c.n > 0);

    if (!holder) {
      add(16, "deactivating a faculty member who still advises a class is refused", {
        status: "skip",
        detail: "no faculty member currently advises a class",
      });
    } else {
      // Safe to run for real: the whole point is that it is refused, so nothing
      // is mutated. A pass here means no side effect either.
      add(
        16,
        `deactivating ${holder.f.fullName} (${holder.n} class(es)) is refused`,
        await expectThrow(() => setUserActive(holder.f.id, false), "InvalidStateError"),
      );
    }
  }

  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const skipped = results.filter((r) => r.status === "skip").length;

  return (
    <>
      <Section
        title="/dev/checks"
        subtitle={`Signed in as ${session.role}. Run once as faculty and once as admin — each role can only exercise part of the suite.`}
      >
        <p className="text-xs">
          <Pill tone="ok">{passed} pass</Pill> <Pill tone={failed ? "bad" : "mute"}>{failed} fail</Pill>{" "}
          <Pill tone="mute">{skipped} skip</Pill>
          {swept > 0 && (
            <span className="ml-2 text-zinc-500">swept {swept} leftover scratch row(s)</span>
          )}
        </p>

        <Table head={["#", "check", "result", "detail"]}>
          {results
            .sort((a, b) => a.n - b.n)
            .map((r) => (
              <Row key={r.n}>
                <Cell mono>{r.n}</Cell>
                <Cell>{r.name}</Cell>
                <Cell>
                  <Pill tone={r.status === "pass" ? "ok" : r.status === "fail" ? "bad" : "mute"}>
                    {r.status}
                  </Pill>
                </Cell>
                <Cell mono>{r.detail}</Cell>
              </Row>
            ))}
        </Table>
      </Section>

      <Section title="what this run leaves behind" subtitle="Verified by snapshotting the database before and after.">
        <ul className="list-disc space-y-1 pl-5 text-xs text-zinc-600">
          <li>
            <strong>As faculty: nothing.</strong> Every scratch row is removed, and no seeded row
            is touched.
          </li>
          <li>
            <strong>As admin: one column.</strong> Check 10 deactivates a student and puts them
            back, so that student&apos;s <code className="font-mono">session_version</code> ends up
            two higher than it started. That is unavoidable — bumping it is the behaviour under
            test, and restoring bumps it again. It is harmless: the column only invalidates access
            tokens, and it is re-read on every request.
          </li>
        </ul>
      </Section>

      <Section title="what is not covered here" subtitle="">
        <ul className="list-disc space-y-1 pl-5 text-xs text-zinc-600">
          <li>
            The database CHECK <code className="font-mono">verification_events_reason_ck</code> is
            never reached, because zod refuses a short reason first. That is the intended layering —
            the constraint is a backstop for a controller bug, not a validation path.
          </li>
          <li>
            Token rotation, reuse detection and the deactivated-user bounce are exercised by
            signing in and waiting, not from here.
          </li>
          <li>
            The <em>successful</em> deactivation of a faculty member with no classes. Check 16
            covers the refusal, which is the interesting half; the success path is the same code
            as check 10.
          </li>
          <li>
            Document downloads are package 2&apos;s. This package only reads the rows.
          </li>
        </ul>
      </Section>
    </>
  );
}
