import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <header className="flex items-center justify-between mb-16">
          <h1 className="text-2xl font-bold text-primary-900">Online Banking Demo</h1>
          <nav className="flex gap-4">
            <Link
              href="/auth/signin"
              className="px-4 py-2 rounded-md border border-primary-600 text-primary-700 hover:bg-primary-50"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700"
            >
              Register
            </Link>
          </nav>
        </header>

        <section className="text-center">
          <h2 className="text-4xl font-extrabold text-primary-900 mb-4">
            A realistic demo banking experience
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Explore dashboards, transfers, investments, and loans — all with simulated money.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/auth/register"
              className="px-6 py-3 rounded-md bg-primary-600 text-white font-medium hover:bg-primary-700"
            >
              Create Demo Account
            </Link>
            <Link
              href="/auth/signin"
              className="px-6 py-3 rounded-md border border-primary-600 text-primary-700 font-medium hover:bg-primary-50"
            >
              Sign In
            </Link>
          </div>
        </section>

        <section className="mt-20 grid md:grid-cols-3 gap-6">
          <FeatureCard
            title="User Dashboard"
            description="Account overview, transfers, transactions, cards, investments, and loans."
          />
          <FeatureCard
            title="Admin Dashboard"
            description="Approve users, manage accounts, top up balances, and view system stats."
          />
          <FeatureCard
            title="Safe Demo Environment"
            description="No real money moves. All transactions are simulated for learning and testing."
          />
        </section>

        <footer className="mt-20 text-center text-sm text-gray-500">
          Demo only. Not connected to any real bank or payment system.
        </footer>
      </div>
    </main>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm">
      <h3 className="text-lg font-semibold text-primary-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
