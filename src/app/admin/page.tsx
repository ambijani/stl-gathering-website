import Link from "next/link";

export default function AdminHome() {
  return (
    <div className="admin-page">
      <h1 className="page-heading mb-6">Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl">
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
  );
}
