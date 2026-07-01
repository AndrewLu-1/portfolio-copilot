import { auth } from "@/auth";

export async function getApiSessionUser() {
  const session = await auth();

  return session?.user ?? null;
}
