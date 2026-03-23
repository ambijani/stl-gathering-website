"use client";
import { useEffect, useMemo, useState } from "react";

type Person = { _id: string; name: string; email?: string; phone?: string; interests?: string[] };

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/people", { cache: "no-store" })
      .then(r => r.json())
      .then(setPeople)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? people.filter(p => p.name.toLowerCase().includes(q)) : people;
  }, [people, search]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">People <span className="text-gray-400 text-lg font-normal">({people.length})</span></h1>
      </div>

      <input
        className="border rounded p-2 w-full max-w-sm text-sm"
        placeholder="Search by name…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Phone</th>
              <th className="text-left p-3 font-medium">Interests</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4 text-center text-gray-500" colSpan={3}>Loading…</td></tr>
            ) : filtered.length ? (
              filtered.map(p => (
                <tr key={p._id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-gray-600">{p.phone || "—"}</td>
                  <td className="p-3 text-gray-500 text-xs">{(p.interests ?? []).join(", ") || "—"}</td>
                </tr>
              ))
            ) : (
              <tr><td className="p-4 text-gray-500" colSpan={3}>
                {search ? `No people match "${search}"` : "No people found."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {search && !loading && (
        <p className="text-xs text-gray-400">{filtered.length} of {people.length} people</p>
      )}
    </div>
  );
}
