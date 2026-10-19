"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { redirectIfUnauthorized } from "@/lib/adminClient";
import { GATHERING_TYPES } from "@/lib/gatheringTemplates";

type Varo = { _id: string; title: string; capacity?: number; assignedPeople?: string[] };
type Gathering = { _id: string; tags?: string[]; date: string; notes?: string; varos: Varo[]; shoeCount: { size: string; qty: number }[] };

function typeBadges(tags?: string[]) {
  if (!tags?.length) {
    const { value, bg, text } = GATHERING_TYPES[GATHERING_TYPES.length - 1];
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${bg} ${text}`}>{value}</span>;
  }
  return (
    <span className="flex flex-wrap gap-1">
      {tags.map(tag => {
        const match = GATHERING_TYPES.find(t => t.value === tag) ?? GATHERING_TYPES[GATHERING_TYPES.length - 1];
        return <span key={tag} className={`text-xs px-2 py-0.5 rounded-full font-medium ${match.bg} ${match.text}`}>{match.value}</span>;
      })}
    </span>
  );
}

type DeleteTarget = { id: string; label: string };

export default function GatheringsPage() {
  const [items, setItems] = useState<Gathering[]>([]);
  const [loading, setLoading] = useState(true);

  const [tags, setTags] = useState<string[]>(["Friday Vaaros"]);
  const [typeDropOpen, setTypeDropOpen] = useState(false);
  const [notes, setNotes] = useState<string>("");

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const calendarCells = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: ({ key: string; day: number } | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ key: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`, day: d });
    }
    return cells;
  }, [viewMonth]);

  function shiftMonth(delta: number) {
    setViewMonth(v => new Date(v.getFullYear(), v.getMonth() + delta, 1));
  }

  function toggleDate(key: string) {
    setSelectedDates(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key].sort()));
  }

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/gatherings", { cache: "no-store" });
    if (!res.ok) {
      if (!redirectIfUnauthorized(res)) alert("Could not load gatherings. Please refresh the page.");
      setLoading(false);
      return;
    }
    const data = (await res.json()) as Gathering[];
    setItems([...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function onDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/gatherings/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) { alert(`Failed to delete: ${await res.text()}`); return; }
    setDeleteTarget(null);
    setDeleteInput("");
    await load();
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (selectedDates.length === 0) { alert("Pick at least one date"); return; }
    setCreating(true);
    const failed: string[] = [];
    for (const key of selectedDates) {
      const localDate = new Date(key + "T12:00:00");
      const res = await fetch("/api/admin/gatherings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags, date: localDate.toISOString(), notes }),
      });
      if (!res.ok) failed.push(key);
    }
    setCreating(false);
    if (failed.length) {
      alert(`Failed to create gatherings for: ${failed.join(", ")}`);
      setSelectedDates(failed);
    } else {
      setSelectedDates([]);
      setNotes("");
      setTags(["Friday Vaaros"]);
    }
    await load();
  }

  return (
    <div className="admin-page space-y-6">

      {/* Header + create form */}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <h1 className="page-heading">Gatherings</h1>
          {!loading && <p className="text-sm text-gray-500 mt-0.5">{items.length} total</p>}
        </div>
        <form onSubmit={onCreate} className="flex flex-wrap gap-2 items-end">
          <div className="relative">
            {typeDropOpen && <div className="fixed inset-0 z-10" onClick={() => setTypeDropOpen(false)} />}
            <button
              type="button"
              onClick={() => setTypeDropOpen(o => !o)}
              className="ismaili-input text-sm flex items-center gap-2 w-full sm:min-w-44"
            >
              <span className="flex-1 text-left">{tags.length === 0 ? "Select type…" : tags.join(", ")}</span>
              <span className="text-gray-400">▾</span>
            </button>
            {typeDropOpen && (
              <div className="absolute left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1.5 min-w-44 z-20">
                {GATHERING_TYPES.map(t => (
                  <label key={t.value} className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={tags.includes(t.value)}
                      onChange={e => setTags(prev => e.target.checked ? [...prev, t.value] : prev.filter(v => v !== t.value))}
                    />
                    {t.value}
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            {calendarOpen && <div className="fixed inset-0 z-10" onClick={() => setCalendarOpen(false)} />}
            <button
              type="button"
              onClick={() => setCalendarOpen(o => !o)}
              className="ismaili-input text-sm flex items-center gap-2 w-full sm:min-w-44"
            >
              <span className="flex-1 text-left">
                {selectedDates.length === 0 ? "Pick dates…" : `${selectedDates.length} date${selectedDates.length > 1 ? "s" : ""} selected`}
              </span>
              <span className="text-gray-400">▾</span>
            </button>
            {calendarOpen && (
              <div className="absolute left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20 w-72">
                <div className="flex items-center justify-between mb-2">
                  <button type="button" onClick={() => shiftMonth(-1)} className="px-2 py-1 text-gray-500 hover:text-gray-900">‹</button>
                  <span className="text-sm font-semibold text-gray-900">
                    {viewMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </span>
                  <button type="button" onClick={() => shiftMonth(1)} className="px-2 py-1 text-gray-500 hover:text-gray-900">›</button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-1">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarCells.map((cell, i) =>
                    cell ? (
                      <button
                        key={cell.key}
                        type="button"
                        onClick={() => toggleDate(cell.key)}
                        className={`text-xs rounded-md py-1.5 ${
                          selectedDates.includes(cell.key)
                            ? "bg-green-800 text-white font-semibold"
                            : "hover:bg-gray-100 text-gray-700"
                        }`}
                      >
                        {cell.day}
                      </button>
                    ) : (
                      <div key={i} />
                    )
                  )}
                </div>
                {selectedDates.length > 0 && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-500">{selectedDates.length} selected</span>
                    <button type="button" onClick={() => setSelectedDates([])} className="text-xs text-gray-400 hover:text-red-600">
                      Clear
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <input className="ismaili-input text-sm w-full sm:w-52" placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
          <button className="ismaili-button text-sm py-2.5 px-5 disabled:opacity-50" disabled={creating}>
            {creating ? "Creating…" : "+ Create"}
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="ismaili-card overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Varos</th>
              <th>Shoe Count</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-6 text-center text-gray-400" colSpan={5}>Loading…</td></tr>
            ) : items.length ? (
              items.map(g => {
                const totalPairs = (g.shoeCount || []).reduce((s, r) => s + (Number(r.qty) || 0), 0);
                return (
                  <tr key={g._id}>
                    <td className="font-medium text-gray-900">{new Date(g.date).toLocaleDateString("en-US", { timeZone: "UTC" })}</td>
                    <td>{typeBadges(g.tags)}</td>
                    <td className="text-gray-500">{g.varos?.length ?? 0}</td>
                    <td className="text-gray-500">{totalPairs > 0 ? totalPairs : <span className="text-gray-300">—</span>}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <Link className="text-sm font-semibold ismaili-text-primary hover:underline" href={`/admin/gatherings/${g._id}`}>
                          Manage →
                        </Link>
                        <button
                          className="text-sm text-red-500 hover:text-red-700 font-medium"
                          onClick={() => {
                            const label = new Date(g.date).toLocaleDateString("en-US", { timeZone: "UTC" });
                            setDeleteTarget({ id: g._id, label });
                            setDeleteInput("");
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td className="p-6 text-center text-gray-400" colSpan={5}>No gatherings yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Delete Gathering</h2>
            <p className="text-sm text-gray-600">
              This will permanently delete the gathering on{" "}
              <span className="font-semibold text-gray-900">{deleteTarget.label}</span> and all its data.
            </p>
            <p className="text-sm text-gray-600">
              Type <span className="font-mono font-semibold text-gray-900">{deleteTarget.label}</span> to confirm.
            </p>
            <input
              className="ismaili-input text-sm w-full font-mono"
              placeholder={deleteTarget.label}
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                onClick={() => { setDeleteTarget(null); setDeleteInput(""); }}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="text-sm px-4 py-2 rounded-lg bg-red-600 text-white font-semibold disabled:opacity-40 hover:bg-red-700 transition-colors"
                disabled={deleteInput !== deleteTarget.label || deleting}
                onClick={onDelete}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
