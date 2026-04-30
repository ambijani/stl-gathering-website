"use client";
import { useState } from "react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [demoLoading, setDemoLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      body: password,
      credentials: "include",
    });
    if (res.ok) {
      location.href = "/admin";
    } else if (res.status === 429) {
      setError("Too many attempts. Please wait 15 minutes and try again.");
    } else {
      setError("Invalid password.");
    }
  }

  async function onDemoLogin() {
    setDemoLoading(true);
    const res = await fetch("/api/admin/demo-login", { method: "POST", credentials: "include" });
    if (res.ok) {
      location.href = "/admin";
    } else {
      setDemoLoading(false);
    }
  }

  return (
    <div className="min-h-screen ismaili-bg-pattern flex items-center justify-center">
      <div className="ismaili-card p-8 max-w-md mx-4 w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold ismaili-text-primary">Admin Access</h1>
          <p className="text-gray-600 mt-2">Enter your admin password to continue</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium ismaili-text-primary mb-2">Password</label>
            <input
              id="admin-password"
              className="ismaili-input w-full"
              type="password"
              autoComplete="current-password"
              placeholder="Enter admin password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button className="ismaili-button w-full text-lg py-3">Sign In</button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-gray-400 tracking-wide">or</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onDemoLogin}
          disabled={demoLoading}
          className="ismaili-button-outline w-full text-base py-3"
        >
          {demoLoading ? "Loading…" : "Try Demo"}
        </button>
      </div>
    </div>
  );
}
