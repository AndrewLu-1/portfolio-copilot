import { redirect } from "next/navigation";

import { AuthPageTemplate } from "@/components/auth/AuthPageTemplate";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { getCurrentSessionUser } from "@/lib/auth/session";

export default async function SignUpPage(props: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const user = await getCurrentSessionUser();
  const searchParams = await props.searchParams;
  const callbackUrl = searchParams.callbackUrl;
  const safeCallbackUrl =
    callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : undefined;

  if (user) {
    redirect(safeCallbackUrl ?? "/dashboard");
  }

  return (
    <AuthPageTemplate
      badge="Phase 3 account creation"
      title="Create your account and start onboarding"
      description="Set up credentials, move directly into portfolio onboarding, and keep the first-run experience aligned with the rest of the product shell."
      alternatePrompt="Already registered?"
      alternateLabel="Sign in instead"
      alternateHref={safeCallbackUrl ? `/sign-in?callbackUrl=${encodeURIComponent(safeCallbackUrl)}` : "/sign-in"}
      highlights={[
        {
          label: "Sign-up action",
          value: "Server wired",
          detail: "Uses the existing registration service and action.",
        },
        {
          label: "Auto sign-in",
          value: "Enabled",
          detail: "Successful registration continues into onboarding.",
        },
        {
          label: "Portfolio setup",
          value: "Next step",
          detail: "The first portfolio is created right after account creation.",
        },
        {
          label: "Visual tone",
          value: "Consistent",
          detail: "Built from the same rounded Tailwind surfaces as home.",
        },
      ]}
    >
      <SignUpForm callbackUrl={safeCallbackUrl} />
    </AuthPageTemplate>
  );
}
