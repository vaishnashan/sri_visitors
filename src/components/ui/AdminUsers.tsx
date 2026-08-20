"use client";

import { useEffect, useState } from "react";

interface AdminUserRow {
  id: number;
  username: string;
  name: string;
  createdAt: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/admin-users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }

  useEffect(load, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !username.trim() || !password) {
      setError("Name, username and password are all required.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username, password }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not create this account.");
      return;
    }
    setName("");
    setUsername("");
    setPassword("");
    load();
  }

  async function handleDelete(id: number, label: string) {
    if (!confirm(`Remove admin access for "${label}"? They will no longer be able to sign in.`)) return;
    const res = await fetch(`/api/admin-users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Could not remove this account.");
      return;
    }
    load();
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[rgb(17,24,39)] shadow-card p-5">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 mb-1">Admin Users</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        Each teammate gets their own username and password so several people can be signed in and editing data at
        the same time — nobody has to share one login.
      </p>

      {loading ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-4">
          {users.map((u) => (
            <span
              key={u.id}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 dark:border-slate-700 px-3 py-1 text-sm font-semibold"
            >
              {u.name} <span className="text-slate-400 font-normal">({u.username})</span>
              <button
                onClick={() => handleDelete(u.id, u.name)}
                className="text-red-500 hover:text-red-700 text-xs"
                title="Remove admin"
              >
                ✕
              </button>
            </span>
          ))}
          {users.length === 0 && <span className="text-sm text-slate-400">No admin accounts yet.</span>}
        </div>
      )}

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{error}</div>}

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Full name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Vaish Nashan"
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="vaish"
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold px-4 py-2 text-sm"
        >
          {saving ? "Adding..." : "+ Add admin"}
        </button>
      </form>
    </div>
  );
}
