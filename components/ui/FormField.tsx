import type { InputHTMLAttributes } from "react";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

export function FormField({
  label,
  hint,
  className = "",
  id,
  name,
  ...props
}: FormFieldProps) {
  const fieldId = id ?? name;

  return (
    <label htmlFor={fieldId} className="block space-y-2">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
        {label}
      </span>
      <input
        {...props}
        id={fieldId}
        name={name}
        className={`w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-950/50 ${className}`}
      />
      {hint ? (
        <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">{hint}</p>
      ) : null}
    </label>
  );
}
