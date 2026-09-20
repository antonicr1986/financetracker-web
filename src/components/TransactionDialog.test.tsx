import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TransactionDialog from "./TransactionDialog";
import {
  createCategory,
  createTransaction,
  deleteTransaction,
  getCategories,
  updateTransaction,
} from "@/lib/api/client";
import { es } from "@/lib/i18n/messages";
import { setLocale } from "@/lib/i18n/locale";
import type { CategoryDto, TransactionDto } from "@/lib/types";

// Se sustituyen solo las llamadas a la API: el resto del modulo (ApiError,
// entre otros) lo usa el traductor de errores y tiene que seguir siendo el real.
vi.mock("@/lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/client")>();

  return {
    ...actual,
    getCategories: vi.fn(),
    createCategory: vi.fn(),
    createTransaction: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
  };
});

const groceries: CategoryDto = { id: 1, name: "Supermercado", type: "Expense" };
const salary: CategoryDto = { id: 2, name: "Nomina", type: "Income" };

const existing: TransactionDto = {
  id: 77,
  description: "Compra del sabado",
  amount: 42.5,
  date: "2026-02-14T00:00:00",
  type: "Expense",
  categoryId: groceries.id,
  categoryName: groceries.name,
};

// Los textos se leen del diccionario y no se escriben a mano: asi la prueba
// comprueba el comportamiento y no se rompe al retocar una palabra.
const label = {
  type: es["dialog.type"],
  amount: es["dialog.amount"],
  concept: es["dialog.concept"],
  category: es["dialog.category"],
  newCategory: es["dialog.newCategory"],
};

function renderDialog(transaction: TransactionDto | null) {
  const onSaved = vi.fn();
  const onClose = vi.fn();

  render(
    <TransactionDialog
      transaction={transaction}
      onClose={onClose}
      onSaved={onSaved}
    />,
  );

  return { onSaved, onClose, user: userEvent.setup() };
}

beforeEach(() => {
  // Sin nada guardado, getLocale() cae al idioma del navegador, y el de jsdom
  // es en-US. Se fija el espanol para poder comparar con el diccionario `es`.
  setLocale("es");

  vi.mocked(getCategories).mockResolvedValue([groceries, salary]);
  vi.mocked(createCategory).mockReset();
  vi.mocked(createTransaction).mockReset();
  vi.mocked(updateTransaction).mockReset();
  vi.mocked(deleteTransaction).mockReset();
});

describe("TransactionDialog, editing", () => {
  it("starts with the transaction already loaded into the fields", async () => {
    renderDialog(existing);

    expect(screen.getByLabelText(label.concept)).toHaveValue(
      existing.description,
    );
    expect(screen.getByLabelText(label.amount)).toHaveValue(existing.amount);

    // La API devuelve la fecha como ISO completo y el <input type="date">
    // solo acepta AAAA-MM-DD.
    expect(screen.getByLabelText(es["dialog.date"])).toHaveValue("2026-02-14");

    await waitFor(() => {
      expect(screen.getByLabelText(label.category)).toHaveValue(
        String(groceries.id),
      );
    });
  });

  it("sends the edit to the API with the id of the transaction", async () => {
    const { user, onSaved } = renderDialog(existing);
    vi.mocked(updateTransaction).mockResolvedValue();

    await waitFor(() => {
      expect(screen.getByLabelText(label.category)).toHaveValue(
        String(groceries.id),
      );
    });

    const amount = screen.getByLabelText(label.amount);
    await user.clear(amount);
    await user.type(amount, "99.99");
    await user.click(screen.getByRole("button", { name: es["dialog.save"] }));

    await waitFor(() => {
      expect(updateTransaction).toHaveBeenCalledWith(
        existing.id,
        expect.objectContaining({ amount: 99.99, categoryId: groceries.id }),
      );
    });

    expect(onSaved).toHaveBeenCalled();
  });

  it("does not delete until the deletion is confirmed", async () => {
    const { user } = renderDialog(existing);
    vi.mocked(deleteTransaction).mockResolvedValue();

    await user.click(screen.getByRole("button", { name: es["dialog.delete"] }));
    expect(deleteTransaction).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: es["dialog.deleteYes"] }),
    );

    await waitFor(() => {
      expect(deleteTransaction).toHaveBeenCalledWith(existing.id);
    });
  });
});

describe("TransactionDialog, categories", () => {
  it("clears the chosen category when the type changes", async () => {
    const { user } = renderDialog(null);

    const category = await screen.findByLabelText(label.category);
    await user.selectOptions(category, String(groceries.id));
    expect(category).toHaveValue(String(groceries.id));

    // Una categoria de gastos no vale para un ingreso: la API lo rechaza, asi
    // que la seleccion tiene que caerse sola al cambiar de tipo.
    await user.selectOptions(screen.getByLabelText(label.type), "Income");
    expect(category).toHaveValue("");
  });

  it("creates a category with Enter without submitting the transaction", async () => {
    const { user } = renderDialog(null);
    vi.mocked(createCategory).mockResolvedValue({
      id: 9,
      name: "Farmacia",
      type: "Expense",
    });

    await user.click(
      await screen.findByRole("button", { name: label.newCategory }),
    );
    await user.type(screen.getByLabelText(label.newCategory), "Farmacia{Enter}");

    await waitFor(() => {
      expect(createCategory).toHaveBeenCalledWith("Farmacia", "Expense");
    });

    // El campo vive dentro del formulario del movimiento: sin interceptar el
    // Enter, esto habria enviado el formulario de fuera.
    expect(createTransaction).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByLabelText(label.category)).toHaveValue("9");
    });
  });
});
