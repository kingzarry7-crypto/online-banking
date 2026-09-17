# Online Banking Demo

A **demo** online banking application with a realistic-looking UI but **no real money** or real bank integrations. Built with Next.js 14 (App Router), TypeScript, Prisma, and Tailwind CSS.

## Features

### Public / Auth
- Register (name, email, password, address, SSN/NIN)
- Sign in
- Account pending approval flow

### User Dashboard
- Greeting based on time of day
- Account overview (account number, balance)
- Transfer (local, wire – simulated)
- Transaction history
- Credit card dashboard (simulated)
- Investments (simulated portfolio)
- Apply for loan
- Settings (upload profile picture; name/SSN/NIN read-only)
- Contact support (bankm3857@gmail.com)

### Admin Dashboard
- Login via exact `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`
- Approve/restrict/block/delete user accounts
- Top up user balances
- Overview stats

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

- This is a **simulation only**. No real money moves.
- Do not connect to real banking rails.
- Use strong, unique secrets in production.
