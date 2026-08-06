import "server-only";

import { count, isNull } from "drizzle-orm";

import { classes, db } from "@/db";
import type { AdminCounts } from "@/types/contracts";

import { AdminUsers } from "./admin-user.model";
import { Verification } from "./verification.model";

/**
 * The six numbers on the admin dashboard.
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
 * The two "needs attention" numbers matter most: an internship with no advisor
 * is stuck, and a class with no advisor is how internships get stuck.
 */

export const AdminStats = {
  async counts(): Promise<AdminCounts> {
    const [people, internships, classesWithoutAdvisor] = await Promise.all([
      AdminUsers.roleCounts(),
      Verification.dashboardCounts(),
      AdminStats.countClassesWithoutAdvisor(),
    ]);

    return {
      totalStudents: people.students,
      totalFaculty: people.faculty,
      unassignedInternships: internships.unassignedInternships,
      classesWithoutAdvisor,
      pendingVerifications: internships.pendingVerifications,
      publishedInternships: internships.publishedInternships,
    };
  },

  async countClassesWithoutAdvisor(): Promise<number> {
    const [row] = await db
      .select({ value: count() })
      .from(classes)
      .where(isNull(classes.advisorId));
    return row?.value ?? 0;
  },
};
