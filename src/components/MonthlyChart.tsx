"use client";

import { useState } from "react";
import type { MonthlyPoint } from "@/lib/types";
import { useFormatters } from "@/lib/i18n/format";
import { useT } from "@/lib/i18n/useT";

const INCOME = "var(--chart-income)";
const EXPENSE = "var(--chart-expense)";

function niceCeil(value: number) {
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  return Math.ceil(value / magnitude) * magnitude;
}

function Legend() {
  const t = useT();

  return (
    <div className="mb-4 flex items-center gap-4">
      <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
        <span
          className="h-2.5 w-2.5 rounded-sm"
          style={{ backgroundColor: INCOME }}
        />
        {t("dashboard.income")}
      </span>
      <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
        <span
          className="h-2.5 w-2.5 rounded-sm"
          style={{ backgroundColor: EXPENSE }}
        />
        {t("dashboard.expenses")}
      </span>
    </div>
  );
}

export default function MonthlyChart({
  data,
  active,
}: {
  data: MonthlyPoint[];
  active?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const t = useT();
  const { currency: currencyExact, currencyShort } = useFormatters();

  const max = niceCeil(
    Math.max(...data.flatMap((point) => [point.income, point.expense])),
  );
  const ticks = [max, max / 2, 0];

  return (
    <div className="relative">
      <Legend />

      <div className="flex">
        {/* Eje vertical: texto HTML, no escala con el grafico */}
        <div className="flex w-12 shrink-0 flex-col justify-between pr-2 text-right text-[11px] text-slate-400 tabular-nums dark:text-slate-500">
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
                className="absolute inset-x-0 border-t border-slate-200 dark:border-slate-800"
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
                    hovered === index
                      ? "bg-slate-100 dark:bg-slate-800"
                      : point.month === active
                        ? "bg-slate-50 dark:bg-slate-800/50"
                        : ""
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
                className={`flex-1 pt-2 text-center text-[11px] ${
                  point.month === active
                    ? "font-semibold text-slate-900 dark:text-slate-100"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {point.month}
              </span>
            ))}
          </div>
        </div>
      </div>

      {hovered !== null && (
        <div className="pointer-events-none absolute top-0 right-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="font-medium text-slate-900 dark:text-slate-100">{data[hovered].month}</p>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            {t("dashboard.income")}: {currencyExact.format(data[hovered].income)}
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            {t("dashboard.expenses")}: {currencyExact.format(data[hovered].expense)}
          </p>
        </div>
      )}

      <details className="mt-4">
        <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
          {t("dashboard.showData")}
        </summary>
        <div className="overflow-x-auto">
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 dark:text-slate-500">
                <th className="py-1 font-medium">{t("table.month")}</th>
                <th className="py-1 text-right font-medium">{t("dashboard.income")}</th>
                <th className="py-1 text-right font-medium">{t("dashboard.expenses")}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((point) => (
                <tr key={point.month} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-1.5 text-slate-700 dark:text-slate-300">{point.month}</td>
                  <td className="py-1.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                    {currencyExact.format(point.income)}
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
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
