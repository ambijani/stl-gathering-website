"use client";
import { useState } from "react";

export default function Signup() {
  const [form, setForm] = useState({ name:"", email:"", phone:"", interests:"", availability:"" });
  const [ok, setOk] = useState(false);

  function update(e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const interests = form.interests
      ? form.interests.split(",").map(s=>s.trim()).filter(Boolean) : [];
    const res = await fetch("/api/submit", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ ...form, interests })
    });
    setOk(res.ok);
  }

  if (ok) return <div className="max-w-lg mx-auto p-6 bg-white/70 dark:bg-white/5 rounded-lg border border-black/10 dark:border-white/10 shadow-sm">Thanks! We got your info.</div>;

  return (
    <form onSubmit={onSubmit} className="max-w-lg mx-auto p-6 space-y-4 bg-white/70 dark:bg-white/5 rounded-lg border border-black/10 dark:border-white/10 shadow-sm">
      <h1 className="text-3xl font-semibold tracking-tight">Sign up</h1>
      <p className="text-sm text-black/70 dark:text-white/70">We will reach out based on your interests and availability.</p>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="name">Name</label>
        <input id="name" className="border border-black/20 dark:border-white/20 bg-white dark:bg-black p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" name="name" placeholder="Your full name" required onChange={update}/>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="email">Email</label>
        <input id="email" className="border border-black/20 dark:border-white/20 bg-white dark:bg-black p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" name="email" placeholder="you@example.com" onChange={update}/>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="phone">Phone</label>
        <input id="phone" className="border border-black/20 dark:border-white/20 bg-white dark:bg-black p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" name="phone" placeholder="(555) 555-5555" onChange={update}/>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="interests">Interests</label>
        <input id="interests" className="border border-black/20 dark:border-white/20 bg-white dark:bg-black p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" name="interests" placeholder="Comma-separated e.g., volunteering, planning" onChange={update}/>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="availability">Availability / Notes</label>
        <textarea id="availability" className="border border-black/20 dark:border-white/20 bg-white dark:bg-black p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" name="availability" placeholder="Let us know when you're free" onChange={update}/>
      </div>
      <div className="pt-2">
        <button className="px-4 py-2 rounded-md bg-black text-white hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white">Submit</button>
      </div>
    </form>
  );
}
