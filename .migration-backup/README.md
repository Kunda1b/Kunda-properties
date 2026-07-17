# Kunda Properties 🇬🇲

> **The trusted property platform connecting the Gambian diaspora to real estate back home.**
> Secure escrow, KYC-verified transactions, and verified listings — all in one place.

---

## Monorepo Structure

This is a **pnpm + Turborepo** monorepo.

```
kunda-properties/
├── apps/
│   ├── web/          # Next.js 14 — public-facing web app (port 3000)
│   ├── admin/         # Next.js 14 — admin control panel (port 3001)
│   └── mobile/        # React Native (Expo) — iOS/Android app
├── services/
│   ├── gateway/       # API Gateway — proxies + auth check (port 4000)
│   ├── auth/          # Auth, KYC, admin stats/users/audit (port 4001)
│   ├── listings/       # Listings, search, images, admin moderation (port 4002)
│   ├── escrow/        # Escrow, offers, Stripe, admin disputes (port 4003)
│   ├── documents/     # Document upload/verification (port 4004)
│   └── notifications/  # Email/SMS/Push, admin broadcast (port 4005)
├── packages/
│   ├── database/       # Prisma schema + client (shared by all services)
│   └── shared-types/    # TypeScript types shared across all apps
├── infrastructure/
│   ├── docker/          # Postgres init scripts
│   └── nginx/           # Reverse proxy config (public + admin subdomain)
├── docker-compose.yml
├── pnpm-workspace.yaml
└── turbo.json
```

---

## Why pnpm

This monorepo uses **pnpm** instead of npm:

- **Disk efficiency** — packages are stored once in a global content-addressable store and hard-linked into each `node_modules`, instead of duplicated per-package like npm/yarn classic.
- **Strict by default** — pnpm's non-flat `node_modules` prevents "phantom dependencies" (importing a package you never declared just because a sibling package hoisted it).
- **Fast installs** — linking from the store is dramatically faster than re-downloading/copying on every install.
- **Native workspace protocol** — `workspace:*` in `package.json` guarantees internal packages (`@kunda/database`, `@kunda/shared-types`) always resolve to the local workspace version, never accidentally to a published npm version.

All Dockerfiles use `corepack enable && corepack prepare pnpm@9.1.0` so builds are reproducible without a separate pnpm install step.

---

## Getting Started

### Prerequisites
- Node.js ≥ 20
- pnpm ≥ 9 (`npm install -g pnpm`)
- Docker & Docker Compose

### 1. Install

```bash
cp .env.example .env   # fill in Stripe, Cloudinary, Smile Identity, etc.
pnpm install
```

### 2. Start infrastructure

```bash
pnpm docker:up          # starts Postgres + Redis only (via docker-compose, services excluded by profile if you set one, or just run postgres/redis manually)
docker compose up -d postgres redis
```

### 3. Database

```bash
pnpm db:migrate:dev     # creates tables
pnpm db:seed            # demo users + listings
```

### 4. Run everything

```bash
pnpm dev
```

This starts all apps and services in parallel via Turborepo:

| Service | Port | URL |
|---|---|---|
| Web app | 3000 | http://localhost:3000 |
| **Admin dashboard** | 3001 | **http://localhost:3001** |
| API Gateway | 4000 | http://localhost:4000 |
| Auth service | 4001 | internal |
| Listings service | 4002 | internal |
| Escrow service | 4003 | internal |
| Documents service | 4004 | internal |
| Notifications service | 4005 | internal |

### 5. Mobile app

```bash
cd apps/mobile
pnpm start
```

### Full Docker build (production-like)

```bash
pnpm docker:build       # docker compose up -d --build — builds & runs all 9 containers
```

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@kundaproperties.gm` | `Admin@Kunda2024!` |
| Agent | `agent@kundaproperties.gm` | `Agent@Kunda2024!` |
| Buyer | `buyer@example.com` | `Buyer@Kunda2024!` |

---

## Admin Dashboard

A separate Next.js app (`apps/admin`) running on **port 3001**, built for platform operators.

### Access
- Dev: http://localhost:3001
- Prod: `https://admin.kundaproperties.gm` (separate subdomain, see nginx config)

Sign in with an `ADMIN`-role account. Only `ADMIN` accounts can log in — the login form checks the role client-side, and every admin API route re-verifies the role server-side independently on its backing service.

### Pages

| Page | What it does |
|---|---|
| **Dashboard** | KPI cards (users, listings, escrow volume, revenue), escrow volume chart, listings-by-type pie chart, escrow funnel, live activity feed |
| **Analytics** | Revenue trend, diaspora country breakdown, price distribution, deeper charts than the dashboard |
| **Users** | Searchable/filterable user table, suspend/reactivate, promote buyer → agent |
| **KYC Review** | Queue of submitted verifications, approve/reject with reason, document preview |
| **Listings** | Pending-review queue + full listing table, approve/reject/suspend/feature |
| **Escrow** | All transactions, filter by status, force-release or force-refund (with Stripe call + admin notes) for disputed/stuck escrows |
| **Documents** | Verify or reject uploaded title deeds, KYC docs, etc. |
| **Notifications** | Compose and broadcast to All/Buyers/Sellers via In-App, Email, or SMS |
| **Audit Logs** | Immutable log of every admin action (who, what, when, from what IP) |
| **Settings** | Platform fee %, inspection period, exchange rate editor |

### How admin auth flows through the system

1. Admin logs in at `apps/admin` → hits `POST /api/auth/login` on the **gateway**, which proxies to the **auth service**.
2. Gateway routes `/api/admin/*` through `authenticate` middleware (validates JWT) then proxies to the correct backing service (`/admin/listings` → listings service, `/admin/escrow` → escrow service, everything else → auth service).
3. **Each backing service independently re-checks `role === ADMIN`** via `requireRole("ADMIN")` before running any query. The gateway check is a first gate, not the only one — defence in depth.
4. Every mutating admin action writes an `AuditLog` row (`userId`, `action`, `resource`, `resourceId`, before/after values).

### Adding a new admin page

1. Add the query/mutation logic to the relevant service's `src/routes/admin*.routes.ts`.
2. If it's a new service area, add the gateway proxy rule in `services/gateway/src/index.ts`.
3. Add the method to `apps/admin/lib/api.ts` (`adminApi.yourMethod`).
4. Create `apps/admin/app/your-page/page.tsx`.
5. Add the nav entry in `apps/admin/components/layout/AdminSidebar.tsx`.

---

## Escrow Flow

```
Buyer makes offer → Seller accepts → Escrow initiated
    → Buyer creates Stripe PaymentIntent → Payment processed → status: FUNDED
    → 14-day inspection period
    → Buyer approves → funds transferred to seller (Stripe Connect) → status: RELEASED
    → Listing marked SOLD
                          ↘ Either party disputes → status: DISPUTED
                                → Admin reviews in /escrow → force-release or force-refund
```

---

## Environment Variables

See `.env.example` for the full list. Key ones:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Token signing — `openssl rand -base64 64` |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Escrow payments |
| `CLOUDINARY_*` | Listing images + document storage |
| `SMILE_IDENTITY_*` | KYC verification |
| `SENDGRID_API_KEY` / `TWILIO_*` | Notification delivery |
| `CORS_ORIGINS` | Comma-separated list — must include both `:3000` (web) and `:3001` (admin) |

---

## License

MIT © Kunda Properties
