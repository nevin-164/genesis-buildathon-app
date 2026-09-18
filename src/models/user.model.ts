import "server-only";

import { asc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { batches, classes, departments, studentProfiles } from "@/db/schema/org";
import { users } from "@/db/schema/users";
import type { User } from "@/db/schema/users";
import type { OrgTree, Role } from "@/types/contracts";

/** Emails are stored lower-cased and trimmed, so every lookup has to match. */
function normaliseEmail(email: string): string {
  return email.toLowerCase().trim();
}

export const UserModel = {
  async findById(id: string): Promise<User | null> {
    const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return row ?? null;
  },

  async findByEmail(email: string): Promise<User | null> {
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.email, normaliseEmail(email)))
      .limit(1);
    return row ?? null;
  },

  /**
   * Faculty self-registration. Students come in through `createStudent`, which
   * has a profile row to write in the same transaction.
   *
   * `role` is typed as the two self-registerable roles, not `Role`. The only
   * admin is the one in the seed — promotion is an out-of-band act, and a
   * signature that accepts "admin" is one careless caller away from a
   * self-service one.
   */
  async createUser(data: {
    email: string;
    passwordHash: string;
    fullName: string;
    role: Exclude<Role, "admin">;
  }): Promise<User> {
    const [row] = await db
      .insert(users)
      .values({ ...data, email: normaliseEmail(data.email) })
      .returning();
    return row;
  },

  /**
   * The user row and its student profile go in together or not at all — a
   * student without a profile has no register number and no advisor path.
   *
   * `classId` is required. It is what resolves their reviewer, and a student
   * who cannot be reviewed is the state the whole org tree exists to prevent;
   * registration refuses to proceed without one.
   */
  async createStudent(
    userData: { email: string; passwordHash: string; fullName: string },
    studentData: { registerNumber: string; classId: string },
  ): Promise<User> {
    return db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          email: normaliseEmail(userData.email),
          passwordHash: userData.passwordHash,
          fullName: userData.fullName,
          role: "student",
        })
        .returning();

      await tx.insert(studentProfiles).values({
        userId: user.id,
        registerNumber: studentData.registerNumber.trim(),
        classId: studentData.classId,
      });

      return user;
    });
  },

  /**
   * The kill switch. Bumping this invalidates every access token already handed
   * out for this user, because the DAL compares it to the token's `sv` claim.
   */
  async incrementSessionVersion(id: string): Promise<User | null> {
    const [row] = await db
      .update(users)
      .set({ sessionVersion: sql`${users.sessionVersion} + 1` })
      .where(eq(users.id, id))
      .returning();
    return row ?? null;
  },

  async updateLastLogin(id: string): Promise<void> {
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, id));
  },

  /** Deactivation is the only removal path — nothing is ever deleted. */
  async deactivateUser(id: string): Promise<User | null> {
    const [row] = await db
      .update(users)
      .set({ isActive: false, sessionVersion: sql`${users.sessionVersion} + 1` })
      .where(eq(users.id, id))
      .returning();
    return row ?? null;
  },

  /**
   * Ids and names for the registration dropdowns. No personal data, which is
   * why the controller above it can serve this to a visitor who is not signed
   * in yet.
   */
  async getRegistrationTree(): Promise<OrgTree> {
    const [departmentRows, batchRows, classRows] = await Promise.all([
      db
        .select({ id: departments.id, code: departments.code, name: departments.name })
        .from(departments)
        .orderBy(asc(departments.code)),
      db
        .select({ id: batches.id, departmentId: batches.departmentId, name: batches.name })
        .from(batches)
        .orderBy(asc(batches.name)),
      db
        .select({ id: classes.id, batchId: classes.batchId, name: classes.name })
        .from(classes)
        .orderBy(asc(classes.name)),
    ]);

    return { departments: departmentRows, batches: batchRows, classes: classRows };
  },

  async markEmailVerified(id: string): Promise<void> {
    await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, id));
  },
};
