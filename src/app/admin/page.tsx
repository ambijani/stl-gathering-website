"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminHome() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is authenticated by checking for admin cookie
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/health");
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          router.replace("/admin/login");
        }
      } catch {
        router.replace("/admin/login");
      } finally {
        setIsLoading(false);
      }
    };
    
    // Add a small delay to ensure cookies are set after login redirect
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen ismaili-bg-pattern flex items-center justify-center">
        <div className="ismaili-card p-8 text-center">
          <div className="text-4xl mb-4">🔄</div>
          <h2 className="text-xl font-semibold ismaili-text-primary">Loading...</h2>
          <p className="text-gray-600">Checking authentication</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  // Show admin dashboard if authenticated
  return (
    <div className="min-h-screen ismaili-bg-pattern">
      <div className="ismaili-header">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-lg opacity-90">Manage STL Ismaili community gatherings</p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Link href="/admin/people" className="ismaili-card p-6 text-center hover:scale-105 transition-transform">
            <div className="text-4xl mb-4">👥</div>
            <h2 className="text-xl font-semibold ismaili-text-primary mb-2">People</h2>
            <p className="text-gray-600">Manage community members and their information</p>
          </Link>
          
          <Link href="/admin/gatherings" className="ismaili-card p-6 text-center hover:scale-105 transition-transform">
            <div className="text-4xl mb-4">📅</div>
            <h2 className="text-xl font-semibold ismaili-text-primary mb-2">Gatherings & Varos</h2>
            <p className="text-gray-600">Schedule events and manage activities</p>
          </Link>
          
          <Link href="/admin/analytics" className="ismaili-card p-6 text-center hover:scale-105 transition-transform">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-xl font-semibold ismaili-text-primary mb-2">Analytics</h2>
            <p className="text-gray-600">View community insights and metrics</p>
          </Link>
        </div>
      </div>
    </div>
  );
}