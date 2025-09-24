"use client";
import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Legend, ResponsiveContainer
} from "recharts";

type SignupsByInterest = { interest: string|null; count: number };
type PairsByDate = { date: string; pairs: number };
type VaroFill = { date: string; capacity: number; assigned: number };

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [signupsByInterest, setSBI] = useState<SignupsByInterest[]>([]);
  const [pairsByDate, setPBD] = useState<PairsByDate[]>([]);
  const [varoFill, setVF] = useState<VaroFill[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/metrics/overview");
      const data = await res.json();
      setSBI(data.signupsByInterest || []);
      setPBD((data.pairsByDate || []).map((d: any) => ({
        date: d.date, pairs: d.pairs
      })));
      setVF((data.varoFill || []).map((d:any) => ({ date: d.date, capacity: d.capacity, assigned: d.assigned })));
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
              <XAxis dataKey="date" tickFormatter={(v)=>new Date(v).toLocaleDateString()} />
              <YAxis />
              <Tooltip labelFormatter={(v)=>new Date(v as string).toLocaleDateString()} />
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
              <XAxis dataKey="date" tickFormatter={(v)=>new Date(v).toLocaleDateString()} />
              <YAxis />
              <Tooltip labelFormatter={(v)=>new Date(v as string).toLocaleDateString()} />
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
