"use client";

import { useEffect, useState } from "react";
import { useYears, useBranchRows } from "@/lib/useDashboardData";
import { collapseByBranch, yearSummary, topPerformers, categoryTotals, satisfactionSummary, formatNumber, formatPct } from "@/lib/data-helpers";
import FilterBar from "@/components/ui/FilterBar";
import KpiCard from "@/components/ui/KpiCard";
import ChartCard from "@/components/charts/ChartCard";
import { CATEGORY_KEYS, CATEGORY_LABELS, CATEGORY_COLORS } from "@/types";

export default function OverviewPage() {
  const { years } = useYears();
  const [year, setYear] = useState<number>();
  useEffect(() => {
    if (years.length && !year) setYear(years[years.length - 1]);
  }, [years, year]);

  const { rows, loading } = useBranchRows(year);
  const branches = collapseByBranch(rows);
  const summary = yearSummary(rows);
  const top3 = topPerformers(rows, 3);
  const catTotals = categoryTotals(rows);
  const satSummary = satisfactionSummary(rows);

  const satisfactionSummaryData = [
    {
      name: String(year),
      positive: satSummary.positive,
      unsatisfaction: satSummary.unsatisfaction,
      notRated: satSummary.notRated,
    },
  ];

  const visitorsByBranch = branches
    .slice()
    .sort((a, b) => b.total - a.total)
    .map((b) => ({ name: b.branch, visitors: b.total }));

  const categoryData = [
    CATEGORY_KEYS.reduce(
      (acc, k) => ({ ...acc, [k]: catTotals[k] }),
      { name: String(year) } as Record<string, string | number>
    ),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">Overview</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Year-wise snapshot of visitors and feedback across all branches
          </p>
        </div>
      </div>

      <FilterBar years={years} year={year} onYearChange={setYear} />

      {loading || !year ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard label="Total Visitors" value={formatNumber(summary.totalVisitors)} sub={`Across ${summary.branchCount} branches`} />
            <KpiCard
              label="Top Branch"
              value={summary.topBranch ?? "—"}
              sub={`${formatNumber(summary.topBranchVisits)} visitors`}
              accent="brand"
            />
            <KpiCard label="Positive Feedback" value={formatPct(satSummary.positivePct)} sub={`${formatNumber(satSummary.positive)} responses`} accent="green" />
            <KpiCard label="Unsatisfaction Rate" value={formatPct(satSummary.unsatisfactionPct)} sub={`${formatNumber(satSummary.unsatisfaction)} responses`} accent="red" />
            <KpiCard label="Not Rated" value={formatPct(satSummary.notRatedPct)} sub={`${formatNumber(satSummary.notRated)} responses`} accent="amber" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title={`Overall Satisfaction Summary — ${year}`}
              subtitle="Positive + Unsatisfaction + Not Rated always add up to 100%. Positive = Excellent + Good + Normal + Satisfaction."
              data={satisfactionSummaryData}
              series={[
                { key: "positive", label: "Positive", color: "#16a34a" },
                { key: "unsatisfaction", label: "Unsatisfaction", color: "#ef4444" },
                { key: "notRated", label: "Not Rated", color: "#94a3b8" },
              ]}
              defaultType="pie"
              allowedTypes={["pie", "bar"]}
              showPercent
            />
            <ChartCard
              title={`Feedback Breakdown — ${year}`}
              subtitle="Detailed category split, company-wide (touch/hover a slice for % and count)"
              data={categoryData}
              series={CATEGORY_KEYS.map((k) => ({ key: k, label: CATEGORY_LABELS[k], color: CATEGORY_COLORS[k] }))}
              defaultType="pie"
              allowedTypes={["pie", "bar"]}
              showPercent
            />
          </div>

          <ChartCard
            title={`Total Visitors — ${year}`}
            subtitle="By branch, highest to lowest — touch/hover a bar for its % share of total visitors"
            data={visitorsByBranch}
            series={[{ key: "visitors", label: "Visitors", color: "#2358f5" }]}
            xLabel="Branch"
            yLabel="Visitors"
            defaultType="bar"
            allowedTypes={["bar", "line", "pie"]}
            showPercent
          />

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[rgb(17,24,39)] shadow-card p-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 mb-4">🏆 Top 3 Performing Branches</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {top3.map((b, i) => {
                const positive = b.excellent + b.good + b.satisfaction;
                const rate = b.total ? (positive / b.total) * 100 : 0;
                return (
                  <div
                    key={b.branch}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-extrabold text-brand-600 dark:text-brand-400">#{i + 1}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
                        {formatPct(rate)}
                      </span>
                    </div>
                    <p className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-50">{b.branch}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{formatNumber(positive)} positive responses</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
