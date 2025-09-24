"use client";
import { useState } from "react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/login", { method: "POST", body: password });
    if (res.ok) location.href = "/admin";
    else alert("Invalid password");
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Admin Login</h1>
      <input className="w-full border p-2 rounded" type="password" placeholder="Admin password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button className="px-4 py-2 rounded bg-black text-white">Sign in</button>
    </form>
  );
}
