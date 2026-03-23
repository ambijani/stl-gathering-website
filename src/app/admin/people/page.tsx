"use client";
import { useEffect, useMemo, useState } from "react";

type Person = { _id: string; name: string; phone?: string; interests?: string[] };

export default function PeoplePage() {
  const [people, setPeople]     = useState<Person[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm]   = useState({ name: "", phone: "", interests: "" });

  // Merge state
  const [mergeFrom, setMergeFrom]   = useState<Person | null>(null);
  const [mergeSearch, setMergeSearch] = useState("");
  const [mergeTarget, setMergeTarget] = useState<Person | null>(null);
  const [merging, setMerging]       = useState(false);

  async function load() {
    const res = await fetch("/api/admin/people", { cache: "no-store" });
    setPeople(await res.json());
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? people.filter(p => p.name.toLowerCase().includes(q)) : people;
  }, [people, search]);

  // Merge target candidates: everyone except the source person, filtered by mergeSearch
  const mergeCandidates = useMemo(() => {
    const q = mergeSearch.trim().toLowerCase();
    return people.filter(p => p._id !== mergeFrom?._id && (!q || p.name.toLowerCase().includes(q)));
  }, [people, mergeFrom, mergeSearch]);

  // ── Edit ──────────────────────────────────────────────────────────────────
  function startEdit(p: Person) {
    setEditingId(p._id);
    setEditForm({ name: p.name, phone: p.phone ?? "", interests: (p.interests ?? []).join(", ") });
  }

  async function saveEdit(id: string) {
    const interests = editForm.interests.split(",").map(s => s.trim()).filter(Boolean);
    const res = await fetch(`/api/admin/people/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editForm.name, phone: editForm.phone, interests }),
    });
    if (res.ok) { setEditingId(null); await load(); }
    else alert("Failed to save.");
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function deletePerson(id: string, name: string) {
    if (!confirm(`Remove ${name} from the list? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/people/${id}`, { method: "DELETE" });
    if (res.ok) await load();
    else alert("Failed to delete.");
  }

  // ── Merge ─────────────────────────────────────────────────────────────────
  function openMerge(p: Person) {
    setMergeFrom(p);
    setMergeSearch("");
    setMergeTarget(null);
  }

  function closeMerge() {
    setMergeFrom(null);
    setMergeTarget(null);
    setMergeSearch("");
  }

  async function confirmMerge() {
    if (!mergeFrom || !mergeTarget) return;
    setMerging(true);
    const res = await fetch("/api/admin/people/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromId: mergeFrom._id, toId: mergeTarget._id }),
    });
    if (res.ok) {
      const data = await res.json();
      closeMerge();
      await load();
      alert(`Done. "${data.from}" replaced with "${data.to}" across ${data.varosUpdated} Varo assignment(s) in ${data.gatheringsAffected} gathering(s).`);
    } else {
      alert("Merge failed.");
    }
    setMerging(false);
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          People <span className="text-gray-400 text-lg font-normal">({people.length})</span>
        </h1>
      </div>

      <input
        className="border rounded p-2 w-full max-w-sm text-sm"
        placeholder="Search by name…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* ── Merge panel ── */}
      {mergeFrom && (
        <div className="border border-orange-200 bg-orange-50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-sm">Merge person</p>
              <p className="text-sm text-gray-600 mt-0.5">
                All Varo assignments for <span className="font-medium text-orange-700">{mergeFrom.name}</span> will be
                transferred to the person you choose below, then <span className="font-medium text-orange-700">{mergeFrom.name}</span> will be deleted.
              </p>
            </div>
            <button onClick={closeMerge} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
          </div>

          <input
            autoFocus
            className="border rounded p-2 w-full max-w-sm text-sm"
            placeholder="Search for replacement person…"
            value={mergeSearch}
            onChange={e => { setMergeSearch(e.target.value); setMergeTarget(null); }}
          />

          {mergeSearch && !mergeTarget && (
            <ul className="border rounded bg-white divide-y max-h-48 overflow-auto text-sm w-full max-w-sm">
              {mergeCandidates.length === 0 && (
                <li className="p-2 text-gray-400">No matches</li>
              )}
              {mergeCandidates.map(p => (
                <li
                  key={p._id}
                  className="p-2 cursor-pointer hover:bg-gray-50 flex justify-between items-center"
                  onClick={() => { setMergeTarget(p); setMergeSearch(p.name); }}
                >
                  <span>{p.name}</span>
                  {p.phone && <span className="text-xs text-gray-400">{p.phone}</span>}
                </li>
              ))}
            </ul>
          )}

          {mergeTarget && (
            <div className="flex items-center gap-3">
              <p className="text-sm">
                <span className="line-through text-gray-400">{mergeFrom.name}</span>
                {" → "}
                <span className="font-semibold text-green-700">{mergeTarget.name}</span>
              </p>
              <button
                onClick={confirmMerge}
                disabled={merging}
                className="px-3 py-1.5 rounded bg-orange-600 text-white text-sm font-medium disabled:opacity-50 hover:bg-orange-700"
              >
                {merging ? "Merging…" : "Confirm Merge"}
              </button>
              <button onClick={() => { setMergeTarget(null); setMergeSearch(""); }} className="text-sm text-gray-500 underline">
                Pick different
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Table ── */}
      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Phone</th>
              <th className="text-left p-3 font-medium">Interests</th>
              <th className="text-left p-3 font-medium w-36">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4 text-center text-gray-500" colSpan={4}>Loading…</td></tr>
            ) : filtered.length ? (
              filtered.map(p => editingId === p._id ? (
                <tr key={p._id} className="border-t bg-blue-50">
                  <td className="p-2">
                    <input className="border rounded p-1 w-full text-sm" value={editForm.name}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                  </td>
                  <td className="p-2">
                    <input className="border rounded p-1 w-full text-sm" value={editForm.phone} placeholder="Phone"
                      onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                  </td>
                  <td className="p-2">
                    <input className="border rounded p-1 w-full text-sm" value={editForm.interests} placeholder="Comma-separated"
                      onChange={e => setEditForm(f => ({ ...f, interests: e.target.value }))} />
                  </td>
                  <td className="p-2 flex gap-1">
                    <button onClick={() => saveEdit(p._id)} className="px-2 py-1 rounded bg-black text-white text-xs">Save</button>
                    <button onClick={() => setEditingId(null)} className="px-2 py-1 rounded border text-xs">Cancel</button>
                  </td>
                </tr>
              ) : (
                <tr key={p._id} className={`border-t hover:bg-gray-50 ${mergeFrom?._id === p._id ? "bg-orange-50" : ""}`}>
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-gray-600">{p.phone || "—"}</td>
                  <td className="p-3 text-gray-500 text-xs">{(p.interests ?? []).join(", ") || "—"}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => startEdit(p)} className="text-blue-600 hover:underline text-xs">Edit</button>
                    <button onClick={() => openMerge(p)} className="text-orange-500 hover:underline text-xs">Merge</button>
                    <button onClick={() => deletePerson(p._id, p.name)} className="text-red-500 hover:underline text-xs">Remove</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td className="p-4 text-gray-500" colSpan={4}>
                {search ? `No people match "${search}"` : "No people found."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {search && !loading && (
        <p className="text-xs text-gray-400">{filtered.length} of {people.length} people</p>
      )}
    </div>
  );
}
