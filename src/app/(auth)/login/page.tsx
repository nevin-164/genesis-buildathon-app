import type { Metadata } from "next";
import Link from "next/link";

import { requireGuestPage } from "@/lib/auth/dal";

import { AuthCard } from "../auth-card";
import { AUTH_LINK } from "../auth-ui";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in — InternLens",
};

export default async function LoginPage() {
  // Signed in already: send them to their own dashboard rather than offer
  // credentials they have evidently got.
  await requireGuestPage();

  return (
    <AuthCard
      headline={
        <>
          Welcome <span className="text-[#c8ef5a]">back</span>.
        </>
      }
      blurb="Verified internship records, written by students and checked by faculty."
      title="Sign in"
      subtitle="Students, faculty and administrators all sign in here."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className={AUTH_LINK}>
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
