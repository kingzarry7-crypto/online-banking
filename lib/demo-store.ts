import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';

export type AccountStatus = 'PENDING' | 'ACTIVE' | 'RESTRICTED' | 'BLOCKED';
export type DemoUser = { id: string; fullName: string; email: string; passwordHash: string; address: string; ssnOrNin: string; status: AccountStatus; accountNumber?: string; balance: number; createdAt: string };
export type DemoTransaction = { id: string; userEmail: string; type: string; amount: number; description: string; createdAt: string };
type Store = { users: DemoUser[]; transactions: DemoTransaction[] };

const file = path.join('/tmp', 'global-trust-bank-demo.json');
const empty: Store = { users: [], transactions: [] };

async function read(): Promise<Store> {
  try { return JSON.parse(await fs.readFile(file, 'utf8')) as Store; } catch { return empty; }
}
async function write(data: Store) { await fs.writeFile(file, JSON.stringify(data, null, 2)); }

export async function registerUser(input: { fullName: string; email: string; password: string; address: string; ssnOrNin: string }) {
  const store = await read();
  const email = input.email.trim().toLowerCase();
  if (store.users.some((u) => u.email === email)) throw new Error('An account with this email already exists.');
  const user: DemoUser = { id: crypto.randomUUID(), fullName: input.fullName.trim(), email, passwordHash: await bcrypt.hash(input.password, 10), address: input.address.trim(), ssnOrNin: input.ssnOrNin.trim(), status: 'PENDING', balance: 0, createdAt: new Date().toISOString() };
  store.users.push(user); await write(store); return user;
}

export async function verifyUser(email: string, password: string) {
  const store = await read();
  const user = store.users.find((u) => u.email === email.trim().toLowerCase());
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return null;
  return user;
}

export async function getUser(email: string) { const store = await read(); return store.users.find((u) => u.email === email.toLowerCase()) ?? null; }
export async function getUsers() { const store = await read(); return store.users; }
export async function getTransactions(email: string) { const store = await read(); return store.transactions.filter((t) => t.userEmail === email.toLowerCase()).sort((a,b) => b.createdAt.localeCompare(a.createdAt)); }

export async function adminAction(input: { userId: string; action: 'approve' | 'restrict' | 'block' | 'delete' | 'topup'; amount?: number }) {
  const store = await read(); const user = store.users.find((u) => u.id === input.userId);
  if (!user) throw new Error('User not found.');
  if (input.action === 'delete') { store.users = store.users.filter((u) => u.id !== input.userId); store.transactions = store.transactions.filter((t) => t.userEmail !== user.email); await write(store); return null; }
  if (input.action === 'approve') { user.status = 'ACTIVE'; user.accountNumber ??= String(Math.floor(1000000000 + Math.random() * 9000000000)); }
  if (input.action === 'restrict') user.status = 'RESTRICTED';
  if (input.action === 'block') user.status = 'BLOCKED';
  if (input.action === 'topup') { const amount = Number(input.amount); if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter a valid top-up amount.'); user.balance = Number((user.balance + amount).toFixed(2)); store.transactions.push({ id: crypto.randomUUID(), userEmail: user.email, type: 'TOP_UP', amount, description: 'Admin demo balance top-up', createdAt: new Date().toISOString() }); }
  await write(store); return user;
}
