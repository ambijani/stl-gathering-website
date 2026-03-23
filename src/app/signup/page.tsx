"use client";
import { useState } from "react";
import Link from "next/link";

const VARO_OPTIONS = [
  "1st Dua",
  "1st Dua Tasbih (Farsi)",
  "Standing Tasbih",
  "Ginan/Qasida",
  "Farman",
  "2nd Dua",
  "2nd Dua Tasbih",
  "Announcements",
  "Chandraat Ginan",
  "Chandraat Article of the Month",
  "Chandraat Tasbih",
  "Conclusion Dua",
];

export default function Signup() {
  const [form, setForm] = useState({ name: "", phone: "", availability: "" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [otherChecked, setOtherChecked] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [open, setOpen] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function toggleInterest(val: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(val) ? next.delete(val) : next.add(val);
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const interests = [
      ...Array.from(selected),
      ...(otherChecked && otherText.trim() ? [otherText.trim()] : []),
    ];
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, interests }),
    });
    if (res.ok) {
      setOk(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
    }
  }

  if (ok) return (
    <div className="min-h-screen ismaili-bg-pattern flex items-center justify-center">
      <div className="ismaili-card p-8 text-center max-w-md mx-4">
        <div className="text-6xl mb-4">✨</div>
        <h2 className="text-2xl font-bold ismaili-text-primary mb-2">Thank You!</h2>
        <p className="text-gray-600">We&apos;ve received your information and will be in touch soon.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen ismaili-bg-pattern">
      <div className="ismaili-header">
        <div className="container mx-auto px-4 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Join Our Community</h1>
            <p className="text-lg opacity-90">Sign up for STL Ismaili gatherings and events</p>
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
              <div>
                <label className="block text-sm font-medium ismaili-text-primary mb-2">Full Name *</label>
                <input
                  className="ismaili-input w-full"
                  name="name"
                  placeholder="Enter your full name"
                  required
                  onChange={update}
                />
              </div>

              <div>
                <label className="block text-sm font-medium ismaili-text-primary mb-2">Phone</label>
                <input
                  className="ismaili-input w-full"
                  name="phone"
                  type="tel"
                  placeholder="(314) 555-0123"
                  onChange={update}
                />
              </div>

              <div>
                <label className="block text-sm font-medium ismaili-text-primary mb-2">
                  Varos I&apos;m interested in
                </label>
                <div className="border rounded-lg bg-white">
                  <button
                    type="button"
                    onClick={() => setOpen(o => !o)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left"
                  >
                    <span className="text-gray-500">
                      {selected.size + (otherChecked ? 1 : 0) === 0
                        ? "Select Varos…"
                        : `${selected.size + (otherChecked ? 1 : 0)} selected`}
                    </span>
                    <span className="text-gray-400">{open ? "▲" : "▼"}</span>
                  </button>
                  {open && (
                    <div className="border-t divide-y">
                      {VARO_OPTIONS.map(opt => (
                        <label key={opt} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded"
                            checked={selected.has(opt)}
                            onChange={() => toggleInterest(opt)}
                          />
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                      <div className="px-4 py-2.5">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded"
                            checked={otherChecked}
                            onChange={e => { setOtherChecked(e.target.checked); if (!e.target.checked) setOtherText(""); }}
                          />
                          <span className="text-sm">Other</span>
                        </label>
                        {otherChecked && (
                          <input
                            className="ismaili-input w-full mt-2 text-sm"
                            placeholder="Please specify…"
                            value={otherText}
                            onChange={e => setOtherText(e.target.value)}
                            autoFocus
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium ismaili-text-primary mb-2">Availability & Notes</label>
                <textarea
                  className="ismaili-input w-full h-24 resize-none"
                  name="availability"
                  placeholder="Tell us about your availability and any additional notes..."
                  onChange={update}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</p>
              )}
              <button className="ismaili-button w-full text-lg py-3">
                Join Our Community
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
