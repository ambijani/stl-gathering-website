"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Varo = { _id: string; title: string; capacity?: number; assignedPeople?: string[] };
type Gathering = { _id: string; tags?: string[]; date: string; notes?: string; varos: Varo[]; shoeCount: { size: string; qty: number }[] };

const GATHERING_TYPES = [
  { value: "Friday Vaaros",    label: "Friday Vaaros",    bg: "bg-green-100",  text: "text-green-700"  },
  { value: "Chandraat Vaaros", label: "Chandraat Vaaros", bg: "bg-purple-100", text: "text-purple-700" },
  { value: "Kushali",          label: "Kushali",           bg: "bg-yellow-100", text: "text-yellow-700" },
  { value: "Eid",              label: "Eid",               bg: "bg-blue-100",   text: "text-blue-700"   },
  { value: "Taliqah",          label: "Taliqah",           bg: "bg-orange-100", text: "text-orange-700" },
  { value: "Other",            label: "Other",             bg: "bg-gray-100",   text: "text-gray-600"   },
];

function typeBadges(tags?: string[]) {
  if (!tags?.length) {
    const { label, bg, text } = GATHERING_TYPES[GATHERING_TYPES.length - 1];
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${bg} ${text}`}>{label}</span>;
  }
  return (
    <span className="flex flex-wrap gap-1">
      {tags.map(tag => {
        const match = GATHERING_TYPES.find(t => t.value === tag) ?? GATHERING_TYPES[GATHERING_TYPES.length - 1];
        return <span key={tag} className={`text-xs px-2 py-0.5 rounded-full font-medium ${match.bg} ${match.text}`}>{match.label}</span>;
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
  const [date, setDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/gatherings", { cache: "no-store" });
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
    if (!date) { alert("Pick a date"); return; }
    const localDate = new Date(date + "T12:00:00");
    const res = await fetch("/api/admin/gatherings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags, date: localDate.toISOString(), notes }),
    });
    if (!res.ok) { alert(`Failed to create: ${await res.text()}`); return; }
    setDate(""); setNotes(""); setTags(["Friday Vaaros"]); await load();
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
              className="ismaili-input text-sm flex items-center gap-2 min-w-44"
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
                    {t.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          <input className="ismaili-input text-sm" type="date" value={date} onChange={e => setDate(e.target.value)} required />
          <input className="ismaili-input text-sm w-52" placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
          <button className="ismaili-button text-sm py-2.5 px-5">+ Create</button>
        </form>
      </div>

      {/* Table */}
      <div className="ismaili-card overflow-hidden">
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
