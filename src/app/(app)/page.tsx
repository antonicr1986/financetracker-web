"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MonthlyChart from "@/components/MonthlyChart";
import { getTransactions } from "@/lib/api/client";
import { useMockMode } from "@/lib/useMockMode";
import {
  availableMonths,
  breakdownOf,
  monthLongLabel,
  monthShortLabel,
  monthlySeries,
  summaryOf,
  transactionsOfMonth,
} from "@/lib/derive";
import type { TransactionDto } from "@/lib/types";

const currency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

const shortDate = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
});

function formatDate(iso: string) {
  return shortDate.format(new Date(iso));
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "income" | "expense" | "balance";
}) {
  const toneClasses = {
    income: "text-emerald-700 dark:text-emerald-400",
    expense: "text-rose-700 dark:text-rose-400",
    balance:
      value >= 0
        ? "text-slate-900 dark:text-slate-100"
        : "text-rose-700 dark:text-rose-400",
  }[tone];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${toneClasses}`}>
        {currency.format(value)}
      </p>
    </div>
  );
}

function TransactionRow({ transaction }: { transaction: TransactionDto }) {
  const isIncome = transaction.type === "Income";

  return (
    <tr className="border-t border-slate-100 dark:border-slate-800">
      <td className="py-3 pr-4 text-sm whitespace-nowrap text-slate-500 dark:text-slate-400">
        {formatDate(transaction.date)}
      </td>
      <td className="py-3 pr-4 text-sm font-medium text-slate-900 dark:text-slate-100">
        {transaction.description}
      </td>
      <td className="py-3 pr-4 text-sm text-slate-500 dark:text-slate-400">
        {transaction.categoryName ?? "Sin categoria"}
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
    </tr>
  );
}

export default function Home() {
  const router = useRouter();
  const mockMode = useMockMode();
  const [allTransactions, setAllTransactions] = useState<TransactionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getTransactions()
      .then((data) => {
        if (cancelled) return;
        setAllTransactions(data);
        const months = availableMonths(data);
        setSelected(months[months.length - 1] ?? null);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        const message =
          cause instanceof Error
            ? cause.message
            : "No se han podido cargar los datos.";
        setError(message);

        // If API is not configured and not in mock mode, redirect to settings
        if (message.includes("API no configurada")) {
          setTimeout(() => router.push("/settings"), 2000);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const months = useMemo(
    () => availableMonths(allTransactions),
    [allTransactions],
  );

  const monthly = useMemo(
    () => monthlySeries(allTransactions),
    [allTransactions],
  );

  const transactions = useMemo(
    () => (selected ? transactionsOfMonth(allTransactions, selected) : []),
    [allTransactions, selected],
  );
  const summary = useMemo(() => summaryOf(transactions), [transactions]);
  const breakdown = useMemo(() => breakdownOf(transactions), [transactions]);

  const maxAmount = breakdown.length
    ? Math.max(...breakdown.map((item) => item.amount))
    : 0;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
          <p className="font-medium">Error al cargar los datos</p>
          <p className="mt-1">{error}</p>
          {error.includes("API no configurada") && (
            <p className="mt-2 text-xs">
              Redirigiendo a Configuración en 2 segundos...
            </p>
          )}
        </div>
      </main>
    );
  }

  if (!selected) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          <p className="font-medium">No hay datos disponibles</p>
          <p className="mt-1">No hay movimientos registrados aún.</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="mx-auto max-w-5xl px-4 py-8">
        {mockMode && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
            <p className="font-medium">Modo demostración</p>
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

        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Resumen
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {monthLongLabel(selected)}
          </p>
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
                {monthShortLabel(key)}
              </button>
            );
          })}
        </div>

        <section className="grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Ingresos" value={summary.totalIncome} tone="income" />
          <SummaryCard label="Gastos" value={summary.totalExpense} tone="expense" />
          <SummaryCard label="Balance" value={summary.balance} tone="balance" />
        </section>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Evolucion mensual
          </h2>
          <MonthlyChart data={monthly} active={monthShortLabel(selected)} />
        </section>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Gastos por categoria
          </h2>

          {breakdown.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              No hay gastos registrados este mes.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
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
        </section>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Movimientos de {monthShortLabel(selected).toLowerCase()}
          </h2>

          {transactions.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              No hay movimientos este mes.
            </p>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[32rem]">
                <thead>
                  <tr className="text-left text-xs font-medium tracking-wide text-slate-400 uppercase dark:text-slate-500">
                    <th className="py-2 pr-4 font-medium">Fecha</th>
                    <th className="py-2 pr-4 font-medium">Concepto</th>
                    <th className="py-2 pr-4 font-medium">Categoria</th>
                    <th className="py-2 text-right font-medium">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <TransactionRow key={transaction.id} transaction={transaction} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mt-3 h-7 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <main>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="h-8 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-2 h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

        <div className="mt-6 flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-9 w-14 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800"
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
