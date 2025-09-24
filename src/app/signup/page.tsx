"use client";
import { useState } from "react";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", interests: "", availability: "" });
  const [ok, setOk] = useState(false);

  function update(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const interests = form.interests ? form.interests.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, interests })
    });
    setOk(res.ok);
  }

  if (ok) return <div className="p-6">Thanks! We got your info.</div>;

  return (
    <form onSubmit={onSubmit} className="max-w-lg mx-auto p-6 space-y-3">
      <h1 className="text-2xl font-semibold">Sign up</h1>
      <input className="border p-2 w-full rounded" name="name" placeholder="Name" required onChange={update} />
      <input className="border p-2 w-full rounded" name="email" placeholder="Email" onChange={update} />
      <input className="border p-2 w-full rounded" name="phone" placeholder="Phone" onChange={update} />
      <input className="border p-2 w-full rounded" name="interests" placeholder="Interests (comma-separated)" onChange={update} />
      <textarea className="border p-2 w-full rounded" name="availability" placeholder="Availability / Notes" onChange={update} />
      <button className="px-4 py-2 rounded bg-black text-white">Submit</button>
    </form>
  );
}
