"use client";

import { useActionState } from "react";

import {
  deleteHoldingAction,
  type DashboardMutationState,
  updateHoldingAction,
} from "@/app/dashboard/actions";
import { FormField } from "@/components/ui/FormField";
import { SubmitButton } from "@/components/ui/SubmitButton";

const initialState: DashboardMutationState = {};

type HoldingEditFormProps = {
  holdingId: string;
  ticker: string;
  name?: string;
  units: number;
  averageCostPerUnit: number;
};

export function HoldingEditForm({
  holdingId,
  ticker,
  name,
  units,
  averageCostPerUnit,
}: HoldingEditFormProps) {
  const [state, formAction, pending] = useActionState(
    updateHoldingAction,
    initialState,
  );

  return (
    <div className="space-y-3 rounded-2xl bg-white px-4 py-3 dark:bg-zinc-950">
      <div>
        <p className="font-semibold text-zinc-950 dark:text-zinc-50">{ticker}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{name}</p>
      </div>
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="holdingId" value={holdingId} />
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            label="Units"
            name="units"
            type="number"
            step="0.000001"
            min="0"
            defaultValue={units.toFixed(6)}
            required
            disabled={pending}
          />
          <FormField
            label="Avg cost / unit"
            name="averageCostPerUnit"
            type="number"
            step="0.0001"
            min="0"
            defaultValue={averageCostPerUnit.toFixed(4)}
            required
            disabled={pending}
          />
        </div>
        <p aria-live="polite" className="min-h-5 text-sm text-rose-600 dark:text-rose-400">
          {state.error ?? ""}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton
            label="Save holding"
            pendingLabel="Saving..."
            className="justify-center"
          />
        </div>
      </form>
      <form action={deleteHoldingAction}>
        <input type="hidden" name="holdingId" value={holdingId} />
        <button
          type="submit"
          className="text-sm font-medium text-rose-600 transition hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300"
        >
          Delete holding
        </button>
      </form>
    </div>
  );
}
