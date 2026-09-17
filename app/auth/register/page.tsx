'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError(null);
    const form = e.currentTarget;
    const data = {
      fullName: (form.elements.namedItem('fullName') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      password: (form.elements.namedItem('password') as HTMLInputElement).value,
      address: (form.elements.namedItem('address') as HTMLInputElement).value,
      ssnOrNin: (form.elements.namedItem('ssnOrNin') as HTMLInputElement).value,
    };
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Registration failed');
      router.push('/auth/signin?registered=1');
    } catch (err) { setError(err instanceof Error ? err.message : 'Registration failed'); setLoading(false); }
  }

  return <main className="min-h-screen bg-[#f5f8fc] p-4 md:p-8"><div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-blue-950/10 lg:grid-cols-2"><section className="hidden bg-[#071b3a] p-12 text-white lg:block"><Link href="/" className="flex items-center gap-3 text-white no-underline"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400 font-black text-[#071b3a]">GT</span><span><strong className="block tracking-wide">GLOBAL TRUST</strong><span className="text-xs tracking-[.22em] text-blue-100">BANK</span></span></Link><div className="mt-28"><p className="text-sm font-bold uppercase tracking-[.2em] text-emerald-300">Welcome to the future</p><h1 className="mt-5 text-4xl font-black leading-tight">Your financial journey starts here.</h1><p className="mt-5 max-w-md leading-7 text-blue-100">Open a demo account to explore secure banking tools, virtual cards, investments, and loans in one trusted dashboard.</p></div><p className="mt-28 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-blue-100">This platform is a demo only. It does not process real funds or connect to financial institutions.</p></section><section className="flex items-center p-7 sm:p-12"><div className="w-full max-w-md"><Link href="/" className="text-sm font-bold text-[#0b5fff]">← Back to Global Trust Bank</Link><h2 className="mt-7 text-3xl font-black text-[#071b3a]">Open your account</h2><p className="mt-2 text-sm text-[#61708a]">Complete the form below to request a demo account.</p>{error && <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}<form onSubmit={handleSubmit} className="mt-7 space-y-4"><label className="block text-sm font-bold text-[#10233f]">Full name<input className="gtb-input" name="fullName" required placeholder="Enter your full name" /></label><label className="block text-sm font-bold text-[#10233f]">Email address<input className="gtb-input" name="email" type="email" required placeholder="you@example.com" /></label><label className="block text-sm font-bold text-[#10233f]">Password<input className="gtb-input" name="password" type="password" required minLength={6} placeholder="Create a secure password" /></label><label className="block text-sm font-bold text-[#10233f]">Home address<input className="gtb-input" name="address" required placeholder="Enter your address" /></label><label className="block text-sm font-bold text-[#10233f]">SSN or NIN<input className="gtb-input" name="ssnOrNin" required placeholder="For demo verification only" /></label><button className="gtb-btn-primary mt-2 w-full" disabled={loading}>{loading ? 'Creating account...' : 'Create demo account'}</button></form><p className="mt-6 text-center text-sm text-[#61708a]">Already registered? <Link className="font-bold text-[#0b5fff]" href="/auth/signin">Sign in</Link></p></div></section></div></main>;
}
