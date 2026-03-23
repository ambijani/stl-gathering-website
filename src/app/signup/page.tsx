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

  const WHATSAPP_URL = "https://chat.whatsapp.com/FP9Va30V5XoG4bLYgd4jdl?mode=gi_t";

  async function submit(joinWhatsApp: boolean) {
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
      if (joinWhatsApp) {
        window.location.href = WHATSAPP_URL;
      } else {
        setOk(true);
      }
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit(false);
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
              <div className="space-y-3">
                <button type="submit" className="ismaili-button w-full text-lg py-3">
                  Join Our Community
                </button>
                <button
                  type="button"
                  onClick={() => submit(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg py-3 text-base font-semibold text-white transition"
                  style={{ background: "#25D366" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#1ebe5d")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#25D366")}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Submit &amp; Join WhatsApp Community
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
