"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { ChartType } from "@/types";

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
}

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  data: Array<Record<string, string | number>>;
  series: ChartSeries[];
  xLabel?: string;
  yLabel?: string;
  defaultType?: ChartType;
  allowedTypes?: ChartType[];
  height?: number;
  valueFormatter?: (v: number) => string;
  /** When true, tooltips (and pie labels) show "62.3% (1,234)" instead of
   *  just the raw number — percentage first, count in brackets. For a
   *  single-series chart the percentage is each item's share of the grand
   *  total across all items; for a multi-series chart it's each series'
   *  share within that row (e.g. positive vs. unsatisfaction for one branch). */
  showPercent?: boolean;
}

const TYPE_LABEL: Record<ChartType, string> = { bar: "Bar", line: "Line", pie: "Pie" };

export default function ChartCard({
  title,
  subtitle,
  data,
  series,
  xLabel,
  yLabel,
  defaultType = "bar",
  allowedTypes = ["bar", "line", "pie"],
  height = 340,
  valueFormatter,
  showPercent = false,
}: ChartCardProps) {
  const [type, setType] = useState<ChartType>(defaultType);
  const fmt = valueFormatter ?? ((v: number) => new Intl.NumberFormat("en-US").format(v));

  // Pie mode: aggregate the first (or only) series across all data rows into slices.
  const pieData =
    series.length === 1
      ? data.map((d) => ({ name: String(d.name), value: Number(d[series[0].key]) || 0 }))
      : series.map((s) => ({
          name: s.label,
          value: data.reduce((sum, d) => sum + (Number(d[s.key]) || 0), 0),
        }));

  const pieTotal = pieData.reduce((s, d) => s + d.value, 0);
  const pctCountLabel = (value: number, total: number) => {
    const pct = total ? (value / total) * 100 : 0;
    return `${pct.toFixed(1)}% (${fmt(value)})`;
  };

  // For bar/line tooltips: single-series charts compare each item against
  // the grand total across all items; multi-series charts compare each
  // series against the total for that one row.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function barTooltipFormatter(value: number, name: string, entry: any) {
    if (!showPercent) return [fmt(value), name];
    let total: number;
    if (series.length === 1) {
      total = data.reduce((s, d) => s + (Number(d[series[0].key]) || 0), 0);
    } else {
      const row = entry?.payload as Record<string, string | number> | undefined;
      total = series.reduce((s, ser) => s + (Number(row?.[ser.key]) || 0), 0);
    }
    return [pctCountLabel(value, total), name];
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[rgb(17,24,39)] shadow-card p-5">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {allowedTypes.length > 1 && (
          <div className="flex rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden no-print">
            {allowedTypes.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                  type === t
                    ? "bg-brand-600 text-white"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        {type === "bar" ? (
          <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: xLabel ? 24 : 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fontWeight: 600 }}
              angle={-35}
              textAnchor="end"
              interval={0}
              height={60}
              label={xLabel ? { value: xLabel, position: "insideBottom", offset: -4, fontSize: 12 } : undefined}
            />
            <YAxis
              tick={{ fontSize: 12, fontWeight: 600 }}
              tickFormatter={fmt}
              label={yLabel ? { value: yLabel, angle: -90, position: "insideLeft", fontSize: 12 } : undefined}
            />
            <Tooltip formatter={barTooltipFormatter} contentStyle={{ fontSize: 13, fontWeight: 600 }} />
            {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />}
            {series.map((s) => (
              <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        ) : type === "line" ? (
          <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: xLabel ? 24 : 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fontWeight: 600 }}
              label={xLabel ? { value: xLabel, position: "insideBottom", offset: -4, fontSize: 12 } : undefined}
            />
            <YAxis
              tick={{ fontSize: 12, fontWeight: 600 }}
              tickFormatter={fmt}
              label={yLabel ? { value: yLabel, angle: -90, position: "insideLeft", fontSize: 12 } : undefined}
            />
            <Tooltip formatter={barTooltipFormatter} contentStyle={{ fontSize: 13, fontWeight: 600 }} />
            {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />}
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            ))}
          </LineChart>
        ) : (
          <PieChart>
            <Tooltip
              formatter={(v: number) => (showPercent ? pctCountLabel(v, pieTotal) : fmt(v))}
              contentStyle={{ fontSize: 13, fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={Math.min(height, 340) / 2 - 30}
              label={(entry) =>
                showPercent ? `${entry.name}: ${pctCountLabel(entry.value, pieTotal)}` : `${entry.name}: ${fmt(entry.value)}`
              }
            >
              {pieData.map((_, i) => (
                <Cell
                  key={i}
                  fill={series.length === 1 ? PALETTE[i % PALETTE.length] : series[i]?.color ?? PALETTE[i % PALETTE.length]}
                />
              ))}
            </Pie>
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

const PALETTE = ["#2358f5", "#16a34a", "#eab308", "#ef4444", "#0ea5e9", "#a855f7", "#f97316", "#14b8a6"];
