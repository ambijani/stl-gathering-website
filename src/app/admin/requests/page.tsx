"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { redirectIfUnauthorized } from "@/lib/adminClient";

type VaroRequest = { personName: string; gatheringId: string; gatheringTitle: string; gatheringDate: string; varoTitle: string; requestedAt: string };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<VaroRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/requests");
      if (!res.ok) {
        if (!redirectIfUnauthorized(res)) alert("Could not load requests. Please refresh the page.");
        setLoading(false);
        return;
      }
      const data = await res.json() as { requests: VaroRequest[] };
      setRequests(data.requests ?? []);
      setLoading(false);
    })();
  }, []);

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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
