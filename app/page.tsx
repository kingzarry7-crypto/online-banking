import Link from 'next/link';

const features = [
  ['Secure by design', 'Your demo environment is protected with role-based access and account controls.'],
  ['Banking made simple', 'Manage simulated transfers, cards, investments, loans, and activity in one place.'],
  ['Always in control', 'A dedicated admin console lets you approve, restrict, block, and top up demo accounts.'],
];

export default function HomePage() {
  return (
    <main className="gtb-shell overflow-hidden">
      <header className="gtb-nav border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3 text-white no-underline">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400 text-lg font-black text-[#071b3a]">GT</span>
            <span><strong className="block text-base tracking-wide">GLOBAL TRUST</strong><span className="text-xs tracking-[.22em] text-blue-100">BANK</span></span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/auth/signin" className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 sm:block">Sign in</Link>
            <Link href="/auth/register" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#071b3a] hover:bg-blue-50">Open an account</Link>
          </nav>
        </div>
      </header>

      <section className="relative bg-[#071b3a] px-6 pb-24 pt-16 text-white md:pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(11,95,255,.6),transparent_30%),radial-gradient(circle_at_70%_90%,rgba(23,166,115,.28),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-xs font-bold text-emerald-200">● DEMO & SANDBOX ENVIRONMENT</div>
            <h1 className="max-w-2xl text-4xl font-black leading-tight sm:text-5xl">Bank with confidence. Build with clarity.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-blue-100">Global Trust Bank is a polished online banking demonstration platform for exploring modern financial dashboards—without real money, payment rails, or live banking services.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/auth/register" className="gtb-btn-primary bg-emerald-500 hover:bg-emerald-400">Create demo account</Link>
              <Link href="/auth/signin" className="gtb-btn-secondary border-white/20 bg-white/5 text-white hover:border-white hover:text-white">Sign in securely</Link>
            </div>
          </div>
          <div className="rounded-3xl border border-white/15 bg-white/[.08] p-5 shadow-2xl backdrop-blur">
            <div className="rounded-2xl bg-white p-6 text-[#10233f] shadow-lg">
              <div className="flex items-start justify-between"><div><p className="text-sm text-[#61708a]">Total available balance</p><p className="mt-2 text-3xl font-black">$0.00</p></div><span className="gtb-badge gtb-badge-green">● Active</span></div>
              <div className="mt-7 rounded-2xl bg-gradient-to-br from-[#0b5fff] to-[#071b3a] p-5 text-white"><div className="flex justify-between text-xs text-blue-100"><span>GLOBAL TRUST BANK</span><span>VIRTUAL</span></div><p className="mt-8 text-xl tracking-[.2em]">••••  4829</p><div className="mt-4 flex justify-between text-xs"><span>DEMO MEMBER</span><span>12/29</span></div></div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs font-bold"><div className="rounded-xl bg-[#f5f8fc] p-3">Send money</div><div className="rounded-xl bg-[#f5f8fc] p-3">Pay bills</div><div className="rounded-xl bg-[#f5f8fc] p-3">View cards</div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-10 grid max-w-7xl gap-5 px-6 pb-20 md:grid-cols-3">
        {features.map(([title, text]) => <article key={title} className="gtb-card p-6"><span className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-blue-50 font-bold text-[#0b5fff]">✓</span><h2 className="text-lg font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-[#61708a]">{text}</p></article>)}
      </section>

      <footer className="border-t border-[#e6ebf2] bg-white px-6 py-8 text-center text-sm text-[#61708a]">Global Trust Bank Demo · No real money is moved or received · Support: <a className="font-semibold text-[#0b5fff]" href="mailto:bankm3857@gmail.com">bankm3857@gmail.com</a></footer>
    </main>
  );
}
