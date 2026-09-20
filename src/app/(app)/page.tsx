"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MonthlyChart from "@/components/MonthlyChart";
import CollapsibleSection from "@/components/CollapsibleSection";
import TransactionDialog from "@/components/TransactionDialog";
import { ApiError, getTransactions } from "@/lib/api/client";
import { useMockMode } from "@/lib/useMockMode";
import { useT } from "@/lib/i18n/useT";
import { useApiErrorMessage } from "@/lib/i18n/useApiError";
import { useFormatters, intlTag } from "@/lib/i18n/format";
import {
  availableMonths,
  breakdownOf,
  monthLongLabel,
  monthShortLabel,
  monthlySeries,
  summaryOf,
  transactionsOfMonth,
} from "@/lib/derive";
import type { TransactionDto, TransactionType } from "@/lib/types";

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "income" | "expense" | "balance";
}) {
  const { currency } = useFormatters();

  const toneClasses = {
    income: "text-emerald-700 dark:text-emerald-400",
    expense: "text-rose-700 dark:text-rose-400",
    balance:
      value >= 0
        ? "text-slate-900 dark:text-slate-100"
        : "text-rose-700 dark:text-rose-400",
  }[tone];

  return (
    <div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${toneClasses}`}>
        {currency.format(value)}
      </p>
    </div>
  );
}

/** Boton de alta. Aparece en la cabecera y tambien en el panel vacio. */
function NewTransactionButton({ onClick }: { onClick: () => void }) {
  const t = useT();

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
    >
      {t("dashboard.newTransaction")}
    </button>
  );
}

function TransactionRow({
  transaction,
  onEdit,
}: {
  transaction: TransactionDto;
  /** null en modo demostracion: no hay API donde guardar el cambio. */
  onEdit: (() => void) | null;
}) {
  const isIncome = transaction.type === "Income";
  const t = useT();
  const { currency, shortDate } = useFormatters();

  return (
    <tr className="border-t border-slate-100 dark:border-slate-800">
      <td className="py-3 pr-4 text-sm whitespace-nowrap text-slate-500 dark:text-slate-400">
        {shortDate.format(new Date(transaction.date))}
      </td>
      <td className="py-3 pr-4 text-sm font-medium text-slate-900 dark:text-slate-100">
        {transaction.description}
      </td>
      <td className="py-3 pr-4 text-sm text-slate-500 dark:text-slate-400">
        {transaction.categoryName ?? t("table.noCategory")}
      </td>
      <td
        className={`py-3 text-right text-sm font-semibold tabular-nums whitespace-nowrap ${
          isIncome
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-slate-900 dark:text-slate-100"
        }`}
      >
        {isIncome ? "+" : "−"}
        {currency.format(transaction.amount)}
      </td>
      {onEdit && (
        <td className="py-3 pl-4 text-right">
          <button
            type="button"
            onClick={onEdit}
            // El texto visible es solo "Editar": repetido en cada fila, un
            // lector de pantalla no sabria cual es cual sin el concepto.
            aria-label={t("table.editOne", { concept: transaction.description })}
            className="rounded-lg px-2 py-1 text-sm font-medium text-slate-500 underline-offset-2 transition hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-slate-100"
          >
            {t("table.edit")}
          </button>
        </td>
      )}
    </tr>
  );
}

export default function Home() {
  const router = useRouter();
  const mockMode = useMockMode();
  const t = useT();
  const describeError = useApiErrorMessage();
  const { currency, locale } = useFormatters();
  const tag = intlTag(locale);
  const [allTransactions, setAllTransactions] = useState<TransactionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  // Un solo dialogo para alta y edicion: null mientras esta cerrado, y con
  // `transaction` a null cuando lo que se abre es un alta.
  const [dialog, setDialog] = useState<{
    transaction: TransactionDto | null;
  } | null>(null);

  // `focusMonth` permite saltar al mes del movimiento recien creado, que puede
  // no ser el ultimo con datos si se registra algo de un mes anterior.
  const load = useCallback(
    (focusMonth?: string) =>
      getTransactions()
        .then((data) => {
          setAllTransactions(data);
          const months = availableMonths(data);
          const target =
            focusMonth && months.includes(focusMonth)
              ? focusMonth
              : months[months.length - 1] ?? null;
          setSelected(target);
          setError(null);
        })
        .catch((cause: unknown) => {
          setError(describeError(cause, "errors.loadFailed"));

          // Sin API configurada no hay nada que reintentar: se lleva al usuario
          // a la pantalla donde puede indicarla. Se comprueba el codigo y no el
          // texto, que ahora depende del idioma.
          if (cause instanceof ApiError && cause.code === "api_not_configured") {
            setTimeout(() => router.push("/settings"), 2000);
          }
        })
        .finally(() => setIsLoading(false)),
    [router, describeError],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // El dialogo devuelve ya el mes (AAAA-MM) que conviene mostrar despues: el
  // del movimiento guardado, o el del borrado, que puede no ser el que se
  // estaba viendo si se cambio la fecha.
  function handleSaved(focusMonth: string) {
    setDialog(null);
    void load(focusMonth);
  }

  const months = useMemo(
    () => availableMonths(allTransactions),
    [allTransactions],
  );

  const monthly = useMemo(
    () => monthlySeries(allTransactions, tag),
    [allTransactions, tag],
  );

  const transactions = useMemo(
    () => (selected ? transactionsOfMonth(allTransactions, selected) : []),
    [allTransactions, selected],
  );
  // Filtros de la tabla de movimientos. Se aplican en cliente sobre los datos
  // ya cargados: la respuesta es inmediata y no rompe el resto del panel, que
  // deriva los meses, la grafica y los totales de esa misma carga completa.
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");

  const categoryNames = useMemo(() => {
    const names = new Set(
      transactions.map((item) => item.categoryName ?? t("table.noCategory")),
    );
    return [...names].sort((a, b) => a.localeCompare(b, locale));
  }, [transactions, locale, t]);

  // Si la categoria elegida no existe en el mes que se esta viendo, se ignora.
  // Comprobarlo aqui evita tener que reiniciar el filtro desde un efecto al
  // cambiar de mes, que es justo lo que dispara el aviso del linter.
  const activeCategory = categoryNames.includes(categoryFilter)
    ? categoryFilter
    : "all";

  const hasFilters =
    typeFilter !== "all" || activeCategory !== "all" || search.trim() !== "";

  const visibleTransactions = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return transactions.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;

      if (
        activeCategory !== "all" &&
        (item.categoryName ?? t("table.noCategory")) !== activeCategory
      ) {
        return false;
      }

      if (needle && !item.description.toLowerCase().includes(needle)) {
        return false;
      }

      return true;
    });
  }, [transactions, typeFilter, activeCategory, search, t]);

  function clearFilters() {
    setTypeFilter("all");
    setCategoryFilter("all");
    setSearch("");
  }

  const summary = useMemo(() => summaryOf(transactions), [transactions]);
  const breakdown = useMemo(() => breakdownOf(transactions), [transactions]);

  const maxAmount = breakdown.length
    ? Math.max(...breakdown.map((item) => item.amount))
    : 0;

  // Categoria de mayor gasto, para el resumen que se ve con el bloque plegado.
  const topCategory = breakdown.length
    ? breakdown.reduce((mayor, item) => (item.amount > mayor.amount ? item : mayor))
    : null;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const showRedirectNotice = error === t("apiError.api_not_configured");

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
          <p className="font-medium">{t("dashboard.loadError")}</p>
          <p className="mt-1">{error}</p>
          {showRedirectNotice && (
            <p className="mt-2 text-xs">
              {t("dashboard.redirecting")}
            </p>
          )}
        </div>
      </main>
    );
  }

  // Montado solo mientras esta abierto, y con una `key` por movimiento: cada
  // apertura es una instancia nueva, asi los campos arrancan con los valores
  // correctos sin un efecto que los rellene.
  const transactionDialog = dialog && (
    <TransactionDialog
      key={dialog.transaction ? `edit-${dialog.transaction.id}` : "new"}
      transaction={dialog.transaction}
      onClose={() => setDialog(null)}
      onSaved={handleSaved}
    />
  );

  if (!selected) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="font-medium text-slate-900 dark:text-slate-100">
            {t("dashboard.emptyTitle")}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("dashboard.emptyBody")}
          </p>
          {!mockMode && (
            <div className="mt-6 flex justify-center">
              <NewTransactionButton
                onClick={() => setDialog({ transaction: null })}
              />
            </div>
          )}
        </div>
        {transactionDialog}
      </main>
    );
  }

  return (
    <main>
      <div className="mx-auto max-w-5xl px-4 py-8">
        {mockMode && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
            <p className="font-medium">{t("dashboard.demoTitle")}</p>
            <p className="mt-1">
              Estás usando datos de demostración. Ve a{" "}
              <a
                href="/settings"
                className="font-semibold underline hover:no-underline"
              >
                Configuración
              </a>{" "}
              para conectar tu API real.
            </p>
          </div>
        )}

        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {t("dashboard.title")}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {monthLongLabel(selected, tag)}
            </p>
          </div>

          {/* En modo demostracion no hay API donde guardar: ofrecer el alta
              seria prometer algo que no se puede cumplir. */}
          {!mockMode && (
            <NewTransactionButton
              onClick={() => setDialog({ transaction: null })}
            />
          )}
        </header>

        <div className="mb-6 flex flex-wrap gap-2">
          {months.map((key) => {
            const isSelected = key === selected;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                aria-pressed={isSelected}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                  isSelected
                    ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                    : "border-slate-300 text-slate-600 hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {monthShortLabel(key, tag)}
              </button>
            );
          })}
        </div>

        <CollapsibleSection
          title={t("dashboard.totals")}
          collapsedSummary={t("dashboard.totalsSummary", { amount: currency.format(summary.balance) })}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryCard label={t("dashboard.income")} value={summary.totalIncome} tone="income" />
            <SummaryCard label={t("dashboard.expenses")} value={summary.totalExpense} tone="expense" />
            <SummaryCard label={t("dashboard.balance")} value={summary.balance} tone="balance" />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title={t("dashboard.monthlyTrend")}
          collapsedSummary={
            months.length
              ? `${monthShortLabel(months[0])} – ${monthShortLabel(months[months.length - 1])}`
              : undefined
          }
          className="mt-8"
        >
          <MonthlyChart data={monthly} active={monthShortLabel(selected, tag)} />
        </CollapsibleSection>

        <CollapsibleSection
          title={t("dashboard.byCategory")}
          collapsedSummary={
            topCategory
              ? t("dashboard.byCategorySummary", {
                  name: topCategory.categoryName,
                  amount: currency.format(topCategory.amount),
                })
              : t("dashboard.noExpenses")
          }
          className="mt-8"
        >
          {breakdown.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("dashboard.noExpensesThisMonth")}
            </p>
          ) : (
            <ul className="space-y-3">
              {breakdown.map((item) => (
                <li key={item.categoryName}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {item.categoryName}
                    </span>
                    <span className="text-sm tabular-nums text-slate-500 dark:text-slate-400">
                      {currency.format(item.amount)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-slate-700 dark:bg-slate-300"
                      style={{ width: `${(item.amount / maxAmount) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title={t("dashboard.movementsOf", {
            month: monthShortLabel(selected, tag).toLowerCase(),
          })}
          collapsedSummary={
            visibleTransactions.length === 1
              ? t("dashboard.movementCountOne")
              : t("dashboard.movementCount", { count: visibleTransactions.length })
          }
          className="mt-8"
        >
          {transactions.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("dashboard.noMovementsThisMonth")}
            </p>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor="filtro-busqueda">
                  {t("filters.searchLabel")}
                </label>
                <input
                  id="filtro-busqueda"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t("filters.search")}
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:ring-slate-800"
                />

                <label className="sr-only" htmlFor="filtro-tipo">
                  {t("filters.typeLabel")}
                </label>
                <select
                  id="filtro-tipo"
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(event.target.value as "all" | TransactionType)
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:ring-slate-800"
                >
                  <option value="all">{t("filters.allTypes")}</option>
                  <option value="Income">{t("dashboard.income")}</option>
                  <option value="Expense">{t("dashboard.expenses")}</option>
                </select>

                <label className="sr-only" htmlFor="filtro-categoria">
                  {t("filters.categoryLabel")}
                </label>
                <select
                  id="filtro-categoria"
                  value={activeCategory}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:ring-slate-800"
                >
                  <option value="all">{t("filters.allCategories")}</option>
                  {categoryNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>

                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 underline-offset-2 transition hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-slate-100"
                  >
                    {t("filters.clear")}
                  </button>
                )}
              </div>

              {hasFilters && (
                <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                  {t("dashboard.showing", {
                    shown: visibleTransactions.length,
                    total: transactions.length,
                  })}
                </p>
              )}

              {visibleTransactions.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("dashboard.noMatches")}
                </p>
              ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem]">
                <thead>
                  <tr className="text-left text-xs font-medium tracking-wide text-slate-400 uppercase dark:text-slate-500">
                    <th className="py-2 pr-4 font-medium">{t("table.date")}</th>
                    <th className="py-2 pr-4 font-medium">{t("table.concept")}</th>
                    <th className="py-2 pr-4 font-medium">{t("table.category")}</th>
                    <th className="py-2 text-right font-medium">{t("table.amount")}</th>
                    {!mockMode && (
                      <th className="py-2 pl-4 text-right font-medium">
                        <span className="sr-only">{t("table.actions")}</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {visibleTransactions.map((transaction) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      onEdit={
                        mockMode ? null : () => setDialog({ transaction })
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
              )}
            </>
          )}
        </CollapsibleSection>
      </div>
      {transactionDialog}
    </main>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="h-4 w-20 animate-pulse rounded bg-slate-300 dark:bg-slate-800" />
      <div className="mt-3 h-7 w-28 animate-pulse rounded bg-slate-300 dark:bg-slate-800" />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <main>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="h-8 w-40 animate-pulse rounded bg-slate-300 dark:bg-slate-800" />
        <div className="mt-2 h-4 w-32 animate-pulse rounded bg-slate-300 dark:bg-slate-800" />

        <div className="mt-6 flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-9 w-14 animate-pulse rounded-lg bg-slate-300 dark:bg-slate-800"
            />
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        <div className="mt-8 h-64 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
        <div className="mt-8 h-52 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
      </div>
    </main>
  );
}
