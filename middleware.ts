import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/dashboard') && !pathname.startsWith('/admin')) return NextResponse.next();
  const session = await readSession(request.cookies.get('gtb_session')?.value);
  if (!session) return NextResponse.redirect(new URL('/auth/signin', request.url));
  if (pathname.startsWith('/admin') && session.role !== 'ADMIN') return NextResponse.redirect(new URL('/dashboard', request.url));
  if (pathname.startsWith('/dashboard') && session.role !== 'USER') return NextResponse.redirect(new URL('/admin', request.url));
  return NextResponse.next();
}
export const config = { matcher: ['/dashboard/:path*', '/admin/:path*'] };
