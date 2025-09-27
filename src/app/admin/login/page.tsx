"use client";
import { useState } from "react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log('Login form - Submitting password...');
    
    try {
      const res = await fetch("/api/admin/login", { method: "POST", body: password });
      console.log('Login form - Response status:', res.status);
      
      if (res.ok) {
        console.log('Login form - Login successful, redirecting...');
        // Add a small delay to ensure cookie is set before redirect
        setTimeout(() => {
          location.href = "/admin";
        }, 200);
      } else {
        console.log('Login form - Login failed');
        alert("Invalid password");
      }
    } catch (error) {
      console.error('Login form - Error:', error);
      alert("Login failed. Please try again.");
    }
  }

  return (
    <div className="min-h-screen ismaili-bg-pattern flex items-center justify-center">
      <div className="ismaili-card p-8 max-w-md mx-4 w-full">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold ismaili-text-primary">Admin Access</h1>
          <p className="text-gray-600 mt-2">Enter your admin password to continue</p>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium ismaili-text-primary mb-2">Password</label>
            <input 
              className="ismaili-input w-full" 
              type="password" 
              placeholder="Enter admin password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>
          
          <button className="ismaili-button w-full text-lg py-3">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
