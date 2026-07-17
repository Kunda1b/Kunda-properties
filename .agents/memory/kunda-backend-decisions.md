---
name: Kunda backend decisions
description: Consolidated api-server architecture, DB schema, and stub decisions
---

## Architecture
- Express + Drizzle ORM + PostgreSQL
- JWT auth (access + refresh tokens), SESSION_SECRET doubles as JWT secret
- All routes prefixed `/api/` via Replit proxy

## Key Routes Registered
- `/api/auth` — login, register, refresh, me, Google OAuth (`/auth/google`, `/auth/google/callback`)
- `/api/listings` — CRUD, images, submit-review, my/all
- `/api/search` — search, featured, stats, similar
- `/api/offers` — make, respond, my (with `?role=buyer|seller`)
- `/api/escrow` — initiate, payment-intent, approve-release, dispute, my
- `/api/kyc` — status, submit, upload-document
- `/api/notifications` — GET (with `?limit`), PATCH read
- `/api/documents` — CRUD, signed-URL stub
- `/api/saved` — save/unsave listings

## DB Schema Gotchas
- `listingVideos` table has `listingVideosRelations` in `lib/db/src/schema/listings.ts` — required the inverse relation (`one(listings)`) to be added manually, otherwise Drizzle throws "not enough information to infer relation" at runtime
- `GET /escrow/my` must return `{ escrows: [...] }` wrapper (not bare array)
- `GET /offers/my` returns `{ offers: [...] }` filtered by `?role=buyer|seller`

## KYC Gating
- `POST /offers` and `POST /escrow` check `kycRecords.status === "VERIFIED"`, return `403 KYC_REQUIRED` if not

## Notifications
- Async `notify()` helper in `src/lib/notify.ts` — failures never block routes
- Type `IN_APP`, status `SENT` (unread) → `READ`
- Frontend polls every 30s via React Query `refetchInterval`

## Google OAuth
- Gracefully stubs if `GOOGLE_CLIENT_ID` env var absent (returns 501)
- Full flow: `/api/auth/google` → Google → `/api/auth/google/callback` → `${frontendBase}/auth/callback?access=TOKEN&refresh=TOKEN`
- New users created with `passwordHash: GOOGLE_OAUTH_${sub}`, `role: BUYER`

## Image Upload
- API `POST /listings/:id/images` accepts `{ url, isPrimary, order }` (not array)
- Cloudinary not configured — URL inputs only

## Document Signed URLs
- `GET /documents/:id/url` returns `fileUrl` directly (stub; production would generate S3 signed URL)

## Seed Data
- 3 users (buyer: buyer@kunda.gm / Test1234!, seller: seller@kunda.gm / Test1234!, admin: admin@kunda.gm / Admin1234!)
- 8 listings with images, 6 exchange rates
