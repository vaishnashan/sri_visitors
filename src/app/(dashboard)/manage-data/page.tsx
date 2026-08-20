"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useYears, useYearsMeta, useBranchRows, DIVISIONS } from "@/lib/useDashboardData";
import { formatNumber } from "@/lib/data-helpers";
import FilterBar from "@/components/ui/FilterBar";
import Modal from "@/components/ui/Modal";
import BranchForm from "@/components/ui/BranchForm";
import PlaceholderBadge from "@/components/ui/PlaceholderBadge";
import AdminUsers from "@/components/ui/AdminUsers";
import type { BranchRow } from "@/types";

export default function ManageDataPage() {
  const { data: session, status } = useSession();
  const { years } = useYears();
  const { yearsMeta, loading: metaLoading } = useYearsMeta();
  const [year, setYear] = useState<number>();
  const [division, setDivision] = useState("all");
  const { rows, loading } = useBranchRows(year, division === "all" ? undefined : division);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BranchRow | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [newYear, setNewYear] = useState("");
  const [newYearMonths, setNewYearMonths] = useState("12");
  const [copyFrom, setCopyFrom] = useState<string>("");
  const [monthsDraft, setMonthsDraft] = useState<Record<number, string>>({});
  const [savingMonths, setSavingMonths] = useState<number | null>(null);

  if (status === "loading") return <p className="text-slate-400 text-sm">Loading...</p>;

  if (!session) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[rgb(17,24,39)] shadow-card p-8 text-center max-w-md mx-auto mt-16">
        <p className="text-4xl mb-3">🔒</p>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Admin login required</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Sign in from the sidebar to add, edit, or remove visitor and feedback data.
        </p>
      </div>
    );
  }

  function openAdd() {
    setEditing(undefined);
    setModalOpen(true);
  }
  function openEdit(row: BranchRow) {
    setEditing(row);
    setModalOpen(true);
  }
  function afterSave() {
    setModalOpen(false);
    setRefreshKey((k) => k + 1);
    window.location.reload();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this record? This cannot be undone.")) return;
    await fetch(`/api/branches/${id}`, { method: "DELETE" });
    window.location.reload();
  }

  async function handleAddYear() {
    const y = Number(newYear);
    if (!y) return;
    const res = await fetch("/api/years", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        year: y,
        monthsCovered: Number(newYearMonths) || 12,
        copyBranchesFromYear: copyFrom || undefined,
      }),
    });
    if (res.ok) {
      setNewYear("");
      setNewYearMonths("12");
      window.location.reload();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Could not add year.");
    }
  }

  async function handleDeleteYear(y: number) {
    if (!confirm(`Delete ALL data for ${y}? This cannot be undone.`)) return;
    await fetch(`/api/years?year=${y}`, { method: "DELETE" });
    window.location.reload();
  }

  async function handleSaveMonths(y: number) {
    const months = Number(monthsDraft[y]);
    if (!months || months < 1 || months > 12) {
      alert("Enter a number of months between 1 and 12.");
      return;
    }
    setSavingMonths(y);
    const res = await fetch("/api/years", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: y, monthsCovered: months }),
    });
    setSavingMonths(null);
    if (res.ok) {
      window.location.reload();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Could not update months covered.");
    }
  }

  return (
    <div>
      <div className="mb-1">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">Manage Data</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Add, edit, or remove branch records, manage which years exist, and manage admin accounts
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[rgb(17,24,39)] shadow-card p-5">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 mb-1">Years</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          "Months covered" is how many months of real data a year has so far — 12 for a completed year, fewer for
          the year still in progress. Yearly Comparison uses this to compare years fairly (monthly average) instead
          of penalizing a partial year for having a smaller raw total.
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {years.map((y) => {
            const meta = yearsMeta.find((m) => m.year === y);
            const draft = monthsDraft[y] ?? String(meta?.monthsCovered ?? 12);
            return (
              <div
                key={y}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 dark:border-slate-700 pl-3 pr-2 py-1 text-sm font-semibold"
              >
                <span>{y}</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={draft}
                  disabled={metaLoading}
                  onChange={(e) => setMonthsDraft((d) => ({ ...d, [y]: e.target.value }))}
                  className="w-12 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-1 py-0.5 text-xs text-center"
                  title="Months of data covered"
                />
                <span className="text-[10px] text-slate-400 font-normal">mo.</span>
                <button
                  onClick={() => handleSaveMonths(y)}
                  disabled={savingMonths === y}
                  className="text-brand-600 hover:text-brand-700 text-xs font-bold"
                  title="Save months covered"
                >
                  ✓
                </button>
                <button onClick={() => handleDeleteYear(y)} className="text-red-500 hover:text-red-700 text-xs" title="Delete year">
                  ✕
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">New year</label>
            <input
              type="number"
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
              placeholder="2027"
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm w-28"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Months covered</label>
            <input
              type="number"
              min={1}
              max={12}
              value={newYearMonths}
              onChange={(e) => setNewYearMonths(e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm w-24"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Pre-fill branches from</label>
            <select
              value={copyFrom}
              onChange={(e) => setCopyFrom(e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            >
              <option value="">Don&apos;t pre-fill</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddYear}
            className="rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2 text-sm"
          >
            + Add year
          </button>
        </div>
      </div>

      <AdminUsers />

      <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
        <FilterBar years={years} year={year} onYearChange={setYear} division={division} onDivisionChange={setDivision} />
        <button onClick={openAdd} className="rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2 text-sm h-fit">
          + Add record
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[rgb(17,24,39)] shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <th className="py-3 px-4">Branch</th>
              <th className="py-3 px-4">Division</th>
              <th className="py-3 px-4">Total</th>
              <th className="py-3 px-4">Excellent</th>
              <th className="py-3 px-4">Good</th>
              <th className="py-3 px-4">Normal</th>
              <th className="py-3 px-4">Satisfaction</th>
              <th className="py-3 px-4">Unsatisfaction</th>
              <th className="py-3 px-4">Not Rated</th>
              <th className="py-3 px-4">Sample?</th>
              <th className="py-3 px-4 no-print">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="py-4 px-4 text-slate-400" colSpan={11}>
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="py-4 px-4 text-slate-400" colSpan={11}>
                  No records for this filter yet. Click &quot;+ Add record&quot; to create one.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800/60">
                  <td className="py-2 px-4 font-semibold">{r.branch}</td>
                  <td className="py-2 px-4">{r.division}</td>
                  <td className="py-2 px-4 font-bold">{formatNumber(r.total)}</td>
                  <td className="py-2 px-4">{formatNumber(r.excellent)}</td>
                  <td className="py-2 px-4">{formatNumber(r.good)}</td>
                  <td className="py-2 px-4">{formatNumber(r.normal)}</td>
                  <td className="py-2 px-4">{formatNumber(r.satisfaction)}</td>
                  <td className="py-2 px-4">{formatNumber(r.unsatisfaction)}</td>
                  <td className="py-2 px-4">{formatNumber(r.notRating)}</td>
                  <td className="py-2 px-4">{r.isPlaceholder ? <PlaceholderBadge text="Sample" /> : ""}</td>
                  <td className="py-2 px-4 no-print">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(r)} className="text-brand-600 hover:underline text-xs font-semibold">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:underline text-xs font-semibold">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Record" : "Add Record"}>
        <BranchForm initial={editing} years={years} onSaved={afterSave} onCancel={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
