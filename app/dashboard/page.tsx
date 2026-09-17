'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 17) setGreeting('Good afternoon');
    else if (hour >= 17) setGreeting('Good evening');

    setUser({
      fullName: 'Demo User',
      accountNumber: '1234567890',
      balance: 0,
    });
  }, []);

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <TopNav />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-primary-900 mb-6">
          {greeting}, {user.fullName.split(' ')[0]}
        </h1>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <SummaryCard title="Account number" value={user.accountNumber ?? 'Not assigned'} />
          <SummaryCard title="Balance" value={`$${Number(user.balance ?? 0).toFixed(2)}`} />
          <SummaryCard title="Status" value="Active" />
        </div>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">Quick actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ActionCard title="Transfer" href="/dashboard/transfer" />
            <ActionCard title="Transactions" href="/dashboard/transactions" />
            <ActionCard title="Cards" href="/dashboard/cards" />
            <ActionCard title="Investments" href="/dashboard/investments" />
            <ActionCard title="Loans" href="/dashboard/loans" />
            <ActionCard title="Settings" href="/dashboard/settings" />
          </div>
        </section>

        <SupportFooter />
      </div>
    </main>
  );
}

function TopNav() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-lg font-bold text-primary-900">
          Online Banking
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-gray-700 hover:text-primary-700">
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

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      <div className="text-xl font-semibold text-primary-900">{value}</div>
    </div>
  );
}

function ActionCard({ title, href }: { title: string; href: string }) {
  return (
    <Link
      href={href}
      className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm hover:border-primary-300 hover:shadow"
    >
      <div className="text-primary-700 font-medium">{title}</div>
    </Link>
  );
}

function SupportFooter() {
  return (
    <section className="mt-12 rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-primary-900 mb-2">Contact support</h3>
      <p className="text-gray-600 mb-4">
        Need help? Email us at:{' '}
        <a href="mailto:bankm3857@gmail.com" className="text-primary-700 font-medium hover:underline">
          bankm3857@gmail.com
        </a>
      </p>
      <p className="text-xs text-gray-500">
        This is a demo environment. No real money or bank connections.
      </p>
    </section>
  );
}
