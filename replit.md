# Kunda Properties

A Gambian diaspora real-estate marketplace ported from a Vercel Turborepo into Replit's pnpm monorepo.

## Architecture

- **`artifacts/web`** — React + Vite buyer/seller frontend (preview path: `/`)
- **`artifacts/admin`** — React + Vite admin control panel (preview path: `/admin/`)
- **`artifacts/api-server`** — Express API server (preview path: `/api/`)
- **`artifacts/mockup-sandbox`** — Vite component preview server for Canvas

## Original source

`.migration-backup/` contains the original Turborepo:
- `apps/web` → ported to `artifacts/web`
- `apps/admin` → ported to `artifacts/admin`
- `apps/mobile` → Expo app, not yet ported
- `services/` — 6 Express microservices (auth, listings, escrow, documents, notifications, gateway) — not yet ported

## Backend status

The API server contains the active Express backend. Stripe, email, and KYC integrations require production configuration:
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `VITE_STRIPE_PUBLISHABLE_KEY`
- `PUBLIC_URL` and `PUBLIC_FRONTEND_URL`
- `RESEND_API_KEY`, `EMAIL_FROM`
- `UPLOAD_ALLOWED_HOSTS` for controlled document hosting

The original microservices remain in `.migration-backup/` for reference.

## Brand

- Primary: Kunda green (`#1a5c3e` = `kunda-700`)
- Accent: Sand gold (`#e0a03c` = `sand-400`)
- Display font: Playfair Display
- Body font: Inter

## User Preferences

- Keep custom Tailwind colors in `@theme inline` blocks (v4 syntax), not `tailwind.config.js`
- Use wouter for routing in all React apps
- API calls use relative `/api` base (routed by Replit proxy to api-server)
- Browser authentication uses HttpOnly cookies; configure `CORS_ORIGINS` explicitly in production
