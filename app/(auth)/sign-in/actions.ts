"use server";

import { AuthError } from "next-auth";
import { z } from "zod";

import { signIn } from "@/auth";

const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export type SignInFormState = {
  error?: string;
};

function readCallbackUrl(formData: FormData) {
  const callbackUrl = String(formData.get("callbackUrl") ?? "").trim();

  if (!callbackUrl || !callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return "/dashboard";
  }

  return callbackUrl;
}

export async function signInAction(
  _previousState: SignInFormState,
  formData: FormData,
): Promise<SignInFormState> {
  const callbackUrl = readCallbackUrl(formData);
  const parsedInput = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsedInput.success) {
    return {
      error: "Enter a valid email and password.",
    };
  }

  try {
    await signIn("credentials", {
      email: parsedInput.data.email,
      password: parsedInput.data.password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return {
          error: "Invalid email or password.",
        };
      }

      return {
        error: "Unable to sign in right now.",
      };
    }

    throw error;
  }

  return {};
}
