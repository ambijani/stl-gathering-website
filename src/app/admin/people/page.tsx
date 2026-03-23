"use client";
import { useEffect, useMemo, useState } from "react";

type Person = { _id: string; name: string; phone?: string; interests?: string[] };

export default function PeoplePage() {
  const [people, setPeople]   = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm]   = useState({ name: "", phone: "", interests: "" });

  const [mergeFrom,   setMergeFrom]   = useState<Person | null>(null);
  const [mergeSearch, setMergeSearch] = useState("");
  const [mergeTarget, setMergeTarget] = useState<Person | null>(null);
  const [merging,     setMerging]     = useState(false);

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

  const mergeCandidates = useMemo(() => {
    const q = mergeSearch.trim().toLowerCase();
    return people.filter(p => p._id !== mergeFrom?._id && (!q || p.name.toLowerCase().includes(q)));
  }, [people, mergeFrom, mergeSearch]);

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

  async function deletePerson(id: string, name: string) {
    if (!confirm(`Remove ${name}? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/people/${id}`, { method: "DELETE" });
    if (res.ok) await load(); else alert("Failed to delete.");
  }

  function openMerge(p: Person) { setMergeFrom(p); setMergeSearch(""); setMergeTarget(null); }
  function closeMerge() { setMergeFrom(null); setMergeTarget(null); setMergeSearch(""); }

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
      alert(`Done. "${data.from}" → "${data.to}" across ${data.varosUpdated} Varo(s).`);
    } else alert("Merge failed.");
    setMerging(false);
  }

  return (
    <div className="admin-page space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-heading">People</h1>
          {!loading && <p className="text-sm text-gray-500 mt-0.5">{people.length} members</p>}
        </div>
        <input
          className="ismaili-input w-64 text-sm"
          placeholder="Search by name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Merge panel */}
      {mergeFrom && (
        <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-sm text-amber-900">Merge person</p>
              <p className="text-sm text-amber-800 mt-0.5">
                All Varos for <strong>{mergeFrom.name}</strong> will transfer to your chosen person, then <strong>{mergeFrom.name}</strong> will be deleted.
              </p>
            </div>
            <button onClick={closeMerge} className="text-amber-400 hover:text-amber-600 text-lg leading-none">✕</button>
          </div>
          <input
            autoFocus
            className="ismaili-input w-full max-w-sm text-sm"
            placeholder="Search for replacement…"
            value={mergeSearch}
            onChange={e => { setMergeSearch(e.target.value); setMergeTarget(null); }}
          />
          {mergeSearch && !mergeTarget && (
            <ul className="border rounded-lg bg-white divide-y max-h-48 overflow-auto text-sm w-full max-w-sm shadow-sm">
              {mergeCandidates.length === 0
                ? <li className="p-3 text-gray-400">No matches</li>
                : mergeCandidates.map(p => (
                  <li key={p._id} className="px-3 py-2 cursor-pointer hover:bg-gray-50 flex justify-between items-center"
                    onClick={() => { setMergeTarget(p); setMergeSearch(p.name); }}>
                    <span>{p.name}</span>
                    {p.phone && <span className="text-xs text-gray-400">{p.phone}</span>}
                  </li>
                ))}
            </ul>
          )}
          {mergeTarget && (
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-sm">
                <span className="line-through text-gray-400">{mergeFrom.name}</span>
                {" → "}
                <span className="font-semibold text-green-800">{mergeTarget.name}</span>
              </p>
              <button onClick={confirmMerge} disabled={merging}
                className="px-4 py-1.5 rounded-lg bg-amber-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-amber-700 transition-colors">
                {merging ? "Merging…" : "Confirm Merge"}
              </button>
              <button onClick={() => { setMergeTarget(null); setMergeSearch(""); }} className="text-sm text-gray-500 underline">
                Pick different
              </button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="ismaili-card overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Interests</th>
              <th className="w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-6 text-center text-gray-400" colSpan={4}>Loading…</td></tr>
            ) : filtered.length ? (
              filtered.map(p => editingId === p._id ? (
                <tr key={p._id} style={{ background: "#eef5eb" }}>
                  <td><input className="ismaili-input w-full text-sm py-1.5 px-2" value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></td>
                  <td><input className="ismaili-input w-full text-sm py-1.5 px-2" value={editForm.phone} placeholder="Phone"
                    onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} /></td>
                  <td><input className="ismaili-input w-full text-sm py-1.5 px-2" value={editForm.interests} placeholder="Comma-separated"
                    onChange={e => setEditForm(f => ({ ...f, interests: e.target.value }))} /></td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(p._id)}
                        className="px-3 py-1 rounded-md bg-green-800 text-white text-xs font-semibold hover:bg-green-900 transition-colors">Save</button>
                      <button onClick={() => setEditingId(null)}
                        className="px-3 py-1 rounded-md border text-xs hover:bg-gray-50 transition-colors">Cancel</button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={p._id} className={mergeFrom?._id === p._id ? "bg-amber-50" : ""}>
                  <td className="font-medium text-gray-900">{p.name}</td>
                  <td className="text-gray-500">{p.phone || "—"}</td>
                  <td className="text-gray-400 text-xs">{(p.interests ?? []).join(", ") || "—"}</td>
                  <td>
                    <div className="flex gap-3">
                      <button onClick={() => startEdit(p)} className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">Edit</button>
                      <button onClick={() => openMerge(p)} className="text-xs font-medium text-amber-600 hover:text-amber-800 transition-colors">Merge</button>
                      <button onClick={() => deletePerson(p._id, p.name)} className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors">Remove</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td className="p-6 text-center text-gray-400" colSpan={4}>
                {search ? `No results for "${search}"` : "No people found."}
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
