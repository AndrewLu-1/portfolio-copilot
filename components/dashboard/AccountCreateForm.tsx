"use client";

import { useActionState } from "react";

import {
  createAccountAction,
  type DashboardMutationState,
} from "@/app/dashboard/actions";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { SubmitButton } from "@/components/ui/SubmitButton";

const initialState: DashboardMutationState = {};

type AccountCreateFormProps = {
  accountTypes: readonly string[];
};

export function AccountCreateForm({ accountTypes }: AccountCreateFormProps) {
  const [state, formAction, pending] = useActionState(
    createAccountAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-black/10 bg-zinc-50 p-5 dark:border-white/10 dark:bg-zinc-900">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
        <FormField
          label="Account name"
          name="name"
          placeholder="TFSA"
          required
          disabled={pending}
        />
        <SelectField
          label="Account type"
          name="accountType"
          disabled={pending}
          options={accountTypes.map((accountType) => ({
            label: accountType,
            value: accountType,
          }))}
        />
      </div>
      <p aria-live="polite" className="min-h-6 text-sm text-rose-600 dark:text-rose-400">
        {state.error ?? ""}
      </p>
      <SubmitButton
        label="Add account"
        pendingLabel="Adding account..."
        className="justify-center"
      />
    </form>
  );
}
