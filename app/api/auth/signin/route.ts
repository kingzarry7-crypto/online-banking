import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';
import { verifyUser } from '@/lib/demo-store';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return NextResponse.json({ error: 'Enter your email and password.' }, { status: 400 });
    const normalized = String(email).trim().toLowerCase();
    const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || '';
    let role: 'USER' | 'ADMIN' = 'USER'; let name = '';
    if (adminEmail && adminPassword && normalized === adminEmail && password === adminPassword) { role = 'ADMIN'; name = 'Administrator'; }
    else {
      const user = await verifyUser(normalized, password);
      if (!user) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
      if (user.status === 'PENDING') return NextResponse.json({ error: 'Your account is pending administrator approval.' }, { status: 403 });
      if (user.status === 'RESTRICTED') return NextResponse.json({ error: 'Your account is restricted. Contact support.' }, { status: 403 });
      if (user.status === 'BLOCKED') return NextResponse.json({ error: 'Your account is blocked. Contact support.' }, { status: 403 });
      name = user.fullName;
    }
    const token = await createSession({ email: normalized, role, name });
    const response = NextResponse.json({ ok: true, role });
    response.cookies.set('gtb_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
    return response;
  } catch { return NextResponse.json({ error: 'Unable to sign in.' }, { status: 500 }); }
}
