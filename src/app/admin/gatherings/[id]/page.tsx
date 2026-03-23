"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";

type Person = { _id: string; name: string; email?: string; interests?: string[] };
type Varo = { _id: string; title: string; capacity?: number; assignedPeople?: string[] };
type Gathering = { _id: string; title?: string; date: string; notes?: string; varos: Varo[]; shoeCount: { size: string; qty: number }[] };

export default function GatheringDetail() {
  const { id } = useParams<{ id: string }>();
  const [g, setG] = useState<Gathering | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [tab, setTab] = useState<"varos" | "shoes">("varos");

  const loadGathering = useCallback(async () => {
    const res = await fetch(`/api/admin/gatherings/${id}`);
    if (res.ok) setG(await res.json());
  }, [id]);

  useEffect(() => {
    void loadGathering();
    fetch("/api/admin/people").then(r => r.json()).then(setPeople);
  }, [loadGathering]);

  // ── Varo creation ──────────────────────────────────────────────────────────
  const [vTitle, setVTitle] = useState("");
  const [vCapacity, setVCapacity] = useState<number | undefined>(undefined);

  async function addVaro(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/admin/gatherings/${id}/varos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: vTitle, capacity: vCapacity }),
    });
    if (res.ok) { setVTitle(""); setVCapacity(undefined); await loadGathering(); }
    else alert("Failed to add varo");
  }

  async function deleteVaro(varoId: string) {
    if (!confirm("Delete this Varo?")) return;
    const res = await fetch(`/api/admin/gatherings/${id}/varos/${varoId}`, { method: "DELETE" });
    if (res.ok) await loadGathering(); else alert("Failed to delete");
  }

  // ── Varo assignment ────────────────────────────────────────────────────────
  const [assignOpenFor, setAssignOpenFor] = useState<string | null>(null);
  const [peopleSearch, setPeopleSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const currentVaro = useMemo(
    () => g?.varos.find(v => v._id === assignOpenFor) ?? null,
    [assignOpenFor, g]
  );

  const filteredPeople = useMemo(() => {
    const q = peopleSearch.trim().toLowerCase();
    return q ? people.filter(p => p.name.toLowerCase().includes(q)) : people;
  }, [people, peopleSearch]);

  function openAssign(varoId: string) {
    const varo = g?.varos.find(v => v._id === varoId);
    if (!varo) return;
    // Pre-check anyone already assigned
    const initial: Record<string, boolean> = {};
    for (const pid of varo.assignedPeople ?? []) initial[pid] = true;
    setSelected(initial);
    setPeopleSearch("");
    setAssignOpenFor(varoId);
  }

  async function saveAssignment() {
    if (!assignOpenFor) return;
    const personIds = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
    const res = await fetch(`/api/admin/gatherings/${id}/varos/${assignOpenFor}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personIds, mode: "replace" }),
    });
    if (res.ok) { setAssignOpenFor(null); await loadGathering(); }
    else alert("Failed to save assignment");
  }

  function personName(pid: string) {
    return people.find(p => p._id === pid)?.name ?? pid;
  }

  // ── Shoe count ─────────────────────────────────────────────────────────────
  const [shoeRows, setShoeRows] = useState<{ size: string; qty: number }[]>([]);
  useEffect(() => { if (g) setShoeRows(g.shoeCount ?? []); }, [g]);

  const shoeTotal = shoeRows.reduce((s, r) => s + (Number(r.qty) || 0), 0);

  function updateRow(i: number, key: "size" | "qty", val: string) {
    setShoeRows(rows => rows.map((r, idx) => idx === i ? { ...r, [key]: key === "qty" ? Number(val || 0) : val } : r));
  }

  async function saveShoeRows() {
    const cleaned = shoeRows.filter(r => r.size && !Number.isNaN(r.qty));
    const res = await fetch(`/api/admin/gatherings/${id}/shoecount`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cleaned }),
    });
    if (!res.ok) alert("Failed to save shoe counts");
    else await loadGathering();
  }

  if (!g) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">
          {g.title || "Gathering"} — {new Date(g.date).toLocaleDateString("en-US", { timeZone: "UTC" })}
        </h1>
        {g.notes && <p className="text-sm text-gray-600 mt-1">{g.notes}</p>}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab("varos")} className={`px-3 py-1 rounded ${tab === "varos" ? "bg-black text-white" : "border"}`}>Varos</button>
        <button onClick={() => setTab("shoes")} className={`px-3 py-1 rounded ${tab === "shoes" ? "bg-black text-white" : "border"}`}>Shoe Count</button>
      </div>

      {/* ── Varos tab ── */}
      {tab === "varos" && (
        <div className="space-y-6">
          {/* Add varo form */}
          <form onSubmit={addVaro} className="flex flex-wrap items-end gap-2">
            <input className="border p-2 rounded" placeholder="Varo title" value={vTitle} onChange={e => setVTitle(e.target.value)} required />
            <input className="border p-2 rounded w-32" type="number" min={0} placeholder="Capacity" value={vCapacity ?? ""} onChange={e => setVCapacity(e.target.value ? Number(e.target.value) : undefined)} />
            <button className="px-4 py-2 rounded bg-black text-white">Add Varo</button>
          </form>

          {/* Varos table */}
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2 w-40">Title</th>
                  <th className="text-left p-2 w-20">Cap</th>
                  <th className="text-left p-2">Assigned</th>
                  <th className="text-left p-2 w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {g.varos?.map(v => {
                  const assigned = v.assignedPeople ?? [];
                  const names = assigned.map(pid => personName(pid));
                  const preview = names.length <= 3
                    ? names.join(", ")
                    : names.slice(0, 3).join(", ") + ` +${names.length - 3} more`;
                  return (
                    <tr key={v._id} className="border-t">
                      <td className="p-2 font-medium">{v.title}</td>
                      <td className="p-2 text-gray-500">{typeof v.capacity === "number" ? v.capacity : "—"}</td>
                      <td className="p-2">
                        {names.length === 0
                          ? <span className="text-gray-400 italic">None</span>
                          : <span title={names.join(", ")}>{preview}</span>
                        }
                      </td>
                      <td className="p-2 flex gap-2">
                        <button className="underline text-blue-600" onClick={() => openAssign(v._id)}>Assign</button>
                        <button className="underline text-red-600" onClick={() => deleteVaro(v._id)}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
                {(!g.varos || !g.varos.length) && (
                  <tr><td className="p-4 text-gray-500" colSpan={4}>No Varos yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Assignment panel */}
          {currentVaro && (
            <div className="p-4 border rounded bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Assign people to: <span className="text-blue-700">{currentVaro.title}</span></h3>
                <button className="text-sm underline" onClick={() => setAssignOpenFor(null)}>Close</button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Left: searchable people list */}
                <div>
                  <input
                    className="border p-2 rounded w-full mb-2 text-sm"
                    placeholder="Search people…"
                    value={peopleSearch}
                    onChange={e => setPeopleSearch(e.target.value)}
                  />
                  <div className="max-h-72 overflow-auto border rounded bg-white">
                    <table className="w-full text-sm">
                      <tbody>
                        {filteredPeople.map(p => (
                          <tr key={p._id} className="border-b hover:bg-gray-50">
                            <td className="p-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!selected[p._id]}
                                  onChange={() => setSelected(s => ({ ...s, [p._id]: !s[p._id] }))}
                                />
                                <span>{p.name}</span>
                              </label>
                            </td>
                            <td className="p-2 text-xs text-gray-400">{(p.interests ?? []).join(", ")}</td>
                          </tr>
                        ))}
                        {!filteredPeople.length && (
                          <tr><td className="p-3 text-gray-500">No matches</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {Object.values(selected).filter(Boolean).length} selected
                    </span>
                    <button className="px-3 py-2 rounded bg-black text-white text-sm" onClick={saveAssignment}>
                      Save Assignment
                    </button>
                  </div>
                </div>

                {/* Right: currently assigned with remove buttons */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Currently assigned ({(currentVaro.assignedPeople ?? []).length})</h4>
                  {(currentVaro.assignedPeople ?? []).length === 0
                    ? <p className="text-sm text-gray-400 italic">No one assigned yet.</p>
                    : (
                      <ul className="space-y-1">
                        {(currentVaro.assignedPeople ?? []).map(pid => (
                          <li key={pid} className="flex items-center justify-between text-sm bg-white border rounded px-2 py-1">
                            <span>{personName(pid)}</span>
                            <button
                              className="text-red-500 hover:text-red-700 text-xs underline"
                              onClick={() => setSelected(s => ({ ...s, [pid]: false }))}
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    )
                  }
                  <p className="text-xs text-gray-400 mt-2">Uncheck or click Remove, then Save Assignment.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Shoe Count tab ── */}
      {tab === "shoes" && (
        <div className="space-y-3">
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2">Label</th>
                  <th className="text-left p-2">Count</th>
                  <th className="text-left p-2">Remove</th>
                </tr>
              </thead>
              <tbody>
                {shoeRows.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2"><input className="border p-1 rounded w-32" value={r.size} onChange={e => updateRow(i, "size", e.target.value)} placeholder="e.g. TOTAL" /></td>
                    <td className="p-2"><input className="border p-1 rounded w-24" type="number" min={0} value={r.qty} onChange={e => updateRow(i, "qty", e.target.value)} /></td>
                    <td className="p-2"><button className="underline text-red-600 text-xs" onClick={() => setShoeRows(rows => rows.filter((_, idx) => idx !== i))}>Remove</button></td>
                  </tr>
                ))}
                {!shoeRows.length && (
                  <tr><td className="p-3 text-gray-500" colSpan={3}>No rows. Add one below.</td></tr>
                )}
              </tbody>
              {shoeRows.length > 0 && (
                <tfoot className="bg-gray-50 border-t">
                  <tr>
                    <td className="p-2 font-medium">Total</td>
                    <td className="p-2 font-semibold">{shoeTotal}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded border text-sm" onClick={() => setShoeRows(rows => [...rows, { size: "", qty: 0 }])}>Add Row</button>
            <button className="px-3 py-2 rounded bg-black text-white text-sm" onClick={saveShoeRows}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
}
