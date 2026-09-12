"use client";

import { useState } from "react";
import type { MonthlyPoint } from "@/lib/types";

const INCOME = "#1baf7a";
const EXPENSE = "#eb6834";

const currency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const currencyExact = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

// Geometria del grafico, en unidades del viewBox.
const W = 640;
const H = 240;
const PAD_L = 52;
const PAD_R = 8;
const PAD_T = 12;
const PAD_B = 28;

const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

function niceCeil(value: number) {
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  return Math.ceil(value / magnitude) * magnitude;
}

export default function MonthlyChart({ data }: { data: MonthlyPoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const max = niceCeil(
    Math.max(...data.flatMap((point) => [point.income, point.expense])),
  );
  const ticks = [0, max / 2, max];

  const bandWidth = PLOT_W / data.length;
  const barWidth = Math.min(22, (bandWidth - 12) / 2);

  const y = (value: number) => PAD_T + PLOT_H - (value / max) * PLOT_H;

  return (
    <div className="relative">
      <div className="mb-3 flex items-center gap-4">
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

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Evolucion mensual de ingresos y gastos"
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={y(tick)}
              y2={y(tick)}
              stroke="#e2e8f0"
              strokeWidth={1}
            />
            <text
              x={PAD_L - 8}
              y={y(tick) + 4}
              textAnchor="end"
              className="fill-slate-400"
              fontSize={11}
            >
              {currency.format(tick)}
            </text>
          </g>
        ))}

        {data.map((point, index) => {
          const bandStart = PAD_L + index * bandWidth;
          const center = bandStart + bandWidth / 2;
          const incomeX = center - barWidth - 1;
          const expenseX = center + 1;
          const isHovered = hovered === index;

          return (
            <g
              key={point.month}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
            >
              <rect
                x={bandStart}
                y={PAD_T}
                width={bandWidth}
                height={PLOT_H}
                fill={isHovered ? "#f1f5f9" : "transparent"}
              />

              <rect
                x={incomeX}
                y={y(point.income)}
                width={barWidth}
                height={PAD_T + PLOT_H - y(point.income)}
                rx={4}
                fill={INCOME}
              />
              <rect
                x={expenseX}
                y={y(point.expense)}
                width={barWidth}
                height={PAD_T + PLOT_H - y(point.expense)}
                rx={4}
                fill={EXPENSE}
              />

              <text
                x={center}
                y={H - 8}
                textAnchor="middle"
                className="fill-slate-500"
                fontSize={11}
              >
                {point.month}
              </text>
            </g>
          );
        })}
      </svg>

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
      </details>
    </div>
  );
}
