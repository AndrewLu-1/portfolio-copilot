export default function DashboardLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-10 sm:px-10 lg:px-12">
      <section className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <div className="animate-pulse space-y-8">
          <div className="space-y-4">
            <div className="h-7 w-44 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-32 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-12 max-w-md rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 max-w-3xl rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 max-w-2xl rounded-full bg-zinc-200 dark:bg-zinc-800" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900"
              >
                <div className="h-4 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="mt-3 h-8 w-28 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="mt-3 h-4 w-full rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="mt-2 h-4 w-4/5 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        {Array.from({ length: 2 }).map((_, index) => (
          <section
            key={index}
            className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950"
          >
            <div className="animate-pulse space-y-4">
              <div className="h-4 w-36 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-8 w-64 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-4 w-full rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-4 w-4/5 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <div className="space-y-3 pt-2">
                {Array.from({ length: 3 }).map((__, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900"
                  >
                    <div className="h-4 w-28 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                    <div className="mt-3 h-4 w-full rounded-full bg-zinc-200 dark:bg-zinc-800" />
                    <div className="mt-2 h-4 w-2/3 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
      </section>
    </main>
  );
}
