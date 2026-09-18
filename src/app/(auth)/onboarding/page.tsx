import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getOrgTree } from "@/controllers/auth.controller";
import { requirePageUser } from "@/lib/auth/dal";
import { HOME_FOR_ROLE } from "@/lib/constants/roles";
import { findByUserId } from "@/models/student-profile.model";

import { AuthCard } from "../auth-card";
import { OnboardingForm } from "./OnboardingForm";

export const metadata: Metadata = {
  title: "Finish setting up your account — InternLens",
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requirePageUser();

  // Only a provisional OAuth student may choose their final role here. Normal
  // faculty and every already-routed student belong at their home route.
  if (user.role !== "student" || (await findByUserId(user.id))) {
    redirect(HOME_FOR_ROLE[user.role]);
  }

  const tree = await getOrgTree();

  return (
    <AuthCard
      headline={
        <>
          One more <span className="text-[#c8ef5a]">step</span>.
        </>
      }
      blurb="Tell us how you take part in InternLens so we can route your work correctly."
      title="Finish your account"
      subtitle="Your Google identity is verified. Complete the details InternLens needs."
      footer={null}
    >
      <OnboardingForm tree={tree} />
    </AuthCard>
  );
}
