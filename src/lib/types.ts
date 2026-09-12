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
