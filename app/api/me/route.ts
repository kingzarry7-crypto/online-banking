import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readSession } from '@/lib/auth';
import { getTransactions, getUser } from '@/lib/demo-store';

export const runtime = 'nodejs';
export async function GET() {
  const session = await readSession(cookies().get('gtb_session')?.value);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role === 'ADMIN') return NextResponse.json({ role: 'ADMIN', name: session.name });
  const user = await getUser(session.email); if (!user) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  return NextResponse.json({ role: 'USER', user: { ...user, passwordHash: undefined, ssnOrNin: `••••${user.ssnOrNin.slice(-4)}` }, transactions: await getTransactions(user.email) });
}
