"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  if (pathname === "/admin/login") return <>{children}</>;

  const navLink = (href: string, label: string) => {
    const active = pathname.startsWith(href);
    return (
      <Link
        href={href}
        className={`px-4 py-5 text-sm font-medium transition-colors border-b-2 ${
          active
            ? "text-white border-[#d4af37]"
            : "text-white/70 border-transparent hover:text-white hover:border-white/30"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <>
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6"
        style={{ background: "linear-gradient(135deg,#1a3009 0%,#2d5016 100%)", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
        <Link href="/admin" className="text-white font-bold text-base tracking-tight py-4 mr-6">
          STL Gathering
        </Link>
        <div className="flex items-center">
          {navLink("/admin/people", "People")}
          {navLink("/admin/gatherings", "Gatherings")}
          {navLink("/admin/analytics", "Analytics")}
        </div>
        <button
          onClick={logout}
          className="ml-auto text-white/60 hover:text-white text-sm py-4 pl-6 transition-colors"
        >
          Logout
        </button>
      </nav>
      {children}
    </>
  );
}
