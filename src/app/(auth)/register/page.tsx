import type { Metadata } from "next";
import Link from "next/link";

import { getOrgTree } from "@/controllers/auth.controller";

import { AuthCard } from "../auth-card";
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
  const tree = await getOrgTree();

  return (
    <AuthCard
      title="Create an account"
      subtitle="Student registration. Faculty and administrator accounts are created by an admin."
      footer={
        <>
          Already registered?{" "}
          <Link href="/login" className="font-medium text-zinc-900 underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm tree={tree} />
    </AuthCard>
  );
}
