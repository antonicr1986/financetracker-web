import type {
  CategoryBreakdown,
  SummaryDto,
  TransactionDto,
} from "./types";

// Datos de ejemplo mientras la API no esta desplegada.
// Se sustituyen por llamadas reales sin tocar los componentes.

export const mockTransactions: TransactionDto[] = [
  {
    id: 1,
    description: "Nomina",
    amount: 2100,
    date: "2026-09-01",
    type: "Income",
    categoryId: 1,
    categoryName: "Salario",
  },
  {
    id: 2,
    description: "Alquiler",
    amount: 750,
    date: "2026-09-02",
    type: "Expense",
    categoryId: 2,
    categoryName: "Vivienda",
  },
  {
    id: 3,
    description: "Compra semanal",
    amount: 96.4,
    date: "2026-09-04",
    type: "Expense",
    categoryId: 3,
    categoryName: "Alimentacion",
  },
  {
    id: 4,
    description: "Gasolina",
    amount: 62.15,
    date: "2026-09-06",
    type: "Expense",
    categoryId: 4,
    categoryName: "Transporte",
  },
  {
    id: 5,
    description: "Cena fuera",
    amount: 43.8,
    date: "2026-09-08",
    type: "Expense",
    categoryId: 3,
    categoryName: "Alimentacion",
  },
  {
    id: 6,
    description: "Clase particular",
    amount: 120,
    date: "2026-09-09",
    type: "Income",
    categoryId: 5,
    categoryName: "Extras",
  },
  {
    id: 7,
    description: "Internet y movil",
    amount: 54.9,
    date: "2026-09-10",
    type: "Expense",
    categoryId: 6,
    categoryName: "Suministros",
  },
  {
    id: 8,
    description: "Farmacia",
    amount: 18.25,
    date: "2026-09-11",
    type: "Expense",
    categoryId: 7,
    categoryName: "Otros",
  },
];

export const mockSummary: SummaryDto = {
  totalIncome: 2220,
  totalExpense: 1145.5,
  balance: 1074.5,
};

export const mockBreakdown: CategoryBreakdown[] = [
  { categoryName: "Vivienda", amount: 750 },
  { categoryName: "Alimentacion", amount: 140.2 },
  { categoryName: "Transporte", amount: 62.15 },
  { categoryName: "Suministros", amount: 54.9 },
  { categoryName: "Otros", amount: 18.25 },
];
