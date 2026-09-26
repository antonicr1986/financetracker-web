import type { TransactionDto, TransactionType } from "./types";

/**
 * Filtros del panel: buscador, tipo y categoria, en cliente sobre los
 * movimientos del mes ya cargados. Funciones puras, sin React, para poder
 * probarlas igual que `derive.ts`; la pagina solo guarda el estado.
 *
 * La etiqueta de "sin categoria" llega ya traducida: aqui no hay idioma.
 */

export type TypeFilter = "all" | TransactionType;

export interface TransactionFilters {
  type: TypeFilter;
  /** Nombre de la categoria, o "all". */
  category: string;
  search: string;
}

export const NO_FILTERS: TransactionFilters = { type: "all", category: "all", search: "" };

/** Nombre que se muestra y se filtra: el de la categoria o la etiqueta de "sin categoria". */
export function categoryLabel(item: TransactionDto, noCategoryLabel: string) {
  return item.categoryName ?? noCategoryLabel;
}

/** Categorias presentes en los movimientos, sin repetir y ordenadas segun el idioma. */
export function categoryNamesOf(
  transactions: TransactionDto[],
  noCategoryLabel: string,
  locale: string,
) {
  const names = new Set(transactions.map((item) => categoryLabel(item, noCategoryLabel)));
  return [...names].sort((a, b) => a.localeCompare(b, locale));
}

/**
 * La categoria que de verdad se aplica. Si la elegida no existe en el mes que
 * se esta viendo, se ignora y se vuelve a "all". Resolverlo al leer, y no
 * reiniciando el filtro desde un efecto al cambiar de mes, es lo que evita el
 * aviso del linter; y al volver a un mes que si la tiene, reaparece sola.
 */
export function resolveCategory(chosen: string, available: string[]) {
  return available.includes(chosen) ? chosen : "all";
}

/** Si hay algun filtro puesto. Un buscador con solo espacios no cuenta. */
export function hasActiveFilters(filters: TransactionFilters) {
  return filters.type !== "all" || filters.category !== "all" || filters.search.trim() !== "";
}

/**
 * Movimientos que pasan los tres filtros a la vez. El buscador compara la
 * descripcion sin distinguir mayusculas y sin los espacios de los extremos.
 * `filters.category` tiene que venir ya resuelta con `resolveCategory`.
 */
export function filterTransactions(
  transactions: TransactionDto[],
  filters: TransactionFilters,
  noCategoryLabel: string,
) {
  const needle = filters.search.trim().toLowerCase();

  return transactions.filter((item) => {
    if (filters.type !== "all" && item.type !== filters.type) return false;

    if (
      filters.category !== "all" &&
      categoryLabel(item, noCategoryLabel) !== filters.category
    ) {
      return false;
    }

    if (needle && !item.description.toLowerCase().includes(needle)) return false;

    return true;
  });
}
