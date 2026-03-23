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

  const isLoginPage = pathname === "/admin/login";
  if (isLoginPage) return <>{children}</>;

  const navLink = (href: string, label: string) => {
    const active = pathname.startsWith(href);
    return (
      <Link
        href={href}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          active ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <>
      <nav className="bg-white border-b px-4 py-2 flex items-center justify-between sticky top-0 z-50">
        <Link href="/admin" className="font-semibold text-gray-800 text-sm">
          STL Gathering
        </Link>
        <div className="flex items-center gap-1">
          {navLink("/admin/people", "People")}
          {navLink("/admin/gatherings", "Gatherings")}
          {navLink("/admin/analytics", "Analytics")}
          <button
            onClick={logout}
            className="ml-3 px-3 py-1 rounded text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>
      {children}
    </>
  );
}
