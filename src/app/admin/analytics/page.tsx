"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend, ResponsiveContainer } from "recharts";

type SignupByInterest = { interest: string | null; count: number };
type PairsByDate = { date: string; pairs: number };
type VaroFill = { date: string; capacity: number; assigned: number };
type OverviewRes = { signupsByInterest: SignupByInterest[]; pairsByDate: PairsByDate[]; varoFill: VaroFill[]; };

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [signupsByInterest, setSBI] = useState<SignupByInterest[]>([]);
  const [pairsByDate, setPBD] = useState<PairsByDate[]>([]);
  const [varoFill, setVF] = useState<VaroFill[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/metrics/overview");
      const data: OverviewRes = await res.json();
      setSBI(data.signupsByInterest ?? []);
      setPBD((data.pairsByDate ?? []).map((d) => ({ date: String(d.date), pairs: Number(d.pairs ?? 0) })));
      setVF((data.varoFill ?? []).map((d) => ({ date: String(d.date), capacity: Number(d.capacity ?? 0), assigned: Number(d.assigned ?? 0) })));
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-10">
      <section>
        <h2 className="text-xl font-semibold mb-2">Pairs Distributed per Date</h2>
        <div className="w-full h-80 border rounded p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pairsByDate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { timeZone: 'UTC' })} />
              <YAxis />
              <Tooltip labelFormatter={(v) => new Date(String(v)).toLocaleDateString('en-US', { timeZone: 'UTC' })} />
              <Line type="monotone" dataKey="pairs" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Sign-ups by Interest</h2>
        <div className="w-full h-80 border rounded p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={signupsByInterest}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="interest" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Varo Fill vs Capacity (by Date)</h2>
        <div className="w-full h-80 border rounded p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={varoFill}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { timeZone: 'UTC' })} />
              <YAxis />
              <Tooltip labelFormatter={(v) => new Date(String(v)).toLocaleDateString('en-US', { timeZone: 'UTC' })} />
              <Legend />
              <Bar dataKey="assigned" />
              <Bar dataKey="capacity" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}