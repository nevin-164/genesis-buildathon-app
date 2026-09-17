import "server-only";

import { count } from "drizzle-orm";

import { classes, db } from "@/db";
import type { AdminCounts } from "@/types/contracts";

import { AdminUsers } from "./admin-user.model";
import { Verification } from "./verification.model";

/**
 * The numbers on the admin dashboard.
 *
 * They span users, classes and internships, so this is not a per-table model —
 * it is the one aggregate read, kept in a file of its own so the per-table
 * models stay about their own table.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THREE queries, not six. Each source collapses its own numbers with
 * `count(*) filter (where …)`. The first version fired one COUNT per tile, and
 * six concurrent connections from a single page render was enough to exhaust
 * the Supabase pooler's client limit and hang the request for minutes. A
 * dashboard is the page most likely to be everyone's first request of the day,
 * so it is the worst place to fan out.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * There are no "needs attention" numbers left. "Internships with no verifier"
 * and "classes with no advisor" were the two, and both are now unrepresentable:
 * `classes.advisor_id` and `student_profiles.class_id` are NOT NULL, so every
 * submission resolves a reviewer. Counting a state the database refuses to
 * store is a tile that reads 0 forever.
 */

export const AdminStats = {
  async counts(): Promise<AdminCounts> {
    const [people, internships, totalClasses] = await Promise.all([
      AdminUsers.roleCounts(),
      Verification.dashboardCounts(),
      AdminStats.countClasses(),
    ]);

    return {
      totalStudents: people.students,
      totalFaculty: people.faculty,
      totalClasses,
      pendingVerifications: internships.pendingVerifications,
      publishedInternships: internships.publishedInternships,
    };
  },

  async countClasses(): Promise<number> {
    const [row] = await db.select({ value: count() }).from(classes);
    return row?.value ?? 0;
  },
};
