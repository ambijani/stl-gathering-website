"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";

declare global {
  interface Window {
    grecaptcha: { execute: (key: string, opts: { action: string }) => Promise<string>; ready: (cb: () => void) => void };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

type UpcomingVaro = { _id: string; title: string; requestCount: number };
type UpcomingGathering = { _id: string; title?: string; date: string; varos: UpcomingVaro[] };

function selectionKey(gatheringId: string, varoId: string) {
  return `${gatheringId}:${varoId}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [gatherings, setGatherings] = useState<UpcomingGathering[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/varo-requests");
      if (res.ok) {
        const data = await res.json() as { gatherings: UpcomingGathering[] };
        setGatherings(data.gatherings ?? []);
      }
      setLoading(false);
    })();
  }, []);

  function toggleSelection(gatheringId: string, varoId: string) {
    const key = selectionKey(gatheringId, varoId);
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      let recaptchaToken: string | undefined;
      if (SITE_KEY && window.grecaptcha) {
        recaptchaToken = await new Promise<string>(resolve =>
          window.grecaptcha.ready(async () => resolve(await window.grecaptcha.execute(SITE_KEY, { action: "request_varo" })))
        );
      }

      const selections = Array.from(selected).map(key => {
        const [gatheringId, varoId] = key.split(":");
        return { gatheringId, varoId };
      });

      const res = await fetch("/api/varo-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, recaptchaToken, selections }),
      });

      if (res.ok) {
        setOk(true);
      } else {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setError(data.error ?? "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (ok) return (
    <div className="min-h-screen ismaili-bg-pattern flex items-center justify-center">
      <div className="ismaili-card p-8 text-center max-w-md mx-4">
        <div className="text-6xl mb-4">✨</div>
        <h2 className="text-2xl font-bold ismaili-text-primary mb-2">Thank You!</h2>
        <p className="text-gray-600">Your Varo request has been received. An admin will follow up.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen ismaili-bg-pattern">
      {SITE_KEY && <Script src={`https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`} strategy="afterInteractive" />}
      <div className="ismaili-header">
        <div className="container mx-auto px-4 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold mb-2">Request a Varo</h1>
            <p className="text-lg opacity-90">Pick any upcoming slots you&apos;d like to do</p>
          </div>
          <Link
            href="/admin/login"
            className="mt-1 inline-flex items-center rounded-full border border-white/80 bg-white px-3.5 py-1 text-sm font-semibold text-emerald-900 shadow-md transition hover:bg-white/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-800"
          >
            Admin
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto">
          <div className="ismaili-card p-8">
            <form onSubmit={onSubmit} className="space-y-6">
              {loading ? (
                <p className="text-gray-400 text-sm">Loading…</p>
              ) : gatherings.length === 0 ? (
                <p className="text-gray-500 text-sm">No upcoming Varo slots right now.</p>
              ) : (
                <div className="space-y-5">
                  {gatherings.map(g => (
                    <div key={g._id}>
                      <h3 className="text-sm font-semibold ismaili-text-primary mb-2">
                        {fmtDate(g.date)}{g.title ? ` — ${g.title}` : ""}
                      </h3>
                      <div className="border rounded-lg bg-white divide-y">
                        {g.varos.map(v => (
                          <label key={v._id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded"
                              checked={selected.has(selectionKey(g._id, v._id))}
                              onChange={() => toggleSelection(g._id, v._id)}
                            />
                            <span className="text-sm flex-1">{v.title}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label htmlFor="request-name" className="block text-sm font-medium ismaili-text-primary mb-2">Full Name *</label>
                <input
                  id="request-name"
                  className="ismaili-input w-full"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="request-phone" className="block text-sm font-medium ismaili-text-primary mb-2">Phone *</label>
                <input
                  id="request-phone"
                  className="ismaili-input w-full"
                  type="tel"
                  autoComplete="tel"
                  placeholder="(314) 555-0123"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</p>
              )}
              <button
                type="submit"
                disabled={submitting || selected.size === 0}
                className="ismaili-button w-full text-lg py-3 disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit requests"}
              </button>

              <p className="text-sm text-center text-gray-500">
                Not picking a specific Varo yet?{" "}
                <Link href="/signup" className="ismaili-text-primary font-medium underline">
                  Join the community
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
