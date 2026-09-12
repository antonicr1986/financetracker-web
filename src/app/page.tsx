import { mockBreakdown, mockSummary, mockTransactions } from "@/lib/mock";
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
    income: "text-emerald-700",
    expense: "text-rose-700",
    balance: value >= 0 ? "text-slate-900" : "text-rose-700",
  }[tone];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${toneClasses}`}>
        {currency.format(value)}
      </p>
    </div>
  );
}

function TransactionRow({ transaction }: { transaction: TransactionDto }) {
  const isIncome = transaction.type === "Income";

  return (
    <tr className="border-t border-slate-100">
      <td className="py-3 pr-4 text-sm text-slate-500 whitespace-nowrap">
        {formatDate(transaction.date)}
      </td>
      <td className="py-3 pr-4 text-sm font-medium text-slate-900">
        {transaction.description}
      </td>
      <td className="py-3 pr-4 text-sm text-slate-500">
        {transaction.categoryName ?? "Sin categoria"}
      </td>
      <td
        className={`py-3 text-right text-sm font-semibold tabular-nums whitespace-nowrap ${
          isIncome ? "text-emerald-700" : "text-slate-900"
        }`}
      >
        {isIncome ? "+" : "−"}
        {currency.format(transaction.amount)}
      </td>
    </tr>
  );
}

export default function Home() {
  const maxAmount = Math.max(...mockBreakdown.map((item) => item.amount));

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">
            FinanceTracker
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Resumen de septiembre de 2026
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Ingresos" value={mockSummary.totalIncome} tone="income" />
          <SummaryCard label="Gastos" value={mockSummary.totalExpense} tone="expense" />
          <SummaryCard label="Balance" value={mockSummary.balance} tone="balance" />
        </section>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Gastos por categoria
          </h2>

          <ul className="mt-4 space-y-3">
            {mockBreakdown.map((item) => (
              <li key={item.categoryName}>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm text-slate-700">
                    {item.categoryName}
                  </span>
                  <span className="text-sm tabular-nums text-slate-500">
                    {currency.format(item.amount)}
                  </span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-slate-700"
                    style={{ width: `${(item.amount / maxAmount) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Movimientos recientes
          </h2>

          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[32rem]">
              <thead>
                <tr className="text-left text-xs font-medium tracking-wide text-slate-400 uppercase">
                  <th className="py-2 pr-4 font-medium">Fecha</th>
                  <th className="py-2 pr-4 font-medium">Concepto</th>
                  <th className="py-2 pr-4 font-medium">Categoria</th>
                  <th className="py-2 text-right font-medium">Importe</th>
                </tr>
              </thead>
              <tbody>
                {mockTransactions.map((transaction) => (
                  <TransactionRow key={transaction.id} transaction={transaction} />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-8 text-xs text-slate-400">
          Datos de ejemplo. Proximamente conectado a la API de FinanceTracker.
        </p>
      </div>
    </main>
  );
}
