"use client";
import { useEffect, useMemo, useState } from "react";

type Person = { _id: string; name: string; email?: string; phone?: string; interests?: string[] };

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", interests: "" });

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

  function startEdit(p: Person) {
    setEditingId(p._id);
    setEditForm({
      name: p.name,
      phone: p.phone ?? "",
      interests: (p.interests ?? []).join(", "),
    });
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
    if (!confirm(`Remove ${name} from the list? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/people/${id}`, { method: "DELETE" });
    if (res.ok) await load();
    else alert("Failed to delete.");
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

      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Phone</th>
              <th className="text-left p-3 font-medium">Interests</th>
              <th className="text-left p-3 font-medium w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4 text-center text-gray-500" colSpan={4}>Loading…</td></tr>
            ) : filtered.length ? (
              filtered.map(p => editingId === p._id ? (
                // ── Edit row ──
                <tr key={p._id} className="border-t bg-blue-50">
                  <td className="p-2">
                    <input
                      className="border rounded p-1 w-full text-sm"
                      value={editForm.name}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className="border rounded p-1 w-full text-sm"
                      value={editForm.phone}
                      placeholder="Phone"
                      onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className="border rounded p-1 w-full text-sm"
                      value={editForm.interests}
                      placeholder="Comma-separated"
                      onChange={e => setEditForm(f => ({ ...f, interests: e.target.value }))}
                    />
                  </td>
                  <td className="p-2 flex gap-1">
                    <button onClick={() => saveEdit(p._id)} className="px-2 py-1 rounded bg-black text-white text-xs">Save</button>
                    <button onClick={() => setEditingId(null)} className="px-2 py-1 rounded border text-xs">Cancel</button>
                  </td>
                </tr>
              ) : (
                // ── Normal row ──
                <tr key={p._id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-gray-600">{p.phone || "—"}</td>
                  <td className="p-3 text-gray-500 text-xs">{(p.interests ?? []).join(", ") || "—"}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => startEdit(p)} className="text-blue-600 hover:underline text-xs">Edit</button>
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
