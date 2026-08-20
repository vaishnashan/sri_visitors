"use client";

import { useEffect, useState } from "react";
import { useYears, useBranchRows, DIVISIONS } from "@/lib/useDashboardData";
import { collapseByBranch, positiveCount, categoryTotals, formatNumber, formatPct, satisfactionRate, unsatisfactionRate } from "@/lib/data-helpers";
import FilterBar from "@/components/ui/FilterBar";
import ChartCard from "@/components/charts/ChartCard";
import KpiCard from "@/components/ui/KpiCard";
import { CATEGORY_KEYS, CATEGORY_LABELS, CATEGORY_COLORS } from "@/types";

export default function FeedbackPage() {
  const { years } = useYears();
  const [year, setYear] = useState<number>();
  const [division, setDivision] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");

  useEffect(() => {
    if (years.length && !year) setYear(years[years.length - 1]);
  }, [years, year]);

  const { rows, loading } = useBranchRows(year, division === "all" ? undefined : division);
  const branches = collapseByBranch(rows);

  const branchFeedback = branches
    .slice()
    .sort((a, b) => satisfactionRate(b) - satisfactionRate(a))
    .map((b) => ({
      name: b.branch,
      positive: positiveCount(b),
      unsatisfaction: b.unsatisfaction,
    }));

  const divisionFeedback = DIVISIONS.map((d) => {
    const dRows = rows.filter((r) => r.division === d);
    const total = dRows.reduce((s, r) => s + r.total, 0);
    const positive = dRows.reduce((s, r) => s + positiveCount(r), 0);
    const unsat = dRows.reduce((s, r) => s + r.unsatisfaction, 0);
    return {
      name: d,
      positivePct: total ? Math.round((positive / total) * 1000) / 10 : 0,
      unsatisfactionPct: total ? Math.round((unsat / total) * 1000) / 10 : 0,
    };
  });

  const catTotals = categoryTotals(rows);
  const categoryData = [
    CATEGORY_KEYS.reduce((acc, k) => ({ ...acc, [k]: catTotals[k] }), { name: String(year) } as Record<string, string | number>),
  ];

  const branchOptions = branches.map((b) => b.branch).sort();
  const selected = branches.find((b) => b.branch === selectedBranch);
  const selectedBranchData = selected
    ? [CATEGORY_KEYS.reduce((acc, k) => ({ ...acc, [k]: selected[k] }), { name: selected.branch } as Record<string, string | number>)]
    : [];

  const totalPositivePct = branches.length
    ? formatPct((branches.reduce((s, b) => s + positiveCount(b), 0) / Math.max(1, branches.reduce((s, b) => s + b.total, 0))) * 100)
    : "0.0%";

  return (
    <div>
      <div className="mb-1">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">Feedback</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Branch-wise and division-wise feedback quality, and category breakdowns
        </p>
      </div>

      <FilterBar years={years} year={year} onYearChange={setYear} division={division} onDivisionChange={setDivision} />

      {loading || !year ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Positive Feedback" value={totalPositivePct} accent="green" />
            <KpiCard label="Excellent" value={formatNumber(catTotals.excellent)} accent="green" />
            <KpiCard label="Unsatisfaction" value={formatNumber(catTotals.unsatisfaction)} accent="red" />
            <KpiCard label="Not Rated" value={formatNumber(catTotals.notRating)} accent="amber" />
          </div>

          <ChartCard
            title={`Branch-wise Feedback — ${year}`}
            subtitle="Positive vs. unsatisfied responses, sorted by satisfaction rate — touch/hover a bar for its % within that branch"
            data={branchFeedback}
            series={[
              { key: "positive", label: "Positive", color: "#16a34a" },
              { key: "unsatisfaction", label: "Unsatisfaction", color: "#ef4444" },
            ]}
            xLabel="Branch"
            yLabel="Responses"
            defaultType="bar"
            allowedTypes={["bar", "line"]}
            showPercent
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title={`Division-wise Feedback — ${year}`}
              subtitle="Positive % vs. unsatisfaction % by division"
              data={divisionFeedback}
              series={[
                { key: "positivePct", label: "Positive %", color: "#0ea5e9" },
                { key: "unsatisfactionPct", label: "Unsatisfaction %", color: "#ef4444" },
              ]}
              xLabel="Division"
              yLabel="Percent"
              defaultType="bar"
              allowedTypes={["bar", "line"]}
              valueFormatter={(v) => `${v}%`}
            />
            <ChartCard
              title={`Feedback Categories — ${year}`}
              subtitle="Company-wide total per category"
              data={categoryData}
              series={CATEGORY_KEYS.map((k) => ({ key: k, label: CATEGORY_LABELS[k], color: CATEGORY_COLORS[k] }))}
              defaultType="pie"
              allowedTypes={["pie", "bar"]}
              showPercent
            />
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[rgb(17,24,39)] shadow-card p-5">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">Single Branch Category Breakdown</h3>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm font-semibold"
              >
                <option value="all">Choose a branch…</option>
                {branchOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            {selected ? (
              <ChartCard
                title={`${selected.branch} — Category Breakdown (${year})`}
                subtitle={`Satisfaction rate ${formatPct(satisfactionRate(selected))} · Unsatisfaction rate ${formatPct(unsatisfactionRate(selected))}`}
                data={selectedBranchData}
                series={CATEGORY_KEYS.map((k) => ({ key: k, label: CATEGORY_LABELS[k], color: CATEGORY_COLORS[k] }))}
                defaultType="pie"
                allowedTypes={["pie", "bar"]}
                showPercent
              />
            ) : (
              <p className="text-sm text-slate-400">Pick a branch above to see its category breakdown.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
