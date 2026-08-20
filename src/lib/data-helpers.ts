import { BranchRow, POSITIVE_KEYS } from "@/types";

export function positiveCount(row: BranchRow): number {
  return POSITIVE_KEYS.reduce((sum, k) => sum + row[k], 0);
}

/**
 * Broader "positive" total used only for the 3-slice Positive /
 * Unsatisfaction / Not Rated summary, so the three slices always add up to
 * exactly 100%: Positive here = Excellent + Good + Normal + Satisfaction
 * (everything that isn't Unsatisfaction or Not Rated).
 */
export function overallPositiveCount(row: BranchRow): number {
  return row.excellent + row.good + row.normal + row.satisfaction;
}

export interface SatisfactionSummary {
  positive: number;
  unsatisfaction: number;
  notRated: number;
  positivePct: number;
  unsatisfactionPct: number;
  notRatedPct: number;
}

/** Positive / Unsatisfaction / Not Rated, guaranteed to sum to 100%. */
export function satisfactionSummary(rowsForYear: BranchRow[]): SatisfactionSummary {
  const branches = collapseByBranch(rowsForYear);
  const positive = branches.reduce((s, b) => s + overallPositiveCount(b), 0);
  const unsatisfaction = branches.reduce((s, b) => s + b.unsatisfaction, 0);
  const notRated = branches.reduce((s, b) => s + b.notRating, 0);
  const total = positive + unsatisfaction + notRated;
  return {
    positive,
    unsatisfaction,
    notRated,
    positivePct: total ? (positive / total) * 100 : 0,
    unsatisfactionPct: total ? (unsatisfaction / total) * 100 : 0,
    notRatedPct: total ? (notRated / total) * 100 : 0,
  };
}

export function satisfactionRate(row: BranchRow): number {
  return row.total === 0 ? 0 : (positiveCount(row) / row.total) * 100;
}

export function unsatisfactionRate(row: BranchRow): number {
  return row.total === 0 ? 0 : (row.unsatisfaction / row.total) * 100;
}

/** Collapse division-level rows into one row per branch (sum across divisions). */
export function collapseByBranch(rows: BranchRow[]): BranchRow[] {
  const map = new Map<string, BranchRow>();
  for (const r of rows) {
    const key = r.branch;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...r, division: "All Divisions" });
    } else {
      existing.total += r.total;
      existing.excellent += r.excellent;
      existing.good += r.good;
      existing.normal += r.normal;
      existing.satisfaction += r.satisfaction;
      existing.unsatisfaction += r.unsatisfaction;
      existing.notRating += r.notRating;
      existing.male += r.male;
      existing.female += r.female;
    }
  }
  return Array.from(map.values());
}

export interface YearSummary {
  totalVisitors: number;
  topBranch: string | null;
  topBranchVisits: number;
  positiveFeedback: number;
  positivePct: number;
  unsatisfaction: number;
  unsatisfactionPct: number;
  notRated: number;
  notRatedPct: number;
  branchCount: number;
}

export function yearSummary(rowsForYear: BranchRow[]): YearSummary {
  const branches = collapseByBranch(rowsForYear);
  const totalVisitors = branches.reduce((s, b) => s + b.total, 0);
  const positive = branches.reduce((s, b) => s + positiveCount(b), 0);
  const unsatisfaction = branches.reduce((s, b) => s + b.unsatisfaction, 0);
  const notRated = branches.reduce((s, b) => s + b.notRating, 0);
  const top = branches.reduce<BranchRow | null>(
    (best, b) => (!best || b.total > best.total ? b : best),
    null
  );

  return {
    totalVisitors,
    topBranch: top?.branch ?? null,
    topBranchVisits: top?.total ?? 0,
    positiveFeedback: positive,
    positivePct: totalVisitors ? (positive / totalVisitors) * 100 : 0,
    unsatisfaction,
    unsatisfactionPct: totalVisitors ? (unsatisfaction / totalVisitors) * 100 : 0,
    notRated,
    notRatedPct: totalVisitors ? (notRated / totalVisitors) * 100 : 0,
    branchCount: branches.length,
  };
}

export function topPerformers(rowsForYear: BranchRow[], n = 3): BranchRow[] {
  return collapseByBranch(rowsForYear)
    .slice()
    .sort((a, b) => satisfactionRate(b) - satisfactionRate(a))
    .slice(0, n);
}

export function categoryTotals(rowsForYear: BranchRow[]) {
  const branches = collapseByBranch(rowsForYear);
  return {
    excellent: branches.reduce((s, b) => s + b.excellent, 0),
    good: branches.reduce((s, b) => s + b.good, 0),
    normal: branches.reduce((s, b) => s + b.normal, 0),
    satisfaction: branches.reduce((s, b) => s + b.satisfaction, 0),
    unsatisfaction: branches.reduce((s, b) => s + b.unsatisfaction, 0),
    notRating: branches.reduce((s, b) => s + b.notRating, 0),
  };
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

export function formatPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

/** "62.3% (1,234)" — percentage first, raw count in brackets. */
export function formatPctWithCount(value: number, total: number): string {
  const pct = total ? (value / total) * 100 : 0;
  return `${pct.toFixed(1)}% (${formatNumber(value)})`;
}

/** Total visitors normalized to a monthly average, so a 6-month year can be
 *  fairly compared against a full 12-month year. */
export function monthlyAverage(totalVisitors: number, monthsCovered: number): number {
  return monthsCovered > 0 ? totalVisitors / monthsCovered : 0;
}
