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

  if (ok) return (
    <div className="min-h-screen ismaili-bg-pattern flex items-center justify-center">
      <div className="ismaili-card p-8 text-center max-w-md mx-4">
        <div className="text-6xl mb-4">✨</div>
        <h2 className="text-2xl font-bold ismaili-text-primary mb-2">Thank You!</h2>
        <p className="text-gray-600">We've received your information and will be in touch soon.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen ismaili-bg-pattern">
      <div className="ismaili-header">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Join Our Community</h1>
          <p className="text-lg opacity-90">Sign up for STL Ismaili gatherings and events</p>
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
                <label className="block text-sm font-medium ismaili-text-primary mb-2">Email</label>
                <input 
                  className="ismaili-input w-full" 
                  name="email" 
                  type="email"
                  placeholder="your.email@example.com" 
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
                <label className="block text-sm font-medium ismaili-text-primary mb-2">Interests</label>
                <input 
                  className="ismaili-input w-full" 
                  name="interests" 
                  placeholder="Community service, sports, arts, etc. (comma-separated)" 
                  onChange={update} 
                />
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
