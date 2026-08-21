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
  LabelList,
} from "recharts";
import type { ChartType } from "@/types";

// ---- Label-sizing helpers -------------------------------------------------
// The old chart config used fixed pixel values (axis height, margins, pie
// radius) that assumed short labels. Real branch/division/category names
// are longer, so rotated x-axis text got clipped at the bottom of the chart,
// and pie slice labels (name + "62.3% (1,234)") ran past the edge of the
// SVG and were cut off — especially on narrower/mobile widths. These
// helpers size things off the actual label content instead.

function longestLabelLength(data: Array<Record<string, string | number>>): number {
  return data.reduce((max, d) => Math.max(max, String(d.name ?? "").length), 0);
}

/** Font size for x-axis ticks: shrink a bit as the category count grows. */
function xTickFontSize(count: number): number {
  if (count > 14) return 10;
  if (count > 8) return 11;
  return 12;
}

/** Height to reserve for a rotated (-35°) x-axis label so it never gets
 *  clipped by the bottom of the chart. `withCaption` adds extra room for the
 *  axis title (e.g. "Branch") that sits below the rotated tick text. */
function xAxisHeight(maxLabelLen: number, fontSize: number, withCaption: boolean): number {
  const approxCharWidth = fontSize * 0.62;
  const textWidth = maxLabelLen * approxCharWidth;
  const verticalFootprint = textWidth * Math.sin((35 * Math.PI) / 180); // rotated extent
  const base = Math.min(130, Math.max(48, verticalFootprint + 26));
  return Math.round(base + (withCaption ? 20 : 0));
}

/** With very few categories, ResponsiveContainer stretching to 100% of a
 *  wide card leaves huge dead gaps between 2–3 skinny bars/points — reads as
 *  an empty, unfinished chart. Cap the plot width and center it so bar/point
 *  spacing stays proportionate regardless of how wide the card is. */
function plotWidthPct(categoryCount: number): number {
  if (categoryCount <= 3) return 44;
  if (categoryCount <= 4) return 56;
  if (categoryCount <= 6) return 74;
  if (categoryCount <= 8) return 88;
  return 100;
}

/** Thicker bars when there's only a couple of categories, so they read as
 *  substantial rather than as thin stripes in a mostly-empty card. */
function barMaxSize(categoryCount: number): number {
  if (categoryCount <= 3) return 84;
  if (categoryCount <= 6) return 64;
  if (categoryCount <= 10) return 48;
  return 34;
}

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
  height = 400,
  valueFormatter,
  showPercent = false,
}: ChartCardProps) {
  const [type, setType] = useState<ChartType>(defaultType);
  const fmt = valueFormatter ?? ((v: number) => new Intl.NumberFormat("en-US").format(v));

  // Sizing derived from the actual data, so labels always have enough room.
  const tickFontSize = xTickFontSize(data.length);
  const maxLabelLen = longestLabelLength(data);
  const rotateXLabels = data.length > 5 || maxLabelLen > 9;
  const axisHeight = rotateXLabels ? xAxisHeight(maxLabelLen, tickFontSize, !!xLabel) : 34 + (xLabel ? 20 : 0);
  const bottomMargin = axisHeight + 10;
  const longestYTick = Math.max(
    0,
    ...data.flatMap((d) => series.map((s) => fmt(Number(d[s.key]) || 0).length))
  );
  const yAxisWidth = Math.max(46, longestYTick * 7 + 14) + (yLabel ? 20 : 0);
  const leftMargin = yLabel ? 8 : 4;
  const plotWidth = type === "pie" ? 100 : plotWidthPct(data.length);
  const maxBarSize = barMaxSize(data.length);
  // Bars/points get a permanent on-chart value label (not just on hover) —
  // this matters both for readability and because "Print / Export" strips
  // all UI chrome, so a hover-only tooltip would print as a blank chart.
  // Skip it once there are enough categories that the labels would just
  // collide with each other; the tooltip still covers that case.
  const showOnChartLabels = data.length <= 12;
  const onChartLabelFontSize = data.length > 8 ? 10 : 11;

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
  const pieLabelFontSize = pieData.length > 8 ? 10 : pieData.length > 5 ? 11 : 12;

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

  // Short text for the permanent on-bar/on-point label — the percentage
  // when showPercent is on (row-relative for multi-series, e.g. positive vs.
  // unsatisfaction within one branch's bar pair), otherwise the raw number.
  // This needs the whole data row (not just the one series' value), so it's
  // used as a LabelList `content` renderer rather than a plain `formatter`.
  function onChartLabelText(seriesKey: string, row: Record<string, string | number>): string {
    const raw = Number(row[seriesKey]) || 0;
    if (!showPercent) return fmt(raw);
    let total: number;
    if (series.length === 1) {
      total = data.reduce((s, d) => s + (Number(d[series[0].key]) || 0), 0);
    } else {
      total = series.reduce((s, ser) => s + (Number(row[ser.key]) || 0), 0);
    }
    const pct = total ? (raw / total) * 100 : 0;
    return `${pct.toFixed(1)}%`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function renderBarLabel(seriesKey: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (props: any) => {
      if (!showOnChartLabels) return null;
      const { x, y, width, index } = props;
      const row = data[index];
      if (!row) return null;
      return (
        <text
          x={x + (width ?? 0) / 2}
          y={(y ?? 0) - 6}
          textAnchor="middle"
          fontSize={onChartLabelFontSize}
          fontWeight={600}
          fill="currentColor"
          className="text-slate-700 dark:text-slate-200"
        >
          {onChartLabelText(seriesKey, row)}
        </text>
      );
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function renderLineLabel(seriesKey: string, color: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (props: any) => {
      if (!showOnChartLabels) return null;
      const { x, y, index } = props;
      const row = data[index];
      if (!row) return null;
      return (
        <text x={x} y={(y ?? 0) - 12} textAnchor="middle" fontSize={onChartLabelFontSize} fontWeight={600} fill={color}>
          {onChartLabelText(seriesKey, row)}
        </text>
      );
    };
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[rgb(17,24,39)] shadow-card p-5">
      <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
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

      <div className={plotWidth < 100 ? "flex justify-center" : undefined}>
        <ResponsiveContainer width={plotWidth < 100 ? `${plotWidth}%` : "100%"} height={height} minWidth={260}>
          {type === "bar" ? (
            <BarChart
              data={data}
              margin={{ top: 22, right: 16, left: leftMargin, bottom: bottomMargin }}
              barCategoryGap="28%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: tickFontSize, fontWeight: 600, fill: "currentColor" }}
                className="text-slate-600 dark:text-slate-300"
                axisLine={{ stroke: "currentColor", className: "text-slate-300 dark:text-slate-700" }}
                tickLine={{ stroke: "currentColor", className: "text-slate-300 dark:text-slate-700" }}
                angle={rotateXLabels ? -35 : 0}
                textAnchor={rotateXLabels ? "end" : "middle"}
                interval={0}
                height={axisHeight}
                tickMargin={8}
                label={
                  xLabel
                    ? {
                        value: xLabel,
                        position: "insideBottom",
                        offset: -4,
                        fontSize: 12,
                        fontWeight: 700,
                        fill: "currentColor",
                      }
                    : undefined
                }
              />
              <YAxis
                tick={{ fontSize: 12, fontWeight: 600, fill: "currentColor" }}
                className="text-slate-600 dark:text-slate-300"
                axisLine={{ stroke: "currentColor", className: "text-slate-300 dark:text-slate-700" }}
                tickLine={{ stroke: "currentColor", className: "text-slate-300 dark:text-slate-700" }}
                tickFormatter={fmt}
                width={yAxisWidth}
                label={
                  yLabel
                    ? {
                        value: yLabel,
                        angle: -90,
                        position: "insideLeft",
                        offset: 8,
                        style: { textAnchor: "middle", fontSize: 12, fontWeight: 700, fill: "currentColor" },
                      }
                    : undefined
                }
              />
              <Tooltip
                formatter={barTooltipFormatter}
                cursor={{ fill: "currentColor", className: "text-slate-100 dark:text-slate-800", opacity: 0.6 }}
                contentStyle={{
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 10,
                  border: "1px solid rgba(148,163,184,0.35)",
                  boxShadow: "0 4px 14px rgba(16,24,40,0.12)",
                  padding: "8px 12px",
                }}
              />
              {series.length > 1 && (
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 8 }} iconType="circle" iconSize={8} />
              )}
              {series.map((s) => (
                <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={maxBarSize}>
                  <LabelList dataKey={s.key} content={renderBarLabel(s.key)} />
                </Bar>
              ))}
            </BarChart>
          ) : type === "line" ? (
            <LineChart data={data} margin={{ top: 22, right: 16, left: leftMargin, bottom: bottomMargin }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: tickFontSize, fontWeight: 600, fill: "currentColor" }}
                className="text-slate-600 dark:text-slate-300"
                axisLine={{ stroke: "currentColor", className: "text-slate-300 dark:text-slate-700" }}
                tickLine={{ stroke: "currentColor", className: "text-slate-300 dark:text-slate-700" }}
                angle={rotateXLabels ? -35 : 0}
                textAnchor={rotateXLabels ? "end" : "middle"}
                interval={0}
                height={axisHeight}
                tickMargin={8}
                label={
                  xLabel
                    ? {
                        value: xLabel,
                        position: "insideBottom",
                        offset: -4,
                        fontSize: 12,
                        fontWeight: 700,
                        fill: "currentColor",
                      }
                    : undefined
                }
              />
              <YAxis
                tick={{ fontSize: 12, fontWeight: 600, fill: "currentColor" }}
                className="text-slate-600 dark:text-slate-300"
                axisLine={{ stroke: "currentColor", className: "text-slate-300 dark:text-slate-700" }}
                tickLine={{ stroke: "currentColor", className: "text-slate-300 dark:text-slate-700" }}
                tickFormatter={fmt}
                width={yAxisWidth}
                label={
                  yLabel
                    ? {
                        value: yLabel,
                        angle: -90,
                        position: "insideLeft",
                        offset: 8,
                        style: { textAnchor: "middle", fontSize: 12, fontWeight: 700, fill: "currentColor" },
                      }
                    : undefined
                }
              />
              <Tooltip
                formatter={barTooltipFormatter}
                contentStyle={{
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 10,
                  border: "1px solid rgba(148,163,184,0.35)",
                  boxShadow: "0 4px 14px rgba(16,24,40,0.12)",
                  padding: "8px 12px",
                }}
              />
              {series.length > 1 && (
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 8 }} iconType="circle" iconSize={8} />
              )}
              {series.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: "white" }}
                  activeDot={{ r: 6 }}
                >
                  <LabelList dataKey={s.key} content={renderLineLabel(s.key, s.color)} />
                </Line>
              ))}
            </LineChart>
          ) : (
            <PieChart margin={{ top: 24, right: 70, bottom: 24, left: 70 }}>
              <Tooltip
                formatter={(v: number, name: string) => [showPercent ? pctCountLabel(v, pieTotal) : fmt(v), name]}
                contentStyle={{
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 10,
                  border: "1px solid rgba(148,163,184,0.35)",
                  boxShadow: "0 4px 14px rgba(16,24,40,0.12)",
                  padding: "8px 12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 8 }} iconType="circle" iconSize={8} />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                // Percentage radius (not a fixed pixel value derived only from
                // `height`) so the pie — and the label text radiating outward
                // from it — always fits inside whichever dimension (width or
                // height) is actually the tighter one. This is what was
                // pushing slice labels past the edge of the chart on
                // narrower/mobile screens.
                outerRadius="68%"
                paddingAngle={pieData.length > 1 ? 1.5 : 0}
                stroke="var(--chart-pie-stroke, #fff)"
                strokeWidth={2}
                labelLine={{ stroke: "currentColor", strokeWidth: 1, className: "text-slate-300 dark:text-slate-600" }}
                // Custom label renderer: keeps the on-slice text short (just
                // the percentage/count — the slice name is already in the
                // legend and in the tooltip) and anchors it left/right based
                // on which side of the pie it's on, so it grows away from the
                // chart center instead of running off either edge.
                label={(props) => {
                  const { cx: pcx, cy: pcy, midAngle, outerRadius: r, index } = props;
                  const RADIAN = Math.PI / 180;
                  const labelRadius = Number(r) + 18;
                  const x = Number(pcx) + labelRadius * Math.cos(-midAngle * RADIAN);
                  const y = Number(pcy) + labelRadius * Math.sin(-midAngle * RADIAN);
                  const entry = pieData[index];
                  if (!entry) return null;
                  const text = showPercent ? pctCountLabel(entry.value, pieTotal) : fmt(entry.value);
                  return (
                    <text
                      x={x}
                      y={y}
                      fill="currentColor"
                      className="text-slate-700 dark:text-slate-200"
                      fontSize={pieLabelFontSize}
                      fontWeight={600}
                      textAnchor={x > Number(pcx) ? "start" : "end"}
                      dominantBaseline="central"
                    >
                      {text}
                    </text>
                  );
                }}
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
    </div>
  );
}

const PALETTE = ["#2358f5", "#16a34a", "#eab308", "#ef4444", "#0ea5e9", "#a855f7", "#f97316", "#14b8a6"];
