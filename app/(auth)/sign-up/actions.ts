"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/auth";
import { registerCredentialsUser } from "@/lib/services";

export type SignUpFormState = {
  error?: string;
};

export async function signUpAction(
  _previousState: SignUpFormState,
  formData: FormData,
): Promise<SignUpFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  try {
    await registerCredentialsUser({
      name: name || undefined,
      email,
      password,
      confirmPassword,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unable to create your account.",
    };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/onboarding",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error:
          "Your account was created, but automatic sign-in failed. Please sign in manually.",
      };
    }

    throw error;
  }

  return {};
}
