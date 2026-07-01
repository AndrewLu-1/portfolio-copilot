import { hash } from "bcryptjs";
import { z } from "zod";

import {
  createCredentialsUser,
  findUserByEmail,
} from "@/lib/repositories/user-repository";

const registerSchema = z
  .object({
    name: z.string().trim().max(80).optional(),
    email: z.string().trim().email(),
    password: z.string().min(8).max(100),
    confirmPassword: z.string().min(8).max(100),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type RegisterCredentialsUserInput = {
  name?: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export async function registerCredentialsUser(
  input: RegisterCredentialsUserInput,
) {
  const parsedInput = registerSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new Error(parsedInput.error.issues[0]?.message ?? "Invalid sign-up data.");
  }

  const existingUser = await findUserByEmail(parsedInput.data.email);

  if (existingUser) {
    throw new Error("An account with that email already exists.");
  }

  const passwordHash = await hash(parsedInput.data.password, 12);

  return createCredentialsUser({
    email: parsedInput.data.email,
    name: parsedInput.data.name,
    passwordHash,
  });
}
