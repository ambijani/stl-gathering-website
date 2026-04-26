"use client";
import { useEffect, useState, useCallback } from "react";
import { BlurredName, useDemo } from "@/components/DemoContext";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, ResponsiveContainer, Cell,
} from "recharts";

type PairsByDate      = { date: string; pairs: number };
type VaroFrequency    = { name: string; count: number };
type ShoeCountByMonth = { month: string; avg: number };
type InactiveMember   = { _id: string; name: string; lastVaro: string | null };
type ReportGathering  = { title: string; date: string; totalShoes: number; shoeBreakdown: { size: string; qty: number }[] };
type ReportData       = { monthLabel: string; gatherings: ReportGathering[] };
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
  const [freqSearch,  setFreqSearch]  = useState("");
  const [inactiveAsc, setInactiveAsc] = useState(false);

  // Report state
  const now = new Date();
  const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const [reportMonth,   setReportMonth]   = useState(lastMonth);
  const [reportYear,    setReportYear]    = useState(lastMonthYear);
  const [reportData,    setReportData]    = useState<ReportData | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [sending,          setSending]          = useState(false);
  const [sendStatus,       setSendStatus]       = useState<{ ok: boolean; msg: string } | null>(null);
  const [extraRecipients,  setExtraRecipients]  = useState("");

  const loadReport = useCallback(async (month: number, year: number) => {
    setReportLoading(true);
    setSendStatus(null);
    const res  = await fetch(`/api/admin/report?month=${month}&year=${year}`);
    const data = await res.json();
    setReportData(data);
    setReportLoading(false);
  }, []);

  useEffect(() => { loadReport(reportMonth, reportYear); }, [loadReport, reportMonth, reportYear]);

  async function handleSendReport() {
    setSending(true);
    setSendStatus(null);
    const res  = await fetch("/api/admin/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        month: reportMonth,
        year: reportYear,
        extraRecipients: extraRecipients.split(",").map(e => e.trim()).filter(Boolean),
      }),
    });
    const data = await res.json();
    setSendStatus(res.ok ? { ok: true, msg: `Report sent for ${data.monthLabel}` } : { ok: false, msg: data.error ?? "Failed to send" });
    setSending(false);
  }

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

  const isDemo = useDemo();

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
            aria-label="Search varo frequency by name"
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
                            style={isDemo ? { filter: "blur(5px)" } : undefined}
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
              <div className="ismaili-card overflow-hidden max-h-72 overflow-y-auto">
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
                          <td className="font-medium text-xs"><BlurredName>{m.name}</BlurredName></td>
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

      {/* Monthly Report */}
      <section>
        <h2 className="text-xl font-semibold mb-1">Monthly Email Report</h2>
        <p className="text-sm text-gray-500 mb-4">Preview and send the report to configured recipients. Sends automatically on the 1st of each month.</p>

        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <select
            className="ismaili-input text-sm w-40"
            value={reportMonth}
            onChange={e => setReportMonth(Number(e.target.value))}
          >
            {["January","February","March","April","May","June","July","August","September","October","November","December"]
              .map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select
            className="ismaili-input text-sm w-28"
            value={reportYear}
            onChange={e => setReportYear(Number(e.target.value))}
          >
            {Array.from({ length: 4 }, (_, i) => now.getFullYear() - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <input
            className="ismaili-input text-sm flex-1 min-w-60"
            placeholder="Extra recipients (comma-separated emails)"
            value={extraRecipients}
            onChange={e => setExtraRecipients(e.target.value)}
          />
          <button
            className="ismaili-btn text-sm shrink-0"
            onClick={handleSendReport}
            disabled={sending || reportLoading}
          >
            {sending ? "Sending…" : "Send Report"}
          </button>
          {sendStatus && (
            <span role="status" className={`text-sm font-medium ${sendStatus.ok ? "text-green-600" : "text-red-600"}`}>
              {sendStatus.msg}
            </span>
          )}
        </div>

        {reportLoading ? (
          <p className="text-gray-400 text-sm">Loading preview…</p>
        ) : reportData && (
          <div className="ismaili-card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <span className="font-semibold text-sm">{reportData.monthLabel}</span>
              <span className="text-gray-400 text-xs ml-2">— {reportData.gatherings.length} gathering{reportData.gatherings.length !== 1 ? "s" : ""}</span>
            </div>
            {reportData.gatherings.length === 0 ? (
              <p className="text-gray-400 text-sm italic p-4">No gatherings recorded for this month.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Gathering</th>
                    <th>Date</th>
                    <th className="text-center">Shoe Pairs</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.gatherings.map((g, i) => (
                    <tr key={i}>
                      <td className="font-medium">{g.title || "Gathering"}</td>
                      <td className="text-gray-500 text-sm">
                        {new Date(g.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}
                      </td>
                      <td className="text-center font-semibold">{g.totalShoes}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan={2}>Avg per gathering</td>
                    <td className="text-center">
                      {(reportData.gatherings.reduce((s, g) => s + g.totalShoes, 0) / reportData.gatherings.length).toFixed(1)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        )}
      </section>

    </div>
  );
}
