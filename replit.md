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

The api-server is a placeholder. The 6 backend microservices in `.migration-backup/services/` depend on Prisma, Stripe, Cloudinary, Twilio, Firebase, and Smile Identity KYC — these are a follow-up task.

## Brand

- Primary: Kunda green (`#1a5c3e` = `kunda-700`)
- Accent: Sand gold (`#e0a03c` = `sand-400`)
- Display font: Playfair Display
- Body font: Inter

## User Preferences

- Keep custom Tailwind colors in `@theme inline` blocks (v4 syntax), not `tailwind.config.js`
- Use wouter for routing in all React apps
- API calls use relative `/api` base (routed by Replit proxy to api-server)
