"use client";

import { useRef, useState } from "react";
import { createTransaction, getCategories } from "@/lib/api/client";
import type { CategoryDto, TransactionType } from "@/lib/types";
import { useT } from "@/lib/i18n/useT";
import { useApiErrorMessage } from "@/lib/i18n/useApiError";

const inputClasses =
  "mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800";

const labelClasses =
  "block text-sm font-medium text-slate-700 dark:text-slate-300";

function today(): string {
  // El <input type="date"> quiere AAAA-MM-DD en hora local, no en UTC:
  // toISOString() adelantaria un dia a quien vaya por delante de Greenwich.
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Alta de un movimiento, en un <dialog> nativo.
 *
 * Nativo y no una libreria de modales: el navegador ya se encarga del foco, de
 * cerrar con Escape, del fondo inerte y de anunciarlo a los lectores de
 * pantalla. Las categorias se cargan al abrir, no al montar, para no gastar una
 * peticion en cada visita al panel.
 */
export default function NewTransactionDialog({
  onCreated,
}: {
  onCreated: (createdOn: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const t = useT();
  const describeError = useApiErrorMessage();

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [type, setType] = useState<TransactionType>("Expense");
  const [categoryId, setCategoryId] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // La API rechaza un movimiento cuyo tipo no coincida con el de su categoria,
  // asi que el desplegable solo ofrece las del tipo elegido.
  const available = categories.filter((category) => category.type === type);

  async function open() {
    setError(null);
    setDescription("");
    setAmount("");
    setDate(today());
    setType("Expense");
    setCategoryId("");
    dialogRef.current?.showModal();

    setIsLoadingCategories(true);
    try {
      setCategories(await getCategories());
    } catch (cause: unknown) {
      setError(describeError(cause, "errors.categoriesFailed"));
    } finally {
      setIsLoadingCategories(false);
    }
  }

  function changeType(next: TransactionType) {
    setType(next);
    setCategoryId("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsedAmount = Number(amount.replace(",", "."));

    if (!description.trim()) {
      setError(t("errors.writeConcept"));
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError(t("errors.amountPositive"));
      return;
    }

    if (!categoryId) {
      setError(t("errors.chooseCategory"));
      return;
    }

    setIsSaving(true);

    try {
      await createTransaction({
        description: description.trim(),
        amount: parsedAmount,
        date,
        type,
        categoryId: Number(categoryId),
      });

      dialogRef.current?.close();
      onCreated(date);
    } catch (cause: unknown) {
      setError(describeError(cause, "errors.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
      >
        {t("dashboard.newTransaction")}
      </button>

      <dialog
        ref={dialogRef}
        className="w-full max-w-sm rounded-xl bg-white p-6 text-slate-900 shadow-lg backdrop:bg-slate-900/50 dark:bg-slate-900 dark:text-slate-100"
      >
        <h2 className="text-lg font-semibold">{t("dialog.title")}</h2>

        <form onSubmit={handleSubmit} className="mt-4" noValidate>
          <label htmlFor="mov-tipo" className={labelClasses}>
            {t("dialog.type")}
          </label>
          <select
            id="mov-tipo"
            value={type}
            onChange={(event) => changeType(event.target.value as TransactionType)}
            disabled={isSaving}
            className={inputClasses}
          >
            <option value="Expense">{t("dialog.expense")}</option>
            <option value="Income">{t("dialog.income")}</option>
          </select>

          <label htmlFor="mov-concepto" className={`mt-4 ${labelClasses}`}>
            {t("dialog.concept")}
          </label>
          <input
            id="mov-concepto"
            type="text"
            maxLength={150}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={isSaving}
            className={inputClasses}
            placeholder={t("dialog.conceptPlaceholder")}
          />

          <label htmlFor="mov-importe" className={`mt-4 ${labelClasses}`}>
            {t("dialog.amount")}
          </label>
          <input
            id="mov-importe"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            disabled={isSaving}
            className={inputClasses}
            placeholder="0,00"
          />

          <label htmlFor="mov-fecha" className={`mt-4 ${labelClasses}`}>
            {t("dialog.date")}
          </label>
          <input
            id="mov-fecha"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            disabled={isSaving}
            className={inputClasses}
          />

          <label htmlFor="mov-categoria" className={`mt-4 ${labelClasses}`}>
            {t("dialog.category")}
          </label>
          <select
            id="mov-categoria"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            disabled={isSaving || isLoadingCategories}
            className={inputClasses}
          >
            <option value="">
              {isLoadingCategories ? t("dialog.loading") : t("dialog.chooseCategory")}
            </option>
            {available.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {!isLoadingCategories && available.length === 0 && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {t("dialog.noCategoriesOfType")}
            </p>
          )}

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
              disabled={isSaving}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t("dialog.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              {isSaving ? t("dialog.saving") : t("dialog.save")}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
