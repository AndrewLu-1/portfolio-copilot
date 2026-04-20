"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const allocationData = [
  { name: "XEQT", weight: 42, color: "#14b8a6" },
  { name: "XAW", weight: 28, color: "#3b82f6" },
  { name: "VCN", weight: 18, color: "#8b5cf6" },
  { name: "ZAG", weight: 12, color: "#f59e0b" },
];

export function AllocationPlaceholder() {
  return (
    <section className="rounded-3xl border border-black/10 bg-zinc-50 p-5 dark:border-white/10 dark:bg-zinc-900">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
          Placeholder chart
        </p>
        <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Sample ETF allocation
        </h2>
        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          This static chart exists to verify the Recharts integration during the
          bootstrap phase.
        </p>
      </div>

      <div className="mt-6 overflow-x-auto">
        <BarChart width={420} height={288} data={allocationData} barCategoryGap={18}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" />
          <YAxis unit="%" />
          <Tooltip
            formatter={(value) => {
              const normalizedValue =
                typeof value === "number"
                  ? value
                  : Number.parseFloat(String(value ?? 0));

              return [`${normalizedValue}%`, "Weight"];
            }}
          />
          <Bar dataKey="weight" radius={[8, 8, 0, 0]}>
            {allocationData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </div>
    </section>
  );
}
