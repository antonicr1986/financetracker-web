// Espejo de los DTOs de la API .NET.
// Cuando conectemos con la API real, estos tipos no cambian.

export type TransactionType = "Income" | "Expense";

export interface TransactionDto {
  id: number;
  description: string;
  amount: number;
  date: string; // ISO 8601, tal y como lo serializa la API
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
