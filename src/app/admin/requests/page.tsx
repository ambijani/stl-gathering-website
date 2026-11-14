"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { redirectIfUnauthorized } from "@/lib/adminClient";

type VaroRequest = { personName: string; personId: string; gatheringId: string; gatheringTitle: string; gatheringDate: string; varoId: string; varoTitle: string; requestedAt: string };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<VaroRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/requests");
    if (!res.ok) {
      if (!redirectIfUnauthorized(res)) alert("Could not load requests. Please refresh the page.");
      setLoading(false);
      return;
    }
    const data = await res.json() as { requests: VaroRequest[] };
    setRequests(data.requests ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function dismiss(r: VaroRequest) {
    const res = await fetch(`/api/admin/gatherings/${r.gatheringId}/varos/${r.varoId}/requests`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personId: r.personId }),
    });
    if (res.ok) await load(); else alert("Failed to dismiss request");
  }

  if (loading) return <div className="admin-page text-gray-400">Loading…</div>;

  return (
    <div className="admin-page space-y-4">
      <h1 className="page-heading">Varo Requests</h1>
      {requests.length === 0 ? (
        <p className="text-gray-400 text-sm">No pending requests.</p>
      ) : (
        <div className="ismaili-card overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Gathering</th>
                <th>Varo</th>
                <th>Requested</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r, i) => (
                <tr key={i}>
                  <td className="font-medium text-gray-900">{r.personName}</td>
                  <td>
                    <Link href={`/admin/gatherings/${r.gatheringId}`} className="text-blue-600 hover:text-blue-800 transition-colors">
                      {fmtDate(r.gatheringDate)}{r.gatheringTitle ? ` — ${r.gatheringTitle}` : ""}
                    </Link>
                  </td>
                  <td className="text-gray-700">{r.varoTitle}</td>
                  <td className="text-gray-500 text-sm">{new Date(r.requestedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                  <td>
                    <button
                      onClick={() => dismiss(r)}
                      className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                    >
                      Dismiss
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
