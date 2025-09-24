"use client";
import { useEffect, useState } from "react";

type Person = {
  _id: string; name: string; email?: string; phone?: string;
  interests?: string[]; availability?: string;
};

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/people");
      setPeople(await res.json());
    })();
  }, []);

  const filtered = people.filter(p =>
    [p.name, p.email, p.phone, (p.interests||[]).join(",")].join(" ").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-3">People</h1>
      <input
        placeholder="Search"
        className="border p-2 rounded mb-4 w-full max-w-md"
        value={q}
        onChange={e=>setQ(e.target.value)}
      />
      <div className="border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Phone</th>
              <th className="text-left p-2">Interests</th>
              <th className="text-left p-2">ID</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p=>(
              <tr key={p._id} className="border-t">
                <td className="p-2">{p.name}</td>
                <td className="p-2">{p.email||"-"}</td>
                <td className="p-2">{p.phone||"-"}</td>
                <td className="p-2">{(p.interests||[]).join(", ")||"-"}</td>
                <td className="p-2 font-mono text-xs">{p._id}</td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td className="p-4 text-gray-500" colSpan={5}>No people yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
