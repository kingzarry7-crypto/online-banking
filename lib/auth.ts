import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'change-this-demo-secret-before-production');

export type Session = { email: string; role: 'USER' | 'ADMIN'; name?: string };

export async function createSession(session: Session) {
  return new SignJWT(session).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(secret);
}

export async function readSession(token?: string): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.email !== 'string' || (payload.role !== 'USER' && payload.role !== 'ADMIN')) return null;
    return { email: payload.email, role: payload.role, name: typeof payload.name === 'string' ? payload.name : undefined };
  } catch {
    return null;
  }
}
