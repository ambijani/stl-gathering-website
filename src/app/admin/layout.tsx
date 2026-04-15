"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DemoProvider, useDemo } from "@/components/DemoContext";

function DemoBanner() {
  const isDemo = useDemo();
  if (!isDemo) return null;
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-center text-sm text-amber-800">
      Demo mode — browsing is read-only.{" "}
      <Link href="/admin/login" className="font-semibold underline underline-offset-2">
        Sign in
      </Link>{" "}
      with the admin password to make changes.
    </div>
  );
}

function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  const navLink = (href: string, label: string) => {
    const active = pathname.startsWith(href);
    return (
      <Link
        href={href}
        className={`inline-flex items-center rounded-full border px-3.5 py-1 text-sm font-semibold shadow-sm transition ${
          active
            ? "border-white/80 bg-white text-emerald-900 shadow-md"
            : "border-white/45 bg-white/15 text-white hover:bg-white/25"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3"
      style={{ background: "linear-gradient(135deg,#1a3009 0%,#2d5016 100%)", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
      <Link href="/admin" className="text-white font-bold text-base tracking-tight mr-6">
        STL Gathering
      </Link>
      <div className="flex items-center gap-2">
        {navLink("/admin/people", "People")}
        {navLink("/admin/gatherings", "Gatherings")}
        {navLink("/admin/analytics", "Analytics")}
      </div>
      <button
        onClick={logout}
        className="ml-auto inline-flex items-center rounded-full border border-white/45 bg-white/15 px-3.5 py-1 text-sm font-semibold text-white transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-800"
      >
        Logout
      </button>
    </nav>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") return <>{children}</>;

  return (
    <DemoProvider>
      <AdminNav />
      <DemoBanner />
      {children}
    </DemoProvider>
  );
}
