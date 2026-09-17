# Vault | global trust bank 

A secure, full-stack digital banking platform for modern personal and business banking. Built for speed, security, and scale with live transaction processing and account management.


## Features

### Authentication & Onboarding
- Secure account creation with KYC verification (Name, Email, Address, NIN/SSN)
- Encrypted authentication with JWT
- Account verification and approval flow

### Personal Banking Dashboard
- Smart greeting and financial overview
- Account management (Account number, real-time available balance)
- Domestic transfers & Wire transfers
- Full transaction history with advanced filtering
- Virtual & Physical Cards management
- Investment portfolio tracking
- Personal & Business Loan application
- Account settings & Profile management
- 24/7 Customer Support Center

### Admin Control Center
- Secure admin authentication via `ADMIN_EMAIL` & `ADMIN_PASSWORD`
- Customer lifecycle management: Approve, Restrict, Block, Delete accounts
- Balance management and transaction oversight
- Platform analytics and system overview Top up user balances
- Overview stats

## Tech Stack
- Framework: Next.js 14
- Language: TypeScript
- Database: PostgreSQL + Prisma ORM
- Styling: Tailwind CSS + shadcn/ui
- Auth: NextAuth / JWT
- Storage: Vercel Blob for secure document storage

## Setup

1. Clone the repo:
```bash
git clone https://github.com/kingzarry7-crypto/online-banking.git
cd online-banking
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` from `.env.example` and fill in values:
```bash
cp .env.example .env
```

4. Set up your Postgres database and update `DATABASE_URL`.

5. Generate Prisma client and push schema:
```bash
npm run db:generate
npm run db:push
```

6. Run dev server:
```bash
npm run dev
```

7. Open http://localhost:3000.

## Deploy on Vercel

1. Push code to GitHub (this repo).
2. In Vercel, import this GitHub repo as a new project.
3. Add environment variables in Vercel project settings:
- `DATABASE_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `JWT_SECRET`
- (Optional) `BLOB_READ_WRITE_TOKEN` for profile pictures
- (Optional) `NEXT_PUBLIC_APP_NAME`
4. Deploy.

## Important
