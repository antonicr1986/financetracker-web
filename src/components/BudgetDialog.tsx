"use client";

import { useEffect, useRef, useState } from "react";
import {
  createBudget,
  deleteBudget,
  getCategories,
  updateBudget,
} from "@/lib/api/client";
import type { BudgetDto, CategoryDto, TransactionType } from "@/lib/types";
import { useT } from "@/lib/i18n/useT";
import { useApiErrorMessage } from "@/lib/i18n/useApiError";

const fieldClasses =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800";

const inputClasses = `mt-1.5 ${fieldClasses}`;

const labelClasses =
  "block text-sm font-medium text-slate-700 dark:text-slate-300";

/**
 * Alta y edicion de un presupuesto, con el mismo patron que el de movimientos:
 * el padre lo monta solo mientras esta abierto y con una `key` por presupuesto,
 * asi los campos arrancan ya rellenos desde el useState.
 */
export default function BudgetDialog({
  budget,
  defaultMonth,
  onClose,
  onSaved,
}: {
  /** El presupuesto a editar, o null para crear uno. */
  budget: BudgetDto | null;
  /** Mes del panel, en AAAA-MM. Es el que se propone al crear. */
  defaultMonth: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const t = useT();
  const describeError = useApiErrorMessage();

  const isEditing = budget !== null;

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [name, setName] = useState(budget?.name ?? "");
  const [amount, setAmount] = useState(budget ? String(budget.amount) : "");
  const [month, setMonth] = useState(
    budget
      ? `${budget.year}-${`${budget.month}`.padStart(2, "0")}`
      : defaultMonth,
  );
  const [type, setType] = useState<TransactionType>(budget?.type ?? "Expense");
  const [categoryId, setCategoryId] = useState(
    budget?.categoryId != null ? String(budget.categoryId) : "",
  );

  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const isBusy = isSaving || isDeleting;

  // Un presupuesto de gastos no puede apuntar a una categoria de ingresos: la
  // API lo rechaza con category_type_mismatch.
  const available = categories.filter((category) => category.type === type);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    let cancelled = false;

    getCategories()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(describeError(cause, "errors.categoriesFailed"));
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCategories(false);
      });

    return () => {
      cancelled = true;
    };
  }, [describeError]);

  function changeType(next: TransactionType) {
    setType(next);
    setCategoryId("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsedAmount = Number(amount.replace(",", "."));

    if (!name.trim()) {
      setError(t("errors.writeBudgetName"));
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError(t("errors.amountPositive"));
      return;
    }

    const [year, monthNumber] = month.split("-").map(Number);

    if (!year || !monthNumber) {
      setError(t("errors.chooseMonth"));
      return;
    }

    setIsSaving(true);

    const input = {
      name: name.trim(),
      amount: parsedAmount,
      month: monthNumber,
      year,
      type,
      // Sin categoria el presupuesto cubre todo el tipo, que es justo lo que
      // significa null para la API.
      categoryId: categoryId ? Number(categoryId) : null,
    };

    try {
      if (budget) {
        await updateBudget(budget.id, input);
      } else {
        await createBudget(input);
      }

      dialogRef.current?.close();
      onSaved();
    } catch (cause: unknown) {
      setError(describeError(cause, "errors.saveBudgetFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!budget) return;

    setError(null);
    setIsDeleting(true);

    try {
      await deleteBudget(budget.id);
      dialogRef.current?.close();
      onSaved();
    } catch (cause: unknown) {
      setError(describeError(cause, "errors.deleteBudgetFailed"));
      setIsConfirmingDelete(false);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="w-full max-w-sm rounded-xl bg-white p-6 text-slate-900 shadow-lg backdrop:bg-slate-900/50 dark:bg-slate-900 dark:text-slate-100"
    >
      <h2 className="text-lg font-semibold">
        {isEditing ? t("budgets.editTitle") : t("budgets.dialogTitle")}
      </h2>

      <form onSubmit={handleSubmit} className="mt-4" noValidate>
        <label htmlFor="pre-nombre" className={labelClasses}>
          {t("budgets.name")}
        </label>
        <input
          id="pre-nombre"
          type="text"
          maxLength={100}
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={isBusy}
          className={inputClasses}
          placeholder={t("budgets.namePlaceholder")}
        />

        <label htmlFor="pre-tipo" className={`mt-4 ${labelClasses}`}>
          {t("dialog.type")}
        </label>
        <select
          id="pre-tipo"
          value={type}
          onChange={(event) => changeType(event.target.value as TransactionType)}
          disabled={isBusy}
          className={inputClasses}
        >
          <option value="Expense">{t("dialog.expense")}</option>
          <option value="Income">{t("dialog.income")}</option>
        </select>

        <label htmlFor="pre-importe" className={`mt-4 ${labelClasses}`}>
          {t("dialog.amount")}
        </label>
        <input
          id="pre-importe"
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          disabled={isBusy}
          className={inputClasses}
          placeholder="0,00"
        />

        <label htmlFor="pre-mes" className={`mt-4 ${labelClasses}`}>
          {t("budgets.month")}
        </label>
        <input
          id="pre-mes"
          type="month"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          disabled={isBusy}
          className={inputClasses}
        />

        <label htmlFor="pre-categoria" className={`mt-4 ${labelClasses}`}>
          {t("dialog.category")}
        </label>
        <select
          id="pre-categoria"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          disabled={isBusy || isLoadingCategories}
          className={inputClasses}
        >
          {/* A diferencia del de movimientos, aqui "sin categoria" es una
              opcion valida y no un placeholder: significa que el presupuesto
              cubre todo el tipo. */}
          <option value="">
            {isLoadingCategories ? t("dialog.loading") : t("budgets.allCategories")}
          </option>
          {available.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300"
          >
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            disabled={isBusy}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {t("dialog.cancel")}
          </button>
          <button
            type="submit"
            disabled={isBusy}
            className="flex-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            {isSaving ? t("dialog.saving") : t("dialog.save")}
          </button>
        </div>

        {isEditing && (
          <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
            {isConfirmingDelete ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {t("budgets.deleteConfirm")}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    disabled={isBusy}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {t("dialog.cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isBusy}
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300 dark:disabled:bg-rose-900"
                  >
                    {isDeleting ? t("dialog.deleting") : t("dialog.deleteYes")}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                disabled={isBusy}
                className="text-sm font-medium text-rose-700 underline-offset-2 transition hover:underline dark:text-rose-400"
              >
                {t("dialog.delete")}
              </button>
            )}
          </div>
        )}
      </form>
    </dialog>
  );
}
