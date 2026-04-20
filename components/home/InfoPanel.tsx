export type InfoPanelProps = {
  title: string;
  description: string;
  items: string[];
};

export function InfoPanel({ title, description, items }: InfoPanelProps) {
  return (
    <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
      <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
        {description}
      </p>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-700 dark:text-zinc-200">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 h-2 w-2 rounded-full bg-emerald-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
