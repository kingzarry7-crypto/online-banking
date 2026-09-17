'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsAdmin(true);
      setLoading(false);
    }, 400);
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <p className="text-gray-600">Loading admin dashboard...</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Access denied. Admin only.</p>
          <Link href="/auth/signin" className="text-primary-700 hover:underline">
            Go to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <AdminTopNav />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-primary-900 mb-6">Admin Dashboard</h1>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatCard label="Total users" value="1" />
          <StatCard label="Pending approvals" value="0" />
          <StatCard label="Total balance (demo)" value="$0.00" />
        </div>

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">User management</h2>
          <p className="text-sm text-gray-600 mb-4">
            Approve, restrict, block, delete users and top up balances.
          </p>
          <div className="text-sm text-gray-500">
            User list and actions will be wired to the backend API.
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-primary-900 mb-2">Environment setup</h3>
          <p className="text-sm text-gray-600">
            Configure admin credentials and database in Vercel environment variables.
          </p>
          <ul className="mt-3 text-sm text-gray-700 list-disc pl-5 space-y-1">
            <li>DATABASE_URL</li>
            <li>ADMIN_EMAIL</li>
            <li>ADMIN_PASSWORD</li>
            <li>JWT_SECRET</li>
          </ul>
        </section>
      </div>
    </main>
  );
}

function AdminTopNav() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/admin" className="text-lg font-bold text-primary-900">
          Admin – Online Banking
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-sm text-gray-700 hover:text-primary-700">
            Dashboard
          </Link>
          <Link href="/auth/signin" className="text-sm text-gray-700 hover:text-primary-700">
            Sign out
          </Link>
        </div>
      </div>
    </nav>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-xl font-semibold text-primary-900">{value}</div>
    </div>
  );
}
