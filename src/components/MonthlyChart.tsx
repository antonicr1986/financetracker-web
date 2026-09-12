"use client";

import { useState } from "react";
import type { MonthlyPoint } from "@/lib/types";

const INCOME = "#1baf7a";
const EXPENSE = "#eb6834";

const currencyShort = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const currencyExact = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

function niceCeil(value: number) {
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  return Math.ceil(value / magnitude) * magnitude;
}

function Legend() {
  return (
    <div className="mb-4 flex items-center gap-4">
      <span className="flex items-center gap-1.5 text-xs text-slate-600">
        <span
          className="h-2.5 w-2.5 rounded-sm"
          style={{ backgroundColor: INCOME }}
        />
        Ingresos
      </span>
      <span className="flex items-center gap-1.5 text-xs text-slate-600">
        <span
          className="h-2.5 w-2.5 rounded-sm"
          style={{ backgroundColor: EXPENSE }}
        />
        Gastos
      </span>
    </div>
  );
}

export default function MonthlyChart({ data }: { data: MonthlyPoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const max = niceCeil(
    Math.max(...data.flatMap((point) => [point.income, point.expense])),
  );
  const ticks = [max, max / 2, 0];

  return (
    <div className="relative">
      <Legend />

      <div className="flex">
        {/* Eje vertical: texto HTML, no escala con el grafico */}
        <div className="flex w-12 shrink-0 flex-col justify-between pr-2 text-right text-[11px] text-slate-400 tabular-nums">
          {ticks.map((tick) => (
            <span key={tick} className="leading-none">
              {currencyShort.format(tick)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative h-44">
            {/* Lineas de referencia */}
            {ticks.map((tick, index) => (
              <div
                key={tick}
                className="absolute inset-x-0 border-t border-slate-200"
                style={{ top: `${(index / (ticks.length - 1)) * 100}%` }}
              />
            ))}

            {/* Barras */}
            <div className="absolute inset-0 flex items-end">
              {data.map((point, index) => (
                <div
                  key={point.month}
                  onMouseEnter={() => setHovered(index)}
                  onMouseLeave={() => setHovered(null)}
                  className={`flex h-full flex-1 items-end justify-center gap-1 transition-colors ${
                    hovered === index ? "bg-slate-100" : ""
                  }`}
                >
                  <div
                    className="w-2.5 rounded-t sm:w-4"
                    style={{
                      height: `${(point.income / max) * 100}%`,
                      backgroundColor: INCOME,
                    }}
                  />
                  <div
                    className="w-2.5 rounded-t sm:w-4"
                    style={{
                      height: `${(point.expense / max) * 100}%`,
                      backgroundColor: EXPENSE,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Eje horizontal */}
          <div className="flex">
            {data.map((point) => (
              <span
                key={point.month}
                className="flex-1 pt-2 text-center text-[11px] text-slate-500"
              >
                {point.month}
              </span>
            ))}
          </div>
        </div>
      </div>

      {hovered !== null && (
        <div className="pointer-events-none absolute top-0 right-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
          <p className="font-medium text-slate-900">{data[hovered].month}</p>
          <p className="mt-1 text-slate-600">
            Ingresos: {currencyExact.format(data[hovered].income)}
          </p>
          <p className="text-slate-600">
            Gastos: {currencyExact.format(data[hovered].expense)}
          </p>
        </div>
      )}

      <details className="mt-4">
        <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-700">
          Ver datos
        </summary>
        <div className="overflow-x-auto">
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400">
                <th className="py-1 font-medium">Mes</th>
                <th className="py-1 text-right font-medium">Ingresos</th>
                <th className="py-1 text-right font-medium">Gastos</th>
              </tr>
            </thead>
            <tbody>
              {data.map((point) => (
                <tr key={point.month} className="border-t border-slate-100">
                  <td className="py-1.5 text-slate-700">{point.month}</td>
                  <td className="py-1.5 text-right tabular-nums text-slate-700">
                    {currencyExact.format(point.income)}
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-slate-700">
                    {currencyExact.format(point.expense)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
