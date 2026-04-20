"use client";

import { useActionState } from "react";

import {
  createHoldingAction,
  type DashboardMutationState,
} from "@/app/dashboard/actions";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { SubmitButton } from "@/components/ui/SubmitButton";

const initialState: DashboardMutationState = {};

type HoldingCreateFormProps = {
  accountId: string;
  etfOptions: Array<{
    ticker: string;
    name: string;
  }>;
};

export function HoldingCreateForm({
  accountId,
  etfOptions,
}: HoldingCreateFormProps) {
  const [state, formAction, pending] = useActionState(
    createHoldingAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
      <input type="hidden" name="accountId" value={accountId} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_160px_160px]">
        <SelectField
          label="ETF"
          name="ticker"
          disabled={pending}
          options={etfOptions.map((etf) => ({
            label: `${etf.ticker} · ${etf.name}`,
            value: etf.ticker,
          }))}
        />
        <FormField
          label="Units"
          name="units"
          type="number"
          step="0.000001"
          min="0"
          placeholder="25"
          required
          disabled={pending}
        />
        <FormField
          label="Avg cost / unit"
          name="averageCostPerUnit"
          type="number"
          step="0.0001"
          min="0"
          placeholder="33.81"
          required
          disabled={pending}
        />
      </div>
      <p aria-live="polite" className="min-h-5 text-sm text-rose-600 dark:text-rose-400">
        {state.error ?? ""}
      </p>
      <SubmitButton
        label="Add holding"
        pendingLabel="Adding holding..."
        className="justify-center"
      />
    </form>
  );
}
