import { describe, expect, it } from "vitest";
import {
  availableMonths,
  breakdownOf,
  monthKey,
  monthShortLabel,
  monthlySeries,
  summaryOf,
  transactionsOfMonth,
} from "./derive";
import type { TransactionDto } from "./types";

let nextId = 1;

function transaction(
  overrides: Partial<TransactionDto> & Pick<TransactionDto, "date" | "amount">,
): TransactionDto {
  return {
    id: nextId++,
    description: "Movimiento",
    type: "Expense",
    categoryId: 1,
    categoryName: "Supermercado",
    ...overrides,
  };
}

describe("monthKey", () => {
  it("takes the month from the string without building a Date", () => {
    // Si pasara por Date, un navegador al oeste de Greenwich leeria esta fecha
    // como el 31 de diciembre y la agruparia en el mes anterior.
    expect(monthKey("2026-01-01T00:00:00")).toBe("2026-01");
  });
});

describe("availableMonths", () => {
  it("returns each month once, oldest first", () => {
    const months = availableMonths([
      transaction({ date: "2026-03-10", amount: 10 }),
      transaction({ date: "2026-01-05", amount: 10 }),
      transaction({ date: "2026-03-22", amount: 10 }),
    ]);

    expect(months).toEqual(["2026-01", "2026-03"]);
  });
});

describe("transactionsOfMonth", () => {
  it("keeps only that month, newest first", () => {
    const result = transactionsOfMonth(
      [
        transaction({ date: "2026-02-01", amount: 10, description: "Primero" }),
        transaction({ date: "2026-03-15", amount: 10, description: "Otro mes" }),
        transaction({ date: "2026-02-20", amount: 10, description: "Ultimo" }),
      ],
      "2026-02",
    );

    expect(result.map((item) => item.description)).toEqual([
      "Ultimo",
      "Primero",
    ]);
  });
});

describe("summaryOf", () => {
  it("adds income and expenses separately and subtracts for the balance", () => {
    const summary = summaryOf([
      transaction({ date: "2026-02-01", amount: 1500, type: "Income" }),
      transaction({ date: "2026-02-02", amount: 400 }),
      transaction({ date: "2026-02-03", amount: 100 }),
    ]);

    expect(summary).toEqual({
      totalIncome: 1500,
      totalExpense: 500,
      balance: 1000,
    });
  });

  it("reports zeros for an empty month instead of failing", () => {
    expect(summaryOf([])).toEqual({
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
    });
  });
});

describe("breakdownOf", () => {
  it("groups expenses by category, largest first, and ignores income", () => {
    const breakdown = breakdownOf([
      transaction({ date: "2026-02-01", amount: 30, categoryName: "Ocio" }),
      transaction({ date: "2026-02-02", amount: 200, categoryName: "Alquiler" }),
      transaction({ date: "2026-02-03", amount: 20, categoryName: "Ocio" }),
      transaction({
        date: "2026-02-04",
        amount: 1500,
        type: "Income",
        categoryName: "Nomina",
      }),
    ]);

    expect(breakdown).toEqual([
      { categoryName: "Alquiler", amount: 200 },
      { categoryName: "Ocio", amount: 50 },
    ]);
  });

  it("groups transactions with no category under a single name", () => {
    const breakdown = breakdownOf([
      transaction({ date: "2026-02-01", amount: 10, categoryName: null }),
      transaction({ date: "2026-02-02", amount: 5, categoryName: null }),
    ]);

    expect(breakdown).toHaveLength(1);
    expect(breakdown[0].amount).toBe(15);
  });
});

describe("monthShortLabel", () => {
  it("follows the language it is given", () => {
    expect(monthShortLabel("2026-01", "es-ES")).toBe("Ene");
    expect(monthShortLabel("2026-01", "en-GB")).toBe("Jan");
  });
});

describe("monthlySeries", () => {
  it("produces one point per month with its totals", () => {
    const series = monthlySeries(
      [
        transaction({ date: "2026-01-10", amount: 1000, type: "Income" }),
        transaction({ date: "2026-01-15", amount: 250 }),
        transaction({ date: "2026-02-10", amount: 400 }),
      ],
      "en-GB",
    );

    expect(series).toEqual([
      { month: "Jan", income: 1000, expense: 250 },
      { month: "Feb", income: 0, expense: 400 },
    ]);
  });
});
