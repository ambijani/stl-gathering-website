"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Varo = { _id: string; title: string; capacity?: number; assignedPeople?: string[] };
type Gathering = { _id: string; title?: string; date: string; notes?: string; varos: Varo[]; shoeCount: { size: string; qty: number }[] };

export default function GatheringsPage() {
  const [items, setItems] = useState<Gathering[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState<string>("");
  const [date, setDate] = useState<string>(""); // yyyy-mm-dd
  const [notes, setNotes] = useState<string>("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/gatherings", { cache: "no-store" });
    const data = (await res.json()) as Gathering[];
    setItems(data);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!date) { alert("Pick a date"); return; }
    // Create date in local timezone to avoid timezone conversion issues
    const localDate = new Date(date + 'T12:00:00'); // Use noon to avoid timezone edge cases
    const res = await fetch("/api/admin/gatherings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title || "Gathering", date: localDate.toISOString(), notes: notes || "" })
    });
    if (!res.ok) { alert(`Failed to create: ${await res.text()}`); return; }
    setTitle(""); setDate(""); setNotes(""); await load();
  }

  return (
    <div className="min-h-screen ismaili-bg-pattern">
      <div className="ismaili-header">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Gatherings & Events</h1>
          <p className="text-lg opacity-90">Manage community gatherings and activities</p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="ismaili-card p-6">
            <h2 className="text-xl font-semibold ismaili-text-primary mb-4">Create New Gathering</h2>
            <form onSubmit={onCreate} className="grid gap-4 md:grid-cols-4">
              <input 
                className="ismaili-input" 
                placeholder="Title (optional)" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
              />
              <input 
                className="ismaili-input" 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                required 
              />
              <input 
                className="ismaili-input md:col-span-2" 
                placeholder="Notes (optional)" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
              />
              <div className="md:col-span-4">
                <button className="ismaili-button">Create Gathering</button>
              </div>
            </form>
          </div>

          <div className="ismaili-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="ismaili-bg-subtle">
                  <tr>
                    <th className="text-left p-4 font-semibold ismaili-text-primary">Date</th>
                    <th className="text-left p-4 font-semibold ismaili-text-primary">Title</th>
                    <th className="text-left p-4 font-semibold ismaili-text-primary">Varos</th>
                    <th className="text-left p-4 font-semibold ismaili-text-primary">Pairs (TOTAL)</th>
                    <th className="text-left p-4 font-semibold ismaili-text-primary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td className="p-4 text-center" colSpan={5}>Loading…</td></tr>
                  ) : items.length ? (
                    items.map((g) => {
                      const totalPairs = (g.shoeCount || []).reduce((sum, r) => sum + (Number(r.qty) || 0), 0) || 0;
                      return (
                        <tr key={g._id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="p-4 font-medium">{new Date(g.date).toLocaleDateString('en-US', { timeZone: 'UTC' })}</td>
                          <td className="p-4">{g.title || "-"}</td>
                          <td className="p-4">{g.varos?.length ?? 0}</td>
                          <td className="p-4">{totalPairs}</td>
                          <td className="p-4">
                            <Link className="ismaili-text-primary hover:ismaili-text-secondary font-medium" href={`/admin/gatherings/${g._id}`}>
                              Manage →
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td className="p-4 text-center text-gray-500" colSpan={5}>No gatherings yet. Create one above.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}