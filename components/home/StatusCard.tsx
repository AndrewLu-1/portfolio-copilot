export type StatusCardProps = {
  label: string;
  value: string;
  detail: string;
};

export function StatusCard({ label, value, detail }: StatusCardProps) {
  return (
    <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900">
      <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
        {value}
      </dd>
      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
        {detail}
      </p>
    </div>
  );
}
