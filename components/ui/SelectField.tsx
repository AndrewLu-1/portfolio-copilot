import type { SelectHTMLAttributes } from "react";

type SelectFieldOption = {
  label: string;
  value: string;
};

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: SelectFieldOption[];
  hint?: string;
};

export function SelectField({
  label,
  options,
  hint,
  className = "",
  id,
  name,
  ...props
}: SelectFieldProps) {
  const fieldId = id ?? name;

  return (
    <label htmlFor={fieldId} className="block space-y-2">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
        {label}
      </span>
      <select
        {...props}
        id={fieldId}
        name={name}
        className={`w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-emerald-500 dark:focus:ring-emerald-950/50 ${className}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? (
        <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">{hint}</p>
      ) : null}
    </label>
  );
}
