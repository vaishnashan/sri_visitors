"use client";

import { DIVISIONS } from "@/lib/useDashboardData";

export default function FilterBar({
  years,
  year,
  onYearChange,
  division,
  onDivisionChange,
  search,
  onSearchChange,
}: {
  years: number[];
  year: number | undefined;
  onYearChange: (y: number) => void;
  division?: string;
  onDivisionChange?: (d: string) => void;
  search?: string;
  onSearchChange?: (s: string) => void;
}) {
  return (
    <div className="no-print flex flex-wrap items-center gap-3 mb-6">
      <div className="flex items-center gap-2">
        <label className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Year</label>
        <select
          value={year ?? ""}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm font-semibold"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {onDivisionChange && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Division
          </label>
          <select
            value={division ?? "all"}
            onChange={(e) => onDivisionChange(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm font-semibold"
          >
            <option value="all">All Divisions</option>
            {DIVISIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      )}

      {onSearchChange && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Search
          </label>
          <input
            value={search ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Branch name..."
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm"
          />
        </div>
      )}
    </div>
  );
}
