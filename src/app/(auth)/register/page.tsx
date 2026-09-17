import type { Metadata } from "next";
import Link from "next/link";

import { getOrgTree } from "@/controllers/auth.controller";
import { requireGuestPage } from "@/lib/auth/dal";

import { AuthCard } from "../auth-card";
import { AUTH_LINK } from "../auth-ui";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Create an account — InternLens",
};

/**
 * Always fetched fresh. The dropdowns have to show a class the moment an admin
 * adds it, and a cached tree would hide a new student's own class from them.
 */
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  // Signed in already: this page has nothing for them, and the sign-up form
  // reads as a broken session.
  await requireGuestPage();

  const tree = await getOrgTree();

  return (
    <AuthCard
      headline={
        <>
          Get <span className="text-[#c8ef5a]">started</span>.
        </>
      }
      blurb="Write up the internships you have done, or verify the ones your students submit."
      title="Create an account"
      subtitle="Students and faculty. The administrator account is created during setup."
      footer={
        <>
          Already registered?{" "}
          <Link href="/login" className={AUTH_LINK}>
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm tree={tree} />
    </AuthCard>
  );
}
