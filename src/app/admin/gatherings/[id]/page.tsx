"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type Person = {_id:string; name:string; email?:string; interests?:string[]};
type Varo = {
  _id: string; title: string; description?: string; location?: string;
  startTime?: string; endTime?: string; capacity?: number;
  tags?: string[]; assignedPeople?: string[];
};
type Gathering = {
  _id: string; title?: string; date: string; notes?: string;
  varos: Varo[]; shoeCount: { size: string; qty: number }[];
};

export default function GatheringDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [g, setG] = useState<Gathering|null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [tab, setTab] = useState<"varos"|"shoes">("varos");

  async function load() {
    const res = await fetch("/api/admin/gatherings");
    const all = await res.json() as Gathering[];
    const me  = all.find(x => x._id === id) || null;
    setG(me);
    const pr = await fetch("/api/admin/people");
    setPeople(await pr.json());
  }
  useEffect(()=>{ load(); }, [id]);

  // --- add varo ---
  const [vTitle, setVTitle] = useState("");
  const [vCapacity, setVCapacity] = useState<number|undefined>(undefined);
  async function addVaro(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/admin/gatherings/${id}/varos`, {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ title: vTitle, capacity: vCapacity })
    });
    if (res.ok) { setVTitle(""); setVCapacity(undefined); await reloadVaros(); }
    else alert("Failed to add varo");
  }
  async function reloadVaros() {
    const r = await fetch(`/api/admin/gatherings/${id}/varos`);
    const varos = await r.json() as Varo[];
    setG(g => g ? ({ ...g, varos }) : g);
  }

  // --- assign panel ---
  const [assignOpenFor, setAssignOpenFor] = useState<string|null>(null);
  const currentVaro = useMemo(
    ()=> g?.varos.find(v => v._id === assignOpenFor) || null,
    [assignOpenFor, g]
  );
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  function toggle(id:string) { setSelected(s => ({...s, [id]: !s[id]})); }
  async function assignSelected() {
    const personIds = Object.entries(selected).filter(([_,v])=>v).map(([k])=>k);
    if (!assignOpenFor) return;
    const res = await fetch(`/api/admin/gatherings/${id}/varos/${assignOpenFor}/assign`, {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ personIds, mode: "merge" })
    });
    if (res.ok) { setSelected({}); await reloadVaros(); }
    else alert("Failed to assign");
  }

  // --- delete varo (optional) ---
  async function deleteVaro(varoId: string) {
    if (!confirm("Delete this Varo?")) return;
    const res = await fetch(`/api/admin/gatherings/${id}/varos/${varoId}`, { method:"DELETE" });
    if (res.ok) await reloadVaros();
    else alert("Failed to delete");
  }

  // --- shoe counts ---
  const [shoeRows, setShoeRows] = useState<{size:string; qty:number}[]>([]);
  useEffect(()=>{ if (g) setShoeRows(g.shoeCount || []); }, [g]);
  function updateRow(i:number, key:"size"|"qty", val:string) {
    setShoeRows(rows => rows.map((r,idx)=> idx===i ? {...r, [key]: key==="qty" ? Number(val||0): val} : r));
  }
  function addShoeRow() { setShoeRows(rows => [...rows, { size:"", qty:0 }]); }
  function removeShoeRow(i:number) { setShoeRows(rows => rows.filter((_,idx)=> idx!==i)); }
  async function saveShoeRows() {
    const cleaned = shoeRows.filter(r=>r.size && !Number.isNaN(r.qty));
    const res = await fetch(`/api/admin/gatherings/${id}/shoecount`, {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ items: cleaned })
    });
    if (!res.ok) alert("Failed to save shoe counts");
    else alert("Shoe counts saved");
  }

  if (!g) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {g.title || "Date"} — {new Date(g.date).toLocaleDateString()}
        </h1>
        {g.notes && <p className="text-sm text-gray-600">{g.notes}</p>}
      </div>

      <div className="flex gap-2">
        <button onClick={()=>setTab("varos")}
                className={`px-3 py-1 rounded ${tab==="varos"?"bg-black text-white":"border"}`}>
          Varos
        </button>
        <button onClick={()=>setTab("shoes")}
                className={`px-3 py-1 rounded ${tab==="shoes"?"bg-black text-white":"border"}`}>
          Shoe Count
        </button>
      </div>

      {tab==="varos" ? (
        <div className="space-y-6">
          <form onSubmit={addVaro} className="flex flex-wrap items-end gap-2">
            <input className="border p-2 rounded" placeholder="Varo title"
                   value={vTitle} onChange={e=>setVTitle(e.target.value)} required/>
            <input className="border p-2 rounded w-32" type="number" min={0}
                   placeholder="Capacity" value={vCapacity ?? ""}
                   onChange={e=>setVCapacity(e.target.value?Number(e.target.value):undefined)} />
            <button className="px-4 py-2 rounded bg-black text-white">Add Varo</button>
          </form>

          <div className="border rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2">Title</th>
                  <th className="text-left p-2">Capacity</th>
                  <th className="text-left p-2">Assigned</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {g.varos?.map(v=>(
                  <tr key={v._id} className="border-t">
                    <td className="p-2">{v.title}</td>
                    <td className="p-2">{typeof v.capacity==="number" ? v.capacity : "-"}</td>
                    <td className="p-2">{v.assignedPeople?.length ?? 0}</td>
                    <td className="p-2 flex gap-2">
                      <button className="underline"
                              onClick={()=>{ setAssignOpenFor(v._id); setSelected({}); }}>
                        Assign
                      </button>
                      <button className="underline text-red-600"
                              onClick={()=>deleteVaro(v._id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {(!g.varos || !g.varos.length) && (
                  <tr><td className="p-4 text-gray-500" colSpan={4}>No Varos yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Assign Drawer (simple inline) */}
          {currentVaro && (
            <div className="p-4 border rounded">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Assign to: {currentVaro.title}</h3>
                <button className="text-sm underline" onClick={()=>setAssignOpenFor(null)}>Close</button>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-3">
                <div>
                  <h4 className="font-medium mb-2">People</h4>
                  <div className="max-h-72 overflow-auto border rounded">
                    <table className="w-full text-sm">
                      <tbody>
                        {people.map(p=>(
                          <tr key={p._id} className="border-b">
                            <td className="p-2">
                              <label className="flex items-center gap-2">
                                <input type="checkbox"
                                  checked={!!selected[p._id]}
                                  onChange={()=>toggle(p._id)} />
                                <span>{p.name}</span>
                              </label>
                            </td>
                            <td className="p-2 text-xs text-gray-500">{(p.interests||[]).join(", ")}</td>
                          </tr>
                        ))}
                        {!people.length && <tr><td className="p-2">No people found.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  <button className="mt-3 px-3 py-2 rounded bg-black text-white" onClick={assignSelected}>
                    Assign Selected
                  </button>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Currently Assigned</h4>
                  <ul className="list-disc ml-5 text-sm">
                    {(currentVaro.assignedPeople||[])
                      .map(id => people.find(p=>p._id===id)?.name || id)
                      .map((name, i)=>(<li key={i}>{name}</li>))}
                    {(!currentVaro.assignedPeople||!currentVaro.assignedPeople.length) && (
                      <li className="text-gray-500">None yet.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="border rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2">Size</th>
                  <th className="text-left p-2">Qty</th>
                  <th className="text-left p-2">Remove</th>
                </tr>
              </thead>
              <tbody>
                {shoeRows.map((r,i)=>(
                  <tr key={i} className="border-t">
                    <td className="p-2">
                      <input className="border p-1 rounded w-28" value={r.size}
                             onChange={e=>updateRow(i,"size",e.target.value)} />
                    </td>
                    <td className="p-2">
                      <input className="border p-1 rounded w-24" type="number" min={0} value={r.qty}
                             onChange={e=>updateRow(i,"qty",e.target.value)} />
                    </td>
                    <td className="p-2">
                      <button className="underline text-red-600" onClick={()=>removeShoeRow(i)}>Remove</button>
                    </td>
                  </tr>
                ))}
                {!shoeRows.length && (
                  <tr><td className="p-3 text-gray-500" colSpan={3}>No rows. Add one below.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded border" onClick={addShoeRow}>Add Row</button>
            <button className="px-3 py-2 rounded bg-black text-white" onClick={saveShoeRows}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
}
