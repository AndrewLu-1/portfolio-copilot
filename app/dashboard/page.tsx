import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireCurrentSessionUser } from "@/lib/auth/session";
import { getDashboardEditorOptions, getDashboardOverview } from "@/lib/services";

export default async function DashboardPage() {
  const user = await requireCurrentSessionUser();
  const [overview, editorOptions] = await Promise.all([
    getDashboardOverview(user.id),
    getDashboardEditorOptions(user.id),
  ]);

  if (!overview) {
    redirect("/onboarding");
  }

  if (!editorOptions) {
    redirect("/onboarding");
  }

  return (
    <DashboardShell
      overview={overview}
      editorOptions={editorOptions}
      userName={user.name}
    />
  );
}
