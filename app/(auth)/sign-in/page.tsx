import { redirect } from "next/navigation";

import { AuthPageTemplate } from "@/components/auth/AuthPageTemplate";
import { SignInForm } from "@/components/auth/SignInForm";
import { getCurrentSessionUser } from "@/lib/auth/session";

export default async function SignInPage(props: {
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
      badge="Phase 3 auth UI is live"
      title="Sign in to your ETF portfolio workspace"
      description="Jump back into your onboarding progress, review your saved target allocation, and keep the first dashboard shell tied to a real authenticated session."
      alternatePrompt="New here?"
      alternateLabel="Create an account"
      alternateHref={safeCallbackUrl ? `/sign-up?callbackUrl=${encodeURIComponent(safeCallbackUrl)}` : "/sign-up"}
      highlights={[
        {
          label: "Auth flow",
          value: "Credentials",
          detail: "Uses the existing Auth.js server action path.",
        },
        {
          label: "Redirect",
          value: "/dashboard",
          detail: "Successful sign-in lands on the portfolio shell.",
        },
        {
          label: "Fallback",
          value: "/onboarding",
          detail: "Users without a portfolio are rerouted cleanly.",
        },
        {
          label: "Style",
          value: "Landing match",
          detail: "Uses the same soft cards and neutral palette.",
        },
      ]}
    >
      <SignInForm callbackUrl={safeCallbackUrl} />
    </AuthPageTemplate>
  );
}
