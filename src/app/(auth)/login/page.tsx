import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "../auth-card";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in — InternLens",
};

export default function LoginPage() {
  return (
    <AuthCard
      title="Sign in"
      subtitle="Students, faculty and administrators all sign in here."
      footer={
        <>
          New student?{" "}
          <Link href="/register" className="font-medium text-zinc-900 underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
