"use client";
import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Legend, ResponsiveContainer, Cell,
} from "recharts";

type SignupByInterest = { interest: string | null; count: number };
type PairsByDate      = { date: string; pairs: number };
type VaroFill        = { date: string; capacity: number; assigned: number };
type VaroFrequency   = { name: string; count: number };
type OverviewRes = {
  signupsByInterest: SignupByInterest[];
  pairsByDate:       PairsByDate[];
  varoFill:          VaroFill[];
  varoFrequency:     VaroFrequency[];
};

const COLORS = ["#4f46e5","#7c3aed","#db2777","#ea580c","#16a34a","#0891b2","#ca8a04"];

function fmtDate(v: unknown) {
  return new Date(String(v)).toLocaleDateString("en-US", { timeZone: "UTC" });
}

export default function Analytics() {
  const [loading, setLoading]   = useState(true);
  const [sbi,     setSbi]       = useState<SignupByInterest[]>([]);
  const [pbd,     setPbd]       = useState<PairsByDate[]>([]);
  const [vf,      setVf]        = useState<VaroFill[]>([]);
  const [freq,    setFreq]      = useState<VaroFrequency[]>([]);

  useEffect(() => {
    (async () => {
      const res  = await fetch("/api/admin/metrics/overview");
      const data: OverviewRes = await res.json();
      setSbi(data.signupsByInterest ?? []);
      setPbd((data.pairsByDate ?? []).map(d => ({ date: String(d.date), pairs: Number(d.pairs ?? 0) })));
      setVf((data.varoFill ?? []).map(d => ({ date: String(d.date), capacity: Number(d.capacity ?? 0), assigned: Number(d.assigned ?? 0) })));
      setFreq(data.varoFrequency ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-10">

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

      {/* Shoe Count */}
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

      {/* Sign-ups by Interest */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Sign-ups by Interest</h2>
        {sbi.length === 0 ? <p className="text-gray-400 text-sm">No signup data yet.</p> : (
          <div className="w-full h-80 border rounded p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sbi}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="interest" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#7c3aed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Varo Fill vs Capacity */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Varo Fill vs Capacity (by Date)</h2>
        {vf.length === 0 ? <p className="text-gray-400 text-sm">No data yet.</p> : (
          <div className="w-full h-80 border rounded p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vf}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={fmtDate} />
                <YAxis />
                <Tooltip labelFormatter={fmtDate} />
                <Legend />
                <Bar dataKey="assigned" fill="#4f46e5" />
                <Bar dataKey="capacity" fill="#e5e7eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

    </div>
  );
}
