"use client";

import { useState } from "react";
import { DIVISIONS } from "@/lib/useDashboardData";
import type { BranchRow } from "@/types";

const NUMBER_FIELDS = [
  "excellent",
  "good",
  "normal",
  "satisfaction",
  "unsatisfaction",
  "notRating",
  "male",
  "female",
] as const;

const FIELD_LABELS: Record<string, string> = {
  excellent: "Excellent",
  good: "Good",
  normal: "Normal",
  satisfaction: "Satisfaction",
  unsatisfaction: "Unsatisfaction",
  notRating: "Not Rated",
  male: "Male",
  female: "Female",
};

export default function BranchForm({
  initial,
  years,
  onSaved,
  onCancel,
}: {
  initial?: Partial<BranchRow>;
  years: number[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    year: initial?.year ?? years[years.length - 1] ?? new Date().getFullYear(),
    division: initial?.division ?? DIVISIONS[0],
    branch: initial?.branch ?? "",
    excellent: initial?.excellent ?? 0,
    good: initial?.good ?? 0,
    normal: initial?.normal ?? 0,
    satisfaction: initial?.satisfaction ?? 0,
    unsatisfaction: initial?.unsatisfaction ?? 0,
    notRating: initial?.notRating ?? 0,
    male: initial?.male ?? 0,
    female: initial?.female ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const total =
    form.excellent + form.good + form.normal + form.satisfaction + form.unsatisfaction + form.notRating;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.branch.trim()) {
      setError("Branch name is required.");
      return;
    }
    setSaving(true);
    setError("");
    const url = initial?.id ? `/api/branches/${initial.id}` : "/api/branches";
    const method = initial?.id ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not save this record.");
      return;
    }
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Year</label>
          <select
            value={form.year}
            onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            disabled={!!initial?.id}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Division</label>
          <select
            value={form.division}
            onChange={(e) => setForm({ ...form, division: e.target.value })}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          >
            {DIVISIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Branch Name</label>
        <input
          value={form.branch}
          onChange={(e) => setForm({ ...form, branch: e.target.value })}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          placeholder="e.g. ADR"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {NUMBER_FIELDS.map((f) => (
          <div key={f}>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{FIELD_LABELS[f]}</label>
            <input
              type="number"
              min={0}
              value={form[f]}
              onChange={(e) => setForm({ ...form, [f]: Number(e.target.value) || 0 })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            />
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-between">
        <span className="text-xs font-bold uppercase text-slate-500">Total (auto-calculated)</span>
        <span className="text-lg font-extrabold text-brand-600 dark:text-brand-400">{total}</span>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold px-4 py-2 text-sm"
        >
          {saving ? "Saving..." : "Save record"}
        </button>
      </div>
    </form>
  );
}
