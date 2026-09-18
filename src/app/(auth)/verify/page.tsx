import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/dal";
import { HOME_FOR_ROLE } from "@/lib/constants/roles";

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

  /*
   * A token always wins over a session: the link in the mail need not belong to
   * whoever happens to be signed in on this browser, so a request carrying one
   * is always shown the confirm form. Only the tokenless visits are sorted out
   * here.
   */
  if (!token) {
    // Nothing to confirm and nobody to confirm it for. Neither control on the
    // page works signed out: there is no token to submit, and "resend" needs a
    // session to know whose address to send to.
    if (!session) redirect("/login");

    // Confirmed already. Without this they sit on "check your inbox" for an
    // address that is verified, with a resend button as the only way out.
    if (session.emailVerifiedAt) redirect(HOME_FOR_ROLE[session.role]);
  }

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
