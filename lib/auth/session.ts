import { redirect } from "next/navigation";

import { auth } from "@/auth";

export async function getCurrentSessionUser() {
  const session = await auth();

  return session?.user ?? null;
}

export async function requireCurrentSessionUser() {
  const user = await getCurrentSessionUser();

  if (!user?.id) {
    redirect("/sign-in");
  }

  return user;
}
