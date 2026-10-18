import { describe, expect, it } from "vitest";
import { en, es, type MessageKey } from "./messages";

const keys = Object.keys(es) as MessageKey[];

/** Las variables entre llaves de un texto: "{count} movimientos" -> ["count"]. */
function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
}

describe("dictionaries", () => {
  it("have exactly the same keys in Spanish and English", () => {
    expect(Object.keys(en).sort()).toEqual([...keys].sort());
  });

  it("have no empty texts", () => {
    const empty = keys.filter((key) => !es[key].trim() || !en[key].trim());

    expect(empty).toEqual([]);
  });

  it("use the same variables in both languages", () => {
    const mismatched = keys.filter(
      (key) => placeholders(es[key]).join() !== placeholders(en[key]).join(),
    );

    expect(mismatched).toEqual([]);
  });
});
