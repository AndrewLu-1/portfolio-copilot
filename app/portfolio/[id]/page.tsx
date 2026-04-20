import { notFound } from "next/navigation";

import { PortfolioWorkspace } from "@/components/portfolio/PortfolioWorkspace";
import { requireCurrentSessionUser } from "@/lib/auth/session";
import { getOwnedPortfolioWorkspace } from "@/lib/services";

export default async function PortfolioWorkspacePage(
  props: { params: Promise<{ id: string }> },
) {
  const user = await requireCurrentSessionUser();
  const { id } = await props.params;
  const workspace = await getOwnedPortfolioWorkspace(user.id, id);

  if (!workspace) {
    notFound();
  }

  return <PortfolioWorkspace workspace={workspace} userName={user.name} />;
}
