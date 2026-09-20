import type {
  CategoryBreakdown,
  MonthlyPoint,
  SummaryDto,
  TransactionDto,
} from "./types";

/** "2026-09-04" -> "2026-09". Sin crear Date: evita sorpresas de zona horaria. */
export function monthKey(isoDate: string) {
  return isoDate.slice(0, 7);
}

/**
 * Las etiquetas de mes salen de Intl y no de una lista escrita a mano, para que
 * sigan al idioma elegido. Los formateadores se cachean porque crearlos es caro
 * y aqui se llaman una vez por mes y por render.
 */
const formatterCache = new Map<string, Intl.DateTimeFormat>();

function monthFormatter(tag: string, options: Intl.DateTimeFormatOptions) {
  const cacheKey = `${tag}|${JSON.stringify(options)}`;
  let formatter = formatterCache.get(cacheKey);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(tag, options);
    formatterCache.set(cacheKey, formatter);
  }

  return formatter;
}

/** Mediodia del dia 1: aleja el valor de cualquier salto de zona horaria. */
function monthDate(key: string) {
  return new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1, 12);
}

export function monthShortLabel(key: string, tag = "es-ES") {
  const label = monthFormatter(tag, { month: "short" })
    .format(monthDate(key))
    .replace(".", "");

  // Intl devuelve el mes en minuscula en espanol; aqui se usa como etiqueta.
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function monthLongLabel(key: string, tag = "es-ES") {
  const label = monthFormatter(tag, {
    month: "long",
    year: "numeric",
  }).format(monthDate(key));

  return label.charAt(0).toUpperCase() + label.slice(1);
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
  tag = "es-ES",
): MonthlyPoint[] {
  return availableMonths(transactions).map((key) => {
    const summary = summaryOf(transactionsOfMonth(transactions, key));
    return {
      month: monthShortLabel(key, tag),
      income: summary.totalIncome,
      expense: summary.totalExpense,
    };
  });
}
