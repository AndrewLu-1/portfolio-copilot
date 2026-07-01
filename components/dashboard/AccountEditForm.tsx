"use client";

import { useActionState } from "react";

import {
  deleteAccountAction,
  type DashboardMutationState,
  updateAccountAction,
} from "@/app/dashboard/actions";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { SubmitButton } from "@/components/ui/SubmitButton";

const initialState: DashboardMutationState = {};

type AccountEditFormProps = {
  accountId: string;
  name: string;
  accountType: string;
  accountTypes: readonly string[];
};

export function AccountEditForm({
  accountId,
  name,
  accountType,
  accountTypes,
}: AccountEditFormProps) {
  const [state, formAction, pending] = useActionState(
    updateAccountAction,
    initialState,
  );

  return (
    <div className="space-y-3 rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="accountId" value={accountId} />
        <FormField
          label="Account name"
          name="name"
          defaultValue={name}
          required
          disabled={pending}
        />
        <SelectField
          label="Account type"
          name="accountType"
          defaultValue={accountType}
          disabled={pending}
          options={accountTypes.map((value) => ({ label: value, value }))}
        />
        <p aria-live="polite" className="min-h-5 text-sm text-rose-600 dark:text-rose-400">
          {state.error ?? ""}
        </p>
        <div className="flex flex-wrap gap-3">
          <SubmitButton
            label="Save account"
            pendingLabel="Saving..."
            className="justify-center"
          />
        </div>
      </form>
      <form action={deleteAccountAction}>
        <input type="hidden" name="accountId" value={accountId} />
        <button
          type="submit"
          className="text-sm font-medium text-rose-600 transition hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300"
        >
          Delete account
        </button>
      </form>
    </div>
  );
}
