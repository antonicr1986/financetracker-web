"use client";

import { useEffect, useState } from "react";
import CollapsibleSection from "@/components/CollapsibleSection";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/lib/api/client";
import type { CategoryDto, TransactionType } from "@/lib/types";
import { useT } from "@/lib/i18n/useT";
import { useApiErrorMessage } from "@/lib/i18n/useApiError";

const fieldClasses =
  "w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800";

const quietButton =
  "rounded-lg px-2 py-1 text-sm font-medium text-slate-500 underline-offset-2 transition hover:text-slate-900 hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:text-slate-100";

const dangerButton =
  "rounded-lg px-2 py-1 text-sm font-medium text-rose-700 underline-offset-2 transition hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-400";

const solidButton =
  "rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium whitespace-nowrap text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white";

/**
 * Gestion de categorias, dentro del panel.
 *
 * Vive aqui y no en Configuracion porque esa pantalla esta deliberadamente
 * oculta al usuario, ni en una ruta propia porque las categorias son un
 * accesorio de los movimientos y no una seccion con entidad propia. Arranca
 * plegada: se consulta de vez en cuando, no en cada visita.
 *
 * `onChanged` avisa al panel de que hay que recargar: renombrar o borrar una
 * categoria cambia el nombre que llevan los movimientos ya cargados.
 */
export default function CategoriesSection({
  onChanged,
}: {
  onChanged: () => void;
}) {
  const t = useT();
  const describeError = useApiErrorMessage();

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [isBusy, setIsBusy] = useState(false);

  // Solo una fila puede estar en edicion o pidiendo confirmacion a la vez, asi
  // que basta con guardar el id en lugar de un estado por fila.
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<TransactionType>("Expense");

  useEffect(() => {
    let cancelled = false;

    getCategories()
      .then((data) => {
        if (cancelled) return;
        setCategories(data);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(describeError(cause, "errors.categoriesFailed"));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reload, describeError]);

  function refresh() {
    setReload((current) => current + 1);
  }

  function startEditing(category: CategoryDto) {
    setError(null);
    setConfirmingId(null);
    setEditingId(category.id);
    setEditingName(category.name);
  }

  async function handleRename(category: CategoryDto) {
    const name = editingName.trim();

    if (!name) {
      setError(t("errors.writeCategoryName"));
      return;
    }

    if (name === category.name) {
      setEditingId(null);
      return;
    }

    setError(null);
    setIsBusy(true);

    try {
      // El tipo se manda igual que estaba: la API lo exige en el PUT, pero
      // cambiarlo dejaria movimientos con una categoria del tipo contrario.
      await updateCategory(category.id, name, category.type);
      setEditingId(null);
      refresh();
      onChanged();
    } catch (cause: unknown) {
      setError(describeError(cause, "errors.updateCategoryFailed"));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDelete(category: CategoryDto) {
    setError(null);
    setIsBusy(true);

    try {
      await deleteCategory(category.id);
      setConfirmingId(null);
      refresh();
      onChanged();
    } catch (cause: unknown) {
      // El caso normal aqui es category_has_transactions, que el traductor de
      // errores ya convierte en una explicacion util en el idioma del usuario.
      setError(describeError(cause, "errors.deleteCategoryFailed"));
      setConfirmingId(null);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCreate() {
    const name = newName.trim();

    if (!name) {
      setError(t("errors.writeCategoryName"));
      return;
    }

    setError(null);
    setIsBusy(true);

    try {
      await createCategory(name, newType);
      setNewName("");
      setIsAdding(false);
      refresh();
    } catch (cause: unknown) {
      setError(describeError(cause, "errors.createCategoryFailed"));
    } finally {
      setIsBusy(false);
    }
  }

  function renderGroup(type: TransactionType, heading: string) {
    const group = categories.filter((category) => category.type === type);

    if (group.length === 0) return null;

    return (
      <div>
        <h3 className="text-xs font-medium tracking-wide text-slate-400 uppercase dark:text-slate-500">
          {heading}
        </h3>
        <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
          {group.map((category) => (
            <li
              key={category.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2"
            >
              {editingId === category.id ? (
                <>
                  <label className="sr-only" htmlFor={`cat-${category.id}`}>
                    {t("categories.editOne", { name: category.name })}
                  </label>
                  <input
                    id={`cat-${category.id}`}
                    type="text"
                    maxLength={100}
                    autoFocus
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleRename(category);
                      }
                      if (event.key === "Escape") setEditingId(null);
                    }}
                    disabled={isBusy}
                    className={`${fieldClasses} max-w-xs flex-1`}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleRename(category)}
                      disabled={isBusy}
                      className={solidButton}
                    >
                      {isBusy ? t("dialog.saving") : t("dialog.save")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      disabled={isBusy}
                      className={quietButton}
                    >
                      {t("dialog.cancel")}
                    </button>
                  </div>
                </>
              ) : confirmingId === category.id ? (
                <>
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {t("categories.deleteConfirm")}{" "}
                    <strong className="font-medium text-slate-900 dark:text-slate-100">
                      {category.name}
                    </strong>
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleDelete(category)}
                      disabled={isBusy}
                      className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium whitespace-nowrap text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300 dark:disabled:bg-rose-900"
                    >
                      {isBusy ? t("dialog.deleting") : t("dialog.deleteYes")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(null)}
                      disabled={isBusy}
                      className={quietButton}
                    >
                      {t("dialog.cancel")}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-sm text-slate-900 dark:text-slate-100">
                    {category.name}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => startEditing(category)}
                      disabled={isBusy}
                      aria-label={t("categories.editOne", { name: category.name })}
                      className={quietButton}
                    >
                      {t("table.edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setEditingId(null);
                        setConfirmingId(category.id);
                      }}
                      disabled={isBusy}
                      aria-label={t("categories.deleteOne", { name: category.name })}
                      className={dangerButton}
                    >
                      {t("dialog.delete")}
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <CollapsibleSection
      title={t("categories.title")}
      defaultOpen={false}
      collapsedSummary={
        categories.length === 1
          ? t("categories.summaryOne")
          : t("categories.summary", { count: categories.length })
      }
      className="mt-8"
    >
      {isLoading ? (
        <div className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
      ) : (
        <>
          {error && (
            <p
              role="alert"
              className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300"
            >
              {error}
            </p>
          )}

          {categories.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("categories.empty")}
            </p>
          ) : (
            <div className="space-y-5">
              {renderGroup("Expense", t("dashboard.expenses"))}
              {renderGroup("Income", t("dashboard.income"))}
            </div>
          )}

          <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
            {isAdding ? (
              <div className="flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor="cat-nueva">
                  {t("dialog.newCategory")}
                </label>
                <input
                  id="cat-nueva"
                  type="text"
                  maxLength={100}
                  autoFocus
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleCreate();
                    }
                    if (event.key === "Escape") setIsAdding(false);
                  }}
                  disabled={isBusy}
                  className={`${fieldClasses} max-w-xs flex-1`}
                  placeholder={t("dialog.newCategoryPlaceholder")}
                />
                <label className="sr-only" htmlFor="cat-nueva-tipo">
                  {t("dialog.type")}
                </label>
                <select
                  id="cat-nueva-tipo"
                  value={newType}
                  onChange={(event) =>
                    setNewType(event.target.value as TransactionType)
                  }
                  disabled={isBusy}
                  className={`${fieldClasses} w-auto`}
                >
                  <option value="Expense">{t("dialog.expense")}</option>
                  <option value="Income">{t("dialog.income")}</option>
                </select>
                <button
                  type="button"
                  onClick={() => void handleCreate()}
                  disabled={isBusy}
                  className={solidButton}
                >
                  {isBusy ? t("dialog.saving") : t("dialog.add")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setNewName("");
                  }}
                  disabled={isBusy}
                  className={quietButton}
                >
                  {t("dialog.cancel")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setIsAdding(true);
                }}
                disabled={isBusy}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t("dialog.newCategory")}
              </button>
            )}
          </div>
        </>
      )}
    </CollapsibleSection>
  );
}
