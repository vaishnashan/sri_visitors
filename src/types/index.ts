export interface BranchRow {
  id: number;
  year: number;
  division: string;
  branch: string;
  total: number;
  excellent: number;
  good: number;
  normal: number;
  satisfaction: number;
  unsatisfaction: number;
  notRating: number;
  male: number;
  female: number;
  isPlaceholder: boolean;
}

export const CATEGORY_LABELS: Record<string, string> = {
  excellent: "Excellent",
  good: "Good",
  normal: "Normal",
  satisfaction: "Satisfaction",
  unsatisfaction: "Unsatisfaction",
  notRating: "Not Rated",
};

export const CATEGORY_KEYS = [
  "excellent",
  "good",
  "normal",
  "satisfaction",
  "unsatisfaction",
  "notRating",
] as const;

export const POSITIVE_KEYS = ["excellent", "good", "satisfaction"] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  excellent: "#16a34a",
  good: "#22c55e",
  normal: "#eab308",
  satisfaction: "#0ea5e9",
  unsatisfaction: "#ef4444",
  notRating: "#94a3b8",
};

export type ChartType = "bar" | "line" | "pie";
