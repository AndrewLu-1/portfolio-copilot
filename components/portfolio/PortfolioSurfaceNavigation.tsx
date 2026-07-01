import Link from "next/link";

type PortfolioSurfaceNavigationProps = {
  portfolioId: string;
  activeTab: "workspace" | "recommendation" | "rebalance";
  sectionLinks?: Array<{
    href: string;
    label: string;
  }>;
};

const surfaceTabs = [
  { key: "workspace", href: (portfolioId: string) => `/portfolio/${portfolioId}`, label: "Workspace" },
  {
    key: "recommendation",
    href: (portfolioId: string) => `/portfolio/${portfolioId}/recommendation`,
    label: "Recommendation",
  },
  {
    key: "rebalance",
    href: (portfolioId: string) => `/portfolio/${portfolioId}/rebalance`,
    label: "Rebalance",
  },
] as const;

export function PortfolioSurfaceNavigation({
  portfolioId,
  activeTab,
  sectionLinks = [],
}: PortfolioSurfaceNavigationProps) {
  return (
    <div className="rounded-3xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900/80">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
          Portfolio surface
        </p>
        <nav aria-label="Portfolio surface tabs" className="flex flex-wrap gap-3">
          {surfaceTabs.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <Link
                key={tab.key}
                href={tab.href(portfolioId)}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950"
                    : "border border-black/10 bg-white text-zinc-700 hover:border-zinc-300 hover:text-zinc-950 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-white/20 dark:hover:text-zinc-50"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {sectionLinks.length > 0 ? (
        <div className="mt-4 border-t border-black/10 pt-4 dark:border-white/10">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              Workspace sections
            </p>
            <nav aria-label="Portfolio workspace sections" className="flex flex-wrap gap-3">
              {sectionLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-white/20 dark:hover:text-zinc-50"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}
