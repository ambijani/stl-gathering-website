"use client";
import { useEffect, useState } from "react";

type Person = { _id: string; name: string; email?: string; phone?: string; interests?: string[]; availability?: string };

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/people", { cache: "no-store" });
        if (!res.ok) return;
        setPeople(await res.json());
      } catch {
        // silently fail - table will show empty state
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">People</h1>
      <div className="border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Phone</th>
              <th className="text-left p-2">Interests</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3" colSpan={3}>Loading…</td></tr>
            ) : people.length ? (
              people.map((p) => (
                <tr key={p._id} className="border-t">
                  <td className="p-2">{p.name}</td>
                  <td className="p-2">{p.phone || "-"}</td>
                  <td className="p-2">{(p.interests || []).join(", ")}</td>
                </tr>
              ))
            ) : (
              <tr><td className="p-3 text-gray-500" colSpan={3}>No people found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
