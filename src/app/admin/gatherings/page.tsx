"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Varo = {
  _id: string;
  title: string;
  capacity?: number;
  assignedPeople?: string[];
};

type Gathering = {
  _id: string;
  title?: string;
  date: string; // ISO
  notes?: string;
  varos: Varo[];
  shoeCount: { size: string; qty: number }[];
};

export default function GatheringsPage() {
  const [items, setItems] = useState<Gathering[]>([]);
  const [loading, setLoading] = useState(true);

  // create form state
  const [title, setTitle] = useState<string>("");
  const [date, setDate] = useState<string>(""); // yyyy-mm-dd
  const [notes, setNotes] = useState<string>("");

  async function load() {
    setLoading(true);
    const res = await fetch("/admin/gatherings", { cache: "no-store" });
    // If your API lives under /api/admin/gatherings instead, swap the path above.
    const data = (await res.json()) as Gathering[];
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!date) {
      alert("Pick a date");
      return;
    }
    const iso = new Date(date).toISOString();
    const res = await fetch("/admin/gatherings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title || "Gathering",
        date: iso,
        notes: notes || "",
      }),
    });
    if (!res.ok) {
      const msg = await res.text();
      alert(`Failed to create: ${msg}`);
      return;
    }
    setTitle("");
    setDate("");
    setNotes("");
    await load();
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dates & Varos</h1>

      {/* Create new date */}
      <form onSubmit={onCreate} className="border rounded p-4 grid gap-3 md:grid-cols-4">
        <input
          className="border p-2 rounded"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="border p-2 rounded"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <input
          className="border p-2 rounded md:col-span-2"
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="md:col-span-4">
          <button className="px-4 py-2 rounded bg-black text-white">Create Date</button>
        </div>
      </form>

      {/* List existing dates */}
      <div className="border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Date</th>
              <th className="text-left p-2">Title</th>
              <th className="text-left p-2">Varos</th>
              <th className="text-left p-2">Pairs (TOTAL)</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3" colSpan={5}>Loading…</td>
              </tr>
            ) : items.length ? (
              items.map((g) => {
                const totalPairs =
                  (g.shoeCount || []).reduce((sum, r) => sum + (Number(r.qty) || 0), 0) || 0;
                return (
                  <tr key={g._id} className="border-t">
                    <td className="p-2">{new Date(g.date).toLocaleDateString()}</td>
                    <td className="p-2">{g.title || "-"}</td>
                    <td className="p-2">{g.varos?.length ?? 0}</td>
                    <td className="p-2">{totalPairs}</td>
                    <td className="p-2">
                      <Link className="underline" href={`/admin/gatherings/${g._id}`}>
                        Manage
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="p-3 text-gray-500" colSpan={5}>
                  No dates yet. Create one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}