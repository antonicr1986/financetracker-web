"use client";

import { useEffect, useRef, useState } from "react";
import {
  createTransaction,
  deleteTransaction,
  getCategories,
  updateTransaction,
} from "@/lib/api/client";
import type { CategoryDto, TransactionDto, TransactionType } from "@/lib/types";
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
 * La API devuelve la fecha como ISO completo. Se corta en seco en lugar de
 * pasar por Date: construir una fecha y volver a formatearla es justo lo que
 * desplaza un dia segun la zona horaria del navegador.
 */
function dateInputValue(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * Alta y edicion de un movimiento, en un <dialog> nativo.
 *
 * Nativo y no una libreria de modales: el navegador ya se encarga del foco, de
 * cerrar con Escape, del fondo inerte y de anunciarlo a los lectores de
 * pantalla.
 *
 * El padre solo lo renderiza mientras esta abierto, y le pone una `key` distinta
 * por movimiento. Asi cada apertura monta una instancia nueva y los campos
 * arrancan ya con los valores correctos desde el useState: no hace falta un
 * efecto que los rellene, que es lo que el linter prohibe en este proyecto.
 */
export default function TransactionDialog({
  transaction,
  onClose,
  onSaved,
}: {
  /** El movimiento a editar, o null para dar uno de alta. */
  transaction: TransactionDto | null;
  onClose: () => void;
  /** `focusMonth` en formato AAAA-MM: el mes que el panel debe mostrar despues. */
  onSaved: (focusMonth: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const t = useT();
  const describeError = useApiErrorMessage();

  const isEditing = transaction !== null;

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [description, setDescription] = useState(transaction?.description ?? "");
  const [amount, setAmount] = useState(
    transaction ? String(transaction.amount) : "",
  );
  const [date, setDate] = useState(
    transaction ? dateInputValue(transaction.date) : today(),
  );
  const [type, setType] = useState<TransactionType>(transaction?.type ?? "Expense");
  const [categoryId, setCategoryId] = useState(
    transaction?.categoryId != null ? String(transaction.categoryId) : "",
  );

  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const isBusy = isSaving || isDeleting;

  // La API rechaza un movimiento cuyo tipo no coincida con el de su categoria,
  // asi que el desplegable solo ofrece las del tipo elegido.
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

    const input = {
      description: description.trim(),
      amount: parsedAmount,
      date,
      type,
      categoryId: Number(categoryId),
    };

    try {
      if (transaction) {
        await updateTransaction(transaction.id, input);
      } else {
        await createTransaction(input);
      }

      dialogRef.current?.close();
      onSaved(date.slice(0, 7));
    } catch (cause: unknown) {
      setError(describeError(cause, "errors.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!transaction) return;

    setError(null);
    setIsDeleting(true);

    try {
      await deleteTransaction(transaction.id);

      dialogRef.current?.close();

      // Se vuelve al mes del movimiento borrado, no al ultimo con datos: si
      // quedan mas movimientos ese mes, el usuario sigue donde estaba, y si era
      // el unico el panel ya cae solo al mes mas reciente.
      onSaved(dateInputValue(transaction.date).slice(0, 7));
    } catch (cause: unknown) {
      setError(describeError(cause, "errors.deleteFailed"));
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
        {isEditing ? t("dialog.editTitle") : t("dialog.title")}
      </h2>

      <form onSubmit={handleSubmit} className="mt-4" noValidate>
        <label htmlFor="mov-tipo" className={labelClasses}>
          {t("dialog.type")}
        </label>
        <select
          id="mov-tipo"
          value={type}
          onChange={(event) => changeType(event.target.value as TransactionType)}
          disabled={isBusy}
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
          disabled={isBusy}
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
          disabled={isBusy}
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
          disabled={isBusy}
          className={inputClasses}
        />

        <label htmlFor="mov-categoria" className={`mt-4 ${labelClasses}`}>
          {t("dialog.category")}
        </label>
        <select
          id="mov-categoria"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          disabled={isBusy || isLoadingCategories}
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

        {/* El borrado va dentro del mismo dialogo y en dos pasos, no en un
            confirm() del navegador ni en un segundo modal: no hace falta abrir
            nada nuevo y deja el paso destructivo separado del de guardar. */}
        {isEditing && (
          <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
            {isConfirmingDelete ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {t("dialog.deleteConfirm")}
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
