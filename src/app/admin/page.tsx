import Link from "next/link";

export default function AdminHome() {
  return (
    <div className="p-6 space-y-3">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <ul className="list-disc ml-5 space-y-1">
        <li><Link className="underline" href="/admin/people">People</Link></li>
        <li><Link className="underline" href="/admin/gatherings">Dates & Varos</Link></li>
        <li><Link className="underline" href="/admin/analytics">Analytics</Link></li>
      </ul>
    </div>
  );
}