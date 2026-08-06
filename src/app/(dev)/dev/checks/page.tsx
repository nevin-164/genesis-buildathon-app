import {
  setClassAdvisor,
} from "@/controllers/admin/assignment.controller";
import { getClass, listClasses } from "@/controllers/admin/org.controller";
import { createUser, listUsers, setUserActive } from "@/controllers/admin/user.controller";
import { getFacultyCounts, getStudentHistory } from "@/controllers/faculty.controller";
import { getVerificationDetail, verifyInternship } from "@/controllers/verification.controller";
import { getSession } from "@/lib/auth/dal";
import { DevFixtures, type Scratch } from "@/models/dev-fixtures.model";

import { Cell, Pill, Row, Section, Table } from "../_ui";

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
    results.push({ n, name, status: "skip", detail: `needs DEV_FAKE_ROLE=${needs}` });

  if (!session) {
    return (
      <Section title="/dev/checks" subtitle="">
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">
          No session. Set <code className="font-mono">DEV_FAKE_ROLE</code> in{" "}
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
        // An admin bypasses the ownership guard, so either value works for them.
        facultyId: isFaculty ? session.id : null,
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
    let restore: { classId: string; advisorId: string | null } | null = null;
    try {
      scratch = await DevFixtures.createSubmittedInternship({
        studentId: student.id,
        facultyId: otherFaculty.id,
      });

      const classes = await listClasses();
      const target = classes[0];

      if (!target) {
        add(8, "setClassAdvisor does not touch a submitted internship", {
          status: "skip",
          detail: "no class exists — build one at /dev/admin/org first",
        });
      } else {
        const before = await getClass(target.id);
        restore = { classId: target.id, advisorId: before.advisor?.id ?? null };

        // Point the class somewhere different from whatever it is now.
        const next = before.advisor?.id === otherFaculty.id ? null : otherFaculty.id;
        await setClassAdvisor(target.id, next);

        const after = await DevFixtures.readInternship(scratch.internshipId);
        const unchanged = after?.assignedFacultyId === otherFaculty.id;

        add(8, "setClassAdvisor does not touch a submitted internship", {
          status: unchanged ? "pass" : "fail",
          detail: unchanged
            ? `assigned_faculty_id still ${otherFaculty.fullName} after re-pointing class ${target.name}`
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
    const existing = await listUsers({ page: 1 });
    const taken = existing.items[0];
    if (!taken) {
      add(9, "duplicate email → field error on email", {
        status: "skip",
        detail: "no users in the database",
      });
    } else {
      add(
        9,
        `create a user with ${taken.email} → field error on email`,
        await expectFieldError(
          () =>
            createUser({
              role: "faculty",
              fullName: "Duplicate Probe",
              email: taken.email,
              password: "not-a-real-password",
            }),
          "email",
        ),
      );
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
            Token rotation, reuse detection and the deactivated-user bounce belong to package 1 —
            there is no login page yet to exercise them.
          </li>
          <li>
            Document downloads are package 2&apos;s. This package only reads the rows.
          </li>
        </ul>
      </Section>
    </>
  );
}
