import { describe, expect, it } from "vitest";
import {
  NO_FILTERS,
  categoryNamesOf,
  filterTransactions,
  hasActiveFilters,
  resolveCategory,
} from "./filters";
import type { TransactionDto } from "./types";

const NO_CATEGORY = "Sin categoría";

let nextId = 1;

function transaction(overrides: Partial<TransactionDto>): TransactionDto {
  return {
    id: nextId++,
    description: "Movimiento",
    amount: 10,
    date: "2026-09-10T00:00:00",
    type: "Expense",
    categoryId: 1,
    categoryName: "Supermercado",
    ...overrides,
  };
}

const month = [
  transaction({ description: "Compra semanal", categoryName: "Supermercado" }),
  transaction({ description: "Cine con amigos", categoryName: "Ocio" }),
  transaction({ description: "Nómina de septiembre", type: "Income", categoryName: "Nómina" }),
  transaction({ description: "Regalo sin categoría", categoryId: null, categoryName: null }),
];

function descriptions(items: TransactionDto[]) {
  return items.map((item) => item.description);
}

describe("filterTransactions", () => {
  it("returns every transaction when no filter is set", () => {
    expect(filterTransactions(month, NO_FILTERS, NO_CATEGORY)).toHaveLength(month.length);
  });

  it("keeps only the chosen type", () => {
    const result = filterTransactions(month, { ...NO_FILTERS, type: "Income" }, NO_CATEGORY);

    expect(descriptions(result)).toEqual(["Nómina de septiembre"]);
  });

  it("filters by category name", () => {
    const result = filterTransactions(month, { ...NO_FILTERS, category: "Ocio" }, NO_CATEGORY);

    expect(descriptions(result)).toEqual(["Cine con amigos"]);
  });

  it("treats transactions without a category as the no-category label", () => {
    const result = filterTransactions(month, { ...NO_FILTERS, category: NO_CATEGORY }, NO_CATEGORY);

    expect(descriptions(result)).toEqual(["Regalo sin categoría"]);
  });

  it("searches the description ignoring case and surrounding spaces", () => {
    const result = filterTransactions(month, { ...NO_FILTERS, search: "  COMPRA " }, NO_CATEGORY);

    expect(descriptions(result)).toEqual(["Compra semanal"]);
  });

  it("treats a search made only of spaces as no search", () => {
    const result = filterTransactions(month, { ...NO_FILTERS, search: "   " }, NO_CATEGORY);

    expect(result).toHaveLength(month.length);
  });

  it("applies the three filters at the same time", () => {
    const items = [
      transaction({ description: "Cine", type: "Expense", categoryName: "Ocio" }),
      transaction({ description: "Cine", type: "Income", categoryName: "Ocio" }),
      transaction({ description: "Cine", type: "Expense", categoryName: "Supermercado" }),
      transaction({ description: "Teatro", type: "Expense", categoryName: "Ocio" }),
    ];

    const result = filterTransactions(
      items,
      { type: "Expense", category: "Ocio", search: "cine" },
      NO_CATEGORY,
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(items[0]);
  });
});

describe("categoryNamesOf", () => {
  it("lists each category once, including the no-category label", () => {
    const names = categoryNamesOf(
      [...month, transaction({ categoryName: "Ocio" })],
      NO_CATEGORY,
      "es",
    );

    expect(names).toHaveLength(4);
    expect(names).toContain(NO_CATEGORY);
    expect(names.filter((name) => name === "Ocio")).toHaveLength(1);
  });

  it("sorts following the language, so an accented name is not pushed to the end", () => {
    const names = categoryNamesOf(
      [
        transaction({ categoryName: "Viajes" }),
        transaction({ categoryName: "Ámbar" }),
        transaction({ categoryName: "Bebidas" }),
      ],
      NO_CATEGORY,
      "es",
    );

    // Con un orden por codigo de caracter, "Ámbar" iria despues de "Viajes".
    expect(names).toEqual(["Ámbar", "Bebidas", "Viajes"]);
  });
});

describe("resolveCategory", () => {
  it("keeps the chosen category while the month has it", () => {
    expect(resolveCategory("Ocio", ["Ocio", "Supermercado"])).toBe("Ocio");
  });

  it("falls back to all when the month being viewed does not have it", () => {
    // Elegida "Viajes" en agosto; septiembre no tiene ninguno.
    expect(resolveCategory("Viajes", ["Ocio", "Supermercado"])).toBe("all");
  });

  it("brings the choice back on its own when returning to a month that has it", () => {
    // El filtro guardado no se ha borrado: solo se ignoraba.
    const chosen = "Viajes";

    expect(resolveCategory(chosen, ["Ocio"])).toBe("all");
    expect(resolveCategory(chosen, ["Ocio", "Viajes"])).toBe("Viajes");
  });
});

describe("hasActiveFilters", () => {
  it("is false with no filters and with a search made only of spaces", () => {
    expect(hasActiveFilters(NO_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...NO_FILTERS, search: "   " })).toBe(false);
  });

  it("is true as soon as any of the three is set", () => {
    expect(hasActiveFilters({ ...NO_FILTERS, type: "Expense" })).toBe(true);
    expect(hasActiveFilters({ ...NO_FILTERS, category: "Ocio" })).toBe(true);
    expect(hasActiveFilters({ ...NO_FILTERS, search: "cine" })).toBe(true);
  });
});
