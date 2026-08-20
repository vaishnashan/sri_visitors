"use client";

import { useYears, useYearsMeta, useBranchRows } from "@/lib/useDashboardData";
import { yearSummary, monthlyAverage, formatNumber, formatPct } from "@/lib/data-helpers";
import ChartCard from "@/components/charts/ChartCard";

export default function YearlyComparisonPage() {
  const { years } = useYears();
  const { yearsMeta } = useYearsMeta();
  const { rows, loading } = useBranchRows(); // all years, all divisions

  const monthsFor = (y: number) => yearsMeta.find((m) => m.year === y)?.monthsCovered ?? 12;

  const perYear = years.map((y) => {
    const yearRows = rows.filter((r) => r.year === y);
    const s = yearSummary(yearRows);
    const monthsCovered = monthsFor(y);
    return { year: y, monthsCovered, ...s, monthlyAvg: monthlyAverage(s.totalVisitors, monthsCovered) };
  });

  // Top chart: normalized monthly-average comparison, so a 6-month year
  // isn't unfairly compared against a full 12-month year.
  const monthlyAvgData = perYear.map((y) => ({
    name: y.monthsCovered < 12 ? `${y.year} (${y.monthsCovered} mo.)` : String(y.year),
    monthlyAvg: Math.round(y.monthlyAvg),
  }));

  const visitorsTrend = perYear.map((y) => ({ name: String(y.year), visitors: y.totalVisitors }));
  const rateTrend = perYear.map((y) => ({
    name: String(y.year),
    positive: Math.round(y.positivePct * 10) / 10,
    unsatisfaction: Math.round(y.unsatisfactionPct * 10) / 10,
  }));

  // Year-over-year change computed on the monthly average (fair, period-
  // normalized) rather than the raw total, so a partial current year still
  // gives a meaningful comparison against a full prior year.
  const yoy = perYear.map((y, i) => {
    if (i === 0) return { ...y, change: null as number | null, pctChange: null as number | null };
    const prevAvg = perYear[i - 1].monthlyAvg;
    const change = y.monthlyAvg - prevAvg;
    const pctChange = prevAvg ? (change / prevAvg) * 100 : null;
    return { ...y, change, pctChange };
  });

  return (
    <div>
      <div className="mb-1">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">Yearly Comparison</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Visitors and feedback rates across all years, compared on a fair, same-period (monthly average) basis
        </p>
      </div>

      {loading || years.length === 0 ? (
        <p className="text-slate-400 text-sm mt-6">Loading...</p>
      ) : (
        <div className="space-y-6 mt-6">
          <ChartCard
            title="Monthly Average Visitors by Year (normalized)"
            subtitle="Total visitors ÷ months of data available for that year — the fair way to compare a partial year against a full year. Touch/hover a bar for its % share."
            data={monthlyAvgData}
            series={[{ key: "monthlyAvg", label: "Avg. Visitors / Month", color: "#a855f7" }]}
            xLabel="Year"
            yLabel="Visitors / Month"
            defaultType="bar"
            allowedTypes={["bar", "line"]}
            showPercent
          />

          <ChartCard
            title="Total Visitors by Year (raw totals)"
            subtitle="Not adjusted for partial years — a shorter year will naturally look smaller here even if its monthly pace is similar. See the normalized chart above for a fair comparison."
            data={visitorsTrend}
            series={[{ key: "visitors", label: "Total Visitors", color: "#2358f5" }]}
            xLabel="Year"
            yLabel="Visitors"
            defaultType="line"
          />

          <ChartCard
            title="Positive vs. Unsatisfaction Rate Trend"
            data={rateTrend}
            series={[
              { key: "positive", label: "Positive %", color: "#16a34a" },
              { key: "unsatisfaction", label: "Unsatisfaction %", color: "#ef4444" },
            ]}
            xLabel="Year"
            yLabel="Percent"
            defaultType="line"
            allowedTypes={["line", "bar"]}
            valueFormatter={(v) => `${v}%`}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {yoy.map((y) => (
              <div key={y.year} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[rgb(17,24,39)] shadow-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {y.year} {y.monthsCovered < 12 && <span className="text-amber-600 dark:text-amber-400">· {y.monthsCovered} mo. so far</span>}
                </p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-slate-50">{formatNumber(y.totalVisitors)}</p>
                <p className="text-xs text-slate-400 mt-0.5">≈ {formatNumber(Math.round(y.monthlyAvg))} / month</p>
                {y.pctChange === null ? (
                  <p className="text-sm text-slate-400 mt-1">No prior year</p>
                ) : (
                  <p className={`text-sm font-bold mt-1 ${y.pctChange >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {y.pctChange >= 0 ? "▲" : "▼"} {formatPct(Math.abs(y.pctChange))} vs {y.year - 1} (monthly avg)
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[rgb(17,24,39)] shadow-card p-5 overflow-x-auto">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 mb-4">Yearly Summary Table</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-2 pr-4">Year</th>
                  <th className="py-2 pr-4">Months Covered</th>
                  <th className="py-2 pr-4">Total Visitors</th>
                  <th className="py-2 pr-4">Avg. / Month</th>
                  <th className="py-2 pr-4">Positive %</th>
                  <th className="py-2 pr-4">Unsatisfaction %</th>
                  <th className="py-2 pr-4">Top Branch</th>
                  <th className="py-2 pr-4">YoY Change (monthly avg)</th>
                </tr>
              </thead>
              <tbody>
                {yoy.map((y) => (
                  <tr key={y.year} className="border-b border-slate-100 dark:border-slate-800/60">
                    <td className="py-2 pr-4 font-bold">{y.year}</td>
                    <td className="py-2 pr-4">{y.monthsCovered}</td>
                    <td className="py-2 pr-4">{formatNumber(y.totalVisitors)}</td>
                    <td className="py-2 pr-4">{formatNumber(Math.round(y.monthlyAvg))}</td>
                    <td className="py-2 pr-4 text-emerald-600 font-semibold">{formatPct(y.positivePct)}</td>
                    <td className="py-2 pr-4 text-red-600 font-semibold">{formatPct(y.unsatisfactionPct)}</td>
                    <td className="py-2 pr-4">{y.topBranch ?? "—"}</td>
                    <td className="py-2 pr-4">
                      {y.pctChange === null ? "—" : `${y.pctChange >= 0 ? "+" : ""}${y.pctChange.toFixed(1)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-slate-400 mt-3">
              Set how many months of real data each year has (12 for a full past year, fewer for the current
              in-progress year) from Manage Data → Years.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
