"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Varo = { _id: string; title: string; capacity?: number; assignedPeople?: string[] };
type Gathering = { _id: string; title?: string; date: string; notes?: string; varos: Varo[]; shoeCount: { size: string; qty: number }[] };

const GATHERING_TYPES = [
  { value: "Friday Vaaros",    label: "Friday Vaaros",    bg: "bg-green-100",  text: "text-green-700"  },
  { value: "Chandraat Vaaros", label: "Chandraat Vaaros", bg: "bg-purple-100", text: "text-purple-700" },
  { value: "Kushali",          label: "Kushali",           bg: "bg-yellow-100", text: "text-yellow-700" },
  { value: "Eid",              label: "Eid",               bg: "bg-blue-100",   text: "text-blue-700"   },
  { value: "Taliqah",          label: "Taliqah",           bg: "bg-orange-100", text: "text-orange-700" },
  { value: "Other",            label: "Other",             bg: "bg-gray-100",   text: "text-gray-600"   },
];

function typeBadge(title?: string) {
  const match = GATHERING_TYPES.find(t => title?.includes(t.value));
  const { label, bg, text } = match ?? GATHERING_TYPES[GATHERING_TYPES.length - 1];
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${bg} ${text}`}>{label}</span>;
}

export default function GatheringsPage() {
  const [items, setItems] = useState<Gathering[]>([]);
  const [loading, setLoading] = useState(true);

  const [type, setType] = useState<string>("Friday Vaaros");
  const [date, setDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/gatherings", { cache: "no-store" });
    const data = (await res.json()) as Gathering[];
    setItems([...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!date) { alert("Pick a date"); return; }
    const localDate = new Date(date + "T12:00:00");
    const res = await fetch("/api/admin/gatherings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: type, date: localDate.toISOString(), notes }),
    });
    if (!res.ok) { alert(`Failed to create: ${await res.text()}`); return; }
    setDate(""); setNotes(""); await load();
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
          <select className="ismaili-input text-sm" value={type} onChange={e => setType(e.target.value)}>
            {GATHERING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
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
                    <td>{typeBadge(g.title)}</td>
                    <td className="text-gray-500">{g.varos?.length ?? 0}</td>
                    <td className="text-gray-500">{totalPairs > 0 ? totalPairs : <span className="text-gray-300">—</span>}</td>
                    <td>
                      <Link className="text-sm font-semibold ismaili-text-primary hover:underline" href={`/admin/gatherings/${g._id}`}>
                        Manage →
                      </Link>
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
    </div>
  );
}
