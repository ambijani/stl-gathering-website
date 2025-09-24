"use client";
import { useEffect, useState } from "react";

type Gathering = { _id: string; title?: string; date: string; notes?: string; };

export default function GatheringsPage() {
  const [rows, setRows] = useState<Gathering[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate]   = useState("");
  const [notes, setNotes] = useState("");

  async function load() {
    const res = await fetch("/api/admin/gatherings");
    setRows(await res.json());
  }
  useEffect(()=>{ load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/gatherings", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ title, date, notes })
    });
    if (res.ok) {
      setTitle(""); setDate(""); setNotes("");
      load();
    } else {
      alert("Failed to create date");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold mb-3">Create Date</h1>
        <form onSubmit={create} className="grid gap-2 max-w-xl">
          <input className="border p-2 rounded" placeholder="Title (optional)"
                 value={title} onChange={e=>setTitle(e.target.value)} />
          <input className="border p-2 rounded" type="date"
                 value={date} onChange={e=>setDate(e.target.value)} required/>
          <input className="border p-2 rounded" placeholder="Notes (optional)"
                 value={notes} onChange={e=>setNotes(e.target.value)} />
          <button className="px-4 py-2 rounded bg-black text-white w-fit">Create</button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">All Dates</h2>
        <div className="border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Title</th>
                <th className="text-left p-2">Notes</th>
                <th className="text-left p-2">Open</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(g=>(
                <tr key={g._id} className="border-t">
                  <td className="p-2">{new Date(g.date).toLocaleDateString()}</td>
                  <td className="p-2">{g.title||"-"}</td>
                  <td className="p-2">{g.notes||"-"}</td>
                  <td className="p-2"><a className="underline" href={`/admin/gatherings/${g._id}`}>Manage</a></td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td className="p-4 text-gray-500" colSpan={4}>No dates yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
