import type { Metadata } from "next";

import { getSession } from "@/lib/auth/dal";

import { AuthCard } from "../auth-card";
import { VerifyPanel } from "./VerifyPanel";

export const metadata: Metadata = {
  title: "Verify Email — InternLens",
};

export default async function VerifyPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const token = typeof searchParams.token === "string" ? searchParams.token : undefined;

  const session = await getSession();

  return (
    <AuthCard
      headline={
        <>
          Verify your <span className="text-[#c8ef5a]">email</span>.
        </>
      }
      blurb="Please confirm your email address to access InternLens."
      title={token ? "Confirm Email" : "Check your inbox"}
      subtitle={
        token
          ? "Confirm your address to activate your account."
          : "We need to verify your email before you can proceed."
      }
      footer={<span>Need help? Contact support or try logging in again.</span>}
    >
      <VerifyPanel token={token} userEmail={session?.email} />
    </AuthCard>
  );
}
