"use client";
import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, ResponsiveContainer, Cell,
} from "recharts";

type PairsByDate      = { date: string; pairs: number };
type VaroFrequency    = { name: string; count: number };
type ShoeCountByMonth = { month: string; avg: number };
type InactiveMember = { _id: string; name: string; lastVaro: string | null };
type OverviewRes = {
  pairsByDate:      PairsByDate[];
  varoFrequency:    VaroFrequency[];
  shoeCountByMonth: ShoeCountByMonth[];
  inactiveMembers:  InactiveMember[];
};

const COLORS = ["#4f46e5","#7c3aed","#db2777","#ea580c","#16a34a","#0891b2","#ca8a04"];

function fmtDate(v: unknown) {
  return new Date(String(v)).toLocaleDateString("en-US", { timeZone: "UTC" });
}

export default function Analytics() {
  const [loading,   setLoading]   = useState(true);
  const [pbd,       setPbd]       = useState<PairsByDate[]>([]);
  const [freq,      setFreq]      = useState<VaroFrequency[]>([]);
  const [scm,       setScm]       = useState<ShoeCountByMonth[]>([]);
  const [inactive,  setInactive]  = useState<InactiveMember[]>([]);
  const [freqSearch, setFreqSearch] = useState("");
  const [inactiveAsc, setInactiveAsc] = useState(true);

  useEffect(() => {
    (async () => {
      const res  = await fetch("/api/admin/metrics/overview");
      const data: OverviewRes = await res.json();
      setPbd((data.pairsByDate ?? []).map(d => ({ date: String(d.date), pairs: Number(d.pairs ?? 0) })));
      setFreq(data.varoFrequency ?? []);
      setScm(data.shoeCountByMonth ?? []);
      setInactive(data.inactiveMembers ?? []);
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

      {/* Varo Frequency + Inactive Members */}
      <section>
        <div className="flex items-end justify-between flex-wrap gap-3 mb-3">
          <div>
            <h2 className="text-xl font-semibold mb-1">Varo Frequency by Person</h2>
            <p className="text-sm text-gray-500">Total Varos performed across all gatherings (top {freq.length})</p>
          </div>
          <input
            className="ismaili-input text-sm w-56"
            placeholder="Search name…"
            value={freqSearch}
            onChange={e => setFreqSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-6 items-start">
          {/* Chart */}
          <div className="flex-1 min-w-0">
            {freq.length === 0 ? (
              <p className="text-gray-400 text-sm">No data yet.</p>
            ) : (
              <div className="w-full border rounded p-2" style={{ height: Math.max(300, freq.length * 22) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={freq} layout="vertical" margin={{ left: 16, right: 32, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={160}
                      interval={0}
                      tick={(props) => {
                        const { x, y, payload } = props;
                        const q = freqSearch.trim().toLowerCase();
                        const match = q && payload.value.toLowerCase().includes(q);
                        return (
                          <text
                            x={x}
                            y={y}
                            dy={4}
                            textAnchor="end"
                            fontSize={match ? 13 : 12}
                            fontWeight={match ? 700 : 400}
                            fill={match ? "#111827" : "#4b5563"}
                          >
                            {payload.value}
                          </text>
                        );
                      }}
                    />
                    <Tooltip />
                    <Bar dataKey="count" name="Varos performed" radius={[0, 4, 4, 0]}>
                      {freq.map((entry, i) => {
                        const q = freqSearch.trim().toLowerCase();
                        const match = q && entry.name.toLowerCase().includes(q);
                        return <Cell key={i} fill={match ? "#111827" : COLORS[i % COLORS.length]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Inactive Members */}
          {inactive.length > 0 && (
            <div className="w-72 shrink-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm">Inactive Members</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                  {inactive.length}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-2">No Varo in 30+ days</p>
              <div className="ismaili-card overflow-hidden">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>
                        <button
                          onClick={() => setInactiveAsc(a => !a)}
                          className="flex items-center gap-1 hover:text-gray-800 transition-colors"
                        >
                          Days {inactiveAsc ? "↑" : "↓"}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...inactive].sort((a, b) => {
                      const da = a.lastVaro ? new Date(a.lastVaro).getTime() : 0;
                      const db = b.lastVaro ? new Date(b.lastVaro).getTime() : 0;
                      return inactiveAsc ? da - db : db - da;
                    }).map((m) => {
                      const daysSince = m.lastVaro
                        ? Math.floor((Date.now() - new Date(m.lastVaro).getTime()) / (1000 * 60 * 60 * 24))
                        : null;
                      return (
                        <tr key={m._id}>
                          <td className="font-medium text-xs">{m.name}</td>
                          <td>
                            {daysSince !== null ? (
                              <span className={`font-semibold text-xs ${daysSince >= 60 ? "text-red-600" : "text-amber-600"}`}>
                                {daysSince}d
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs italic">never</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
