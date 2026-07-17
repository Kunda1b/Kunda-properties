---
name: Kunda backend decisions
description: How the 6 original microservices were consolidated into a single Express api-server with Drizzle + Postgres
---

## Architecture
- All 6 microservices (auth, listings, escrow, documents, notifications, gateway) merged into `artifacts/api-server`
- Prisma schema converted to Drizzle v2 in `lib/db/src/schema/` — split into `users.ts`, `kyc.ts`, `listings.ts`, `escrow.ts`, `misc.ts`
- Schema pushed via `pnpm --filter @workspace/db run push-force`

## JWT Secrets
- `SESSION_SECRET` env var used as `JWT_SECRET` (access tokens, 15m)
- `SESSION_SECRET + "_refresh"` used as refresh secret (7d)
- No token blacklisting (no Redis) — refresh rotation via DB session revocation

## Stubbed external services
- **Smile Identity (KYC)**: KYC submissions auto-marked `SUBMITTED` for manual admin review
- **Stripe**: Payment intent creation returns a stub client secret; escrow auto-marked `FUNDED`
- **Cloudinary**: Images accepted as plain URLs — no upload processing
- **Email (Nodemailer)**: All email sends are logged only; forgot-password returns 400 stub
- **Redis**: Not wired — token blacklisting omitted; refresh rotation uses DB sessions table

**Why:** These all require external API keys and billing accounts that aren't set up yet. The stubs let the full flow work in dev without breaking the contract.

## Route structure under `/api`
- `/auth` — register, login, logout, refresh, me, forgot-password
- `/kyc` — status, submit, upload-document
- `/profile` — get, patch, patch preferences
- `/listings` — CRUD + submit-review + image management
- `/search` — search, featured, stats, similar
- `/saved` — get, post, delete
- `/offers` — my, make offer, respond
- `/escrow` — my, get, initiate, payment-intent, approve-release, dispute
- `/admin` — stats, analytics, users, kyc, listings, escrow, documents, notifications, audit-logs, exchange-rates

## Seed data
- Seller user: `seller@kunda.gm` (id: `00000000-0000-0000-0000-000000000001`)
- Admin user: `admin@kunda.gm` / `Admin1234` — promoted to ADMIN via SQL
- Buyer user: `test@kunda.gm` / `Password123`
- 8 seed listings (all ACTIVE) with Unsplash images

## Dev-only behavior
- `NODE_ENV !== 'production'`: new registrations auto-mark `isEmailVerified = true`
- `app.set('trust proxy', 1)` set for rate limiter to see real IPs through Replit proxy

## executeSql notes
- PostgreSQL array literals: `ARRAY['val1','val2']::text[]` — NOT `ARRAY{...}`
- `psql` CLI not on PATH in Replit shell — use `executeSql()` callback in CodeExecution
