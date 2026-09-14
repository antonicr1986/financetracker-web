// Mirror of the .NET API DTOs.
// These types stay the same once the real API is wired up.

export type TransactionType = "Income" | "Expense";

export interface TransactionDto {
  id: number;
  description: string;
  amount: number;
  date: string; // ISO 8601, as serialised by the API
  type: TransactionType;
  categoryId: number | null;
  categoryName: string | null;
}

export interface SummaryDto {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface CategoryBreakdown {
  categoryName: string;
  amount: number;
}

export interface MonthlyPoint {
  month: string;
  income: number;
  expense: number;
}

/** Envelope returned by list endpoints (mirrors PagedResult<T> on the API). */
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
