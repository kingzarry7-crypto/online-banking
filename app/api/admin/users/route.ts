import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readSession } from '@/lib/auth';
import { adminAction, getUsers } from '@/lib/demo-store';

export const runtime = 'nodejs';
async function isAdmin() { const session = await readSession(cookies().get('gtb_session')?.value); return session?.role === 'ADMIN'; }
export async function GET() { if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); const users = await getUsers(); return NextResponse.json({ users: users.map(({ passwordHash, ssnOrNin, ...user }) => ({ ...user, ssnOrNin: `••••${ssnOrNin.slice(-4)}` })) }); }
export async function POST(request: Request) { if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); try { const input = await request.json(); const user = await adminAction(input); return NextResponse.json({ ok: true, user }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Action failed' }, { status: 400 }); } }
