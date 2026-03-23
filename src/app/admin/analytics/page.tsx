"use client";
import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, ResponsiveContainer, Cell,
} from "recharts";

type PairsByDate      = { date: string; pairs: number };
type VaroFrequency    = { name: string; count: number };
type ShoeCountByMonth = { month: string; avg: number };
type OverviewRes = {
  pairsByDate:      PairsByDate[];
  varoFrequency:    VaroFrequency[];
  shoeCountByMonth: ShoeCountByMonth[];
};

const COLORS = ["#4f46e5","#7c3aed","#db2777","#ea580c","#16a34a","#0891b2","#ca8a04"];

function fmtDate(v: unknown) {
  return new Date(String(v)).toLocaleDateString("en-US", { timeZone: "UTC" });
}

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [pbd,  setPbd]  = useState<PairsByDate[]>([]);
  const [freq, setFreq] = useState<VaroFrequency[]>([]);
  const [scm,  setScm]  = useState<ShoeCountByMonth[]>([]);

  useEffect(() => {
    (async () => {
      const res  = await fetch("/api/admin/metrics/overview");
      const data: OverviewRes = await res.json();
      setPbd((data.pairsByDate ?? []).map(d => ({ date: String(d.date), pairs: Number(d.pairs ?? 0) })));
      setFreq(data.varoFrequency ?? []);
      setScm(data.shoeCountByMonth ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="admin-page text-gray-400">Loading…</div>;

  return (
    <div className="admin-page space-y-10">
      <h1 className="page-heading">Analytics</h1>

      {/* Avg Shoe Count by Month */}
      <section>
        <h2 className="text-xl font-semibold mb-1">Average Shoe Count by Month</h2>
        <p className="text-sm text-gray-500 mb-3">Average shoes per gathering, grouped by month</p>
        {scm.length === 0 ? <p className="text-gray-400 text-sm">No shoe count data yet.</p> : (
          <div className="w-full h-80 border rounded p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scm}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(v: number) => [v, "Avg shoes"]} />
                <Bar dataKey="avg" name="Avg shoes" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Shoe Count per Date */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Shoe Count per Date</h2>
        {pbd.length === 0 ? <p className="text-gray-400 text-sm">No shoe count data yet.</p> : (
          <div className="w-full h-80 border rounded p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pbd}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={fmtDate} />
                <YAxis />
                <Tooltip labelFormatter={fmtDate} />
                <Line type="monotone" dataKey="pairs" stroke="#4f46e5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Varo Frequency */}
      <section>
        <h2 className="text-xl font-semibold mb-1">Varo Frequency by Person</h2>
        <p className="text-sm text-gray-500 mb-3">Total Varos performed across all gatherings (top {freq.length})</p>
        {freq.length === 0 ? (
          <p className="text-gray-400 text-sm">No data yet.</p>
        ) : (
          <div className="w-full border rounded p-2" style={{ height: Math.max(300, freq.length * 22) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={freq} layout="vertical" margin={{ left: 16, right: 32, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="Varos performed" radius={[0, 4, 4, 0]}>
                  {freq.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

    </div>
  );
}
