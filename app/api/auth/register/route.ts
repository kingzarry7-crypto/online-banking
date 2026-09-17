import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/demo-store';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.fullName || !data.email || !data.password || !data.address || !data.ssnOrNin) return NextResponse.json({ error: 'Complete every field.' }, { status: 400 });
    if (String(data.password).length < 6) return NextResponse.json({ error: 'Password must contain at least 6 characters.' }, { status: 400 });
    await registerUser(data);
    return NextResponse.json({ ok: true, message: 'Account request submitted for approval.' });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Registration failed.' }, { status: 400 });
  }
}
