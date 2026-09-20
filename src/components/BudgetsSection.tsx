"use client";

import { useEffect, useState } from "react";
import CollapsibleSection from "@/components/CollapsibleSection";
import BudgetDialog from "@/components/BudgetDialog";
import { getBudgets } from "@/lib/api/client";
import type { BudgetDto } from "@/lib/types";
import { useT } from "@/lib/i18n/useT";
import { useApiErrorMessage } from "@/lib/i18n/useApiError";
import { useFormatters } from "@/lib/i18n/format";

/**
 * Colores del progreso. El porcentaje va siempre escrito al lado: el color es
 * un refuerzo, no la unica forma de saber como va el presupuesto.
 */
function toneOf(percentage: number) {
  if (percentage >= 100) {
    return {
      bar: "bg-rose-600 dark:bg-rose-500",
      text: "text-rose-700 dark:text-rose-400",
    };
  }

  if (percentage >= 80) {
    return {
      bar: "bg-amber-500 dark:bg-amber-400",
      text: "text-amber-700 dark:text-amber-400",
    };
  }

  return {
    bar: "bg-emerald-600 dark:bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
  };
}

function BudgetRow({
  budget,
  onEdit,
}: {
  budget: BudgetDto;
  onEdit: () => void;
}) {
  const t = useT();
  const { currency } = useFormatters();

  const percentage = Math.round(budget.usagePercentage);
  const tone = toneOf(percentage);
  const isExceeded = budget.remainingAmount < 0;

  return (
    <li>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {budget.name}
          </span>
          <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
            {budget.categoryName ?? t("budgets.allCategories")}
          </span>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-sm tabular-nums text-slate-500 dark:text-slate-400">
            {t("budgets.spentOf", {
              spent: currency.format(budget.spentAmount),
              total: currency.format(budget.amount),
            })}
          </span>
          <button
            type="button"
            onClick={onEdit}
            aria-label={t("budgets.editOne", { name: budget.name })}
            className="rounded-lg px-2 py-1 text-sm font-medium text-slate-500 underline-offset-2 transition hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-slate-100"
          >
            {t("table.edit")}
          </button>
        </div>
      </div>

      <div className="mt-1.5 flex items-center gap-3">
        <div
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={budget.name}
          className="h-2 flex-1 rounded-full bg-slate-100 dark:bg-slate-800"
        >
          {/* La barra se corta al 100%: pasarse no la hace mas larga, lo dice
              el color y el texto de debajo. */}
          <div
            className={`h-2 rounded-full ${tone.bar}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <span className={`w-12 shrink-0 text-right text-xs tabular-nums ${tone.text}`}>
          {percentage}%
        </span>
      </div>

      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {isExceeded
          ? t("budgets.exceeded", {
              amount: currency.format(Math.abs(budget.remainingAmount)),
            })
          : t("budgets.remaining", {
              amount: currency.format(budget.remainingAmount),
            })}
      </p>
    </li>
  );
}

/**
 * Presupuestos del mes que se esta viendo.
 *
 * Los datos se piden aparte de los movimientos porque lo gastado, lo que queda
 * y el porcentaje los calcula la API. `refreshToken` es la senal del panel de
 * que los movimientos han cambiado: al crear o borrar uno, lo gastado deja de
 * ser valido y hay que volver a preguntar.
 */
export default function BudgetsSection({
  month,
  refreshToken,
}: {
  /** Mes del panel, en AAAA-MM. */
  month: string;
  refreshToken: number;
}) {
  const t = useT();
  const describeError = useApiErrorMessage();

  const [budgets, setBudgets] = useState<BudgetDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [dialog, setDialog] = useState<{ budget: BudgetDto | null } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    // No se marca "cargando" al refrescar: la lista anterior se queda a la
    // vista hasta que llega la nueva, y asi no parpadea al guardar.
    getBudgets()
      .then((data) => {
        if (cancelled) return;
        setBudgets(data);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(describeError(cause, "errors.budgetsFailed"));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshToken, reload, describeError]);

  // El endpoint devuelve todos los meses; el panel solo ensena el que se ve.
  const [year, monthNumber] = month.split("-").map(Number);
  const visible = budgets.filter(
    (budget) => budget.year === year && budget.month === monthNumber,
  );

  const within = visible.filter((budget) => budget.usagePercentage < 100).length;

  const newButton = (
    <button
      type="button"
      onClick={() => setDialog({ budget: null })}
      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      {t("budgets.new")}
    </button>
  );

  return (
    <CollapsibleSection
      title={t("budgets.title")}
      collapsedSummary={
        visible.length
          ? t("budgets.summary", { within, total: visible.length })
          : t("budgets.none")
      }
      className="mt-8"
    >
      {error ? (
        <p className="text-sm text-rose-700 dark:text-rose-400">{error}</p>
      ) : isLoading ? (
        <div className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
      ) : visible.length === 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("budgets.empty")}
          </p>
          {newButton}
        </div>
      ) : (
        <>
          <ul className="space-y-5">
            {visible.map((budget) => (
              <BudgetRow
                key={budget.id}
                budget={budget}
                onEdit={() => setDialog({ budget })}
              />
            ))}
          </ul>
          <div className="mt-5 flex justify-end">{newButton}</div>
        </>
      )}

      {dialog && (
        <BudgetDialog
          key={dialog.budget ? `edit-${dialog.budget.id}` : "new"}
          budget={dialog.budget}
          defaultMonth={month}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            setReload((current) => current + 1);
          }}
        />
      )}
    </CollapsibleSection>
  );
}
