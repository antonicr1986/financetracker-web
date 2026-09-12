import type {
  CategoryBreakdown,
  MonthlyPoint,
  SummaryDto,
  TransactionDto,
} from "./types";

const MONTH_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** "2026-09-04" -> "2026-09". Sin crear Date: evita sorpresas de zona horaria. */
export function monthKey(isoDate: string) {
  return isoDate.slice(0, 7);
}

export function monthShortLabel(key: string) {
  return MONTH_LABELS[Number(key.slice(5, 7)) - 1];
}

export function monthLongLabel(key: string) {
  const month = MONTH_NAMES[Number(key.slice(5, 7)) - 1];
  return `${month} de ${key.slice(0, 4)}`;
}

/** Meses presentes en los datos, del mas antiguo al mas reciente. */
export function availableMonths(transactions: TransactionDto[]) {
  return [...new Set(transactions.map((t) => monthKey(t.date)))].sort();
}

export function transactionsOfMonth(
  transactions: TransactionDto[],
  key: string,
) {
  return transactions
    .filter((t) => monthKey(t.date) === key)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function summaryOf(transactions: TransactionDto[]): SummaryDto {
  const totalIncome = transactions
    .filter((t) => t.type === "Income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "Expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
  };
}

export function breakdownOf(
  transactions: TransactionDto[],
): CategoryBreakdown[] {
  const totals = new Map<string, number>();

  for (const transaction of transactions) {
    if (transaction.type !== "Expense") continue;
    const name = transaction.categoryName ?? "Sin categoria";
    totals.set(name, (totals.get(name) ?? 0) + transaction.amount);
  }

  return [...totals.entries()]
    .map(([categoryName, amount]) => ({ categoryName, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function monthlySeries(
  transactions: TransactionDto[],
): MonthlyPoint[] {
  return availableMonths(transactions).map((key) => {
    const summary = summaryOf(transactionsOfMonth(transactions, key));
    return {
      month: monthShortLabel(key),
      income: summary.totalIncome,
      expense: summary.totalExpense,
    };
  });
}
