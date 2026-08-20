"use client";

import { useEffect, useState } from "react";
import { useYears, useBranchRows, DIVISIONS } from "@/lib/useDashboardData";
import { collapseByBranch, formatNumber, formatPctWithCount } from "@/lib/data-helpers";
import FilterBar from "@/components/ui/FilterBar";
import ChartCard from "@/components/charts/ChartCard";
import PlaceholderBadge from "@/components/ui/PlaceholderBadge";
import KpiCard from "@/components/ui/KpiCard";

export default function VisitorsPage() {
  const { years } = useYears();
  const [year, setYear] = useState<number>();
  const [division, setDivision] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (years.length && !year) setYear(years[years.length - 1]);
  }, [years, year]);

  const { rows, loading } = useBranchRows(year, division === "all" ? undefined : division);

  const branches = collapseByBranch(rows).filter((b) =>
    b.branch.toLowerCase().includes(search.toLowerCase())
  );

  const branchWiseVisitors = branches
    .slice()
    .sort((a, b) => b.total - a.total)
    .map((b) => ({ name: b.branch, visitors: b.total }));

  const divisionWiseVisitors = DIVISIONS.map((d) => ({
    name: d,
    visitors: rows.filter((r) => r.division === d).reduce((s, r) => s + r.total, 0),
  }));

  const male = branches.reduce((s, b) => s + b.male, 0);
  const female = branches.reduce((s, b) => s + b.female, 0);
  const genderTotal = male + female;
  const genderData = [{ name: String(year), male, female }];

  return (
    <div>
      <div className="mb-1">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">Visitors</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Branch-wise, division-wise and gender-wise visitor volumes
        </p>
      </div>

      <FilterBar
        years={years}
        year={year}
        onYearChange={setYear}
        division={division}
        onDivisionChange={setDivision}
        search={search}
        onSearchChange={setSearch}
      />

      {loading || !year ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label={`Total Visitors (${year})`} value={formatNumber(branches.reduce((s, b) => s + b.total, 0))} />
            <KpiCard label="Branches Shown" value={String(branches.length)} />
            <KpiCard label="Male (est.)" value={formatPctWithCount(male, genderTotal)} accent="brand" />
            <KpiCard label="Female (est.)" value={formatPctWithCount(female, genderTotal)} accent="amber" />
          </div>

          <ChartCard
            title={`Branch-wise Visitors — ${year}`}
            subtitle={
              (division === "all" ? "All divisions combined" : division) +
              " — touch/hover a bar for its % share of total visitors"
            }
            data={branchWiseVisitors}
            series={[{ key: "visitors", label: "Visitors", color: "#2358f5" }]}
            xLabel="Branch"
            yLabel="Visitors"
            defaultType="bar"
            showPercent
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title={`Division-wise Visitors — ${year}`}
              subtitle="Touch/hover a bar for its % share of total visitors"
              data={divisionWiseVisitors}
              series={[{ key: "visitors", label: "Visitors", color: "#16a34a" }]}
              xLabel="Division"
              yLabel="Visitors"
              defaultType="bar"
              showPercent
            />
            <div>
              <div className="mb-2">
                <PlaceholderBadge text="Male/Female split is sample data — replace via Manage Data" />
              </div>
              <ChartCard
                title={`Gender Split — ${year}`}
                data={genderData}
                series={[
                  { key: "male", label: "Male", color: "#0ea5e9" },
                  { key: "female", label: "Female", color: "#ec4899" },
                ]}
                defaultType="pie"
                allowedTypes={["pie", "bar"]}
                showPercent
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
