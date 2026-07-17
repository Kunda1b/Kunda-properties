---
name: Kunda port decisions
description: Key choices made when porting the Vercel Turborepo to Replit pnpm workspace
---

## Monorepo Structure
- `artifacts/web` — React + Vite buyer portal (port from `$PORT`)
- `artifacts/admin` — React + Vite admin dashboard
- `artifacts/api-server` — Express + Drizzle API, builds via `build.mjs` (esbuild)
- `lib/db` — shared DB package (`@workspace/db`), schema at `lib/db/src/schema/`

## Frontend API Routing
- Vite proxy: `/api` → api-server port
- All API calls use `axios` with base `/api` — no hardcoded localhost
- Auth store in `artifacts/web/src/lib/store/auth.store.ts` — `setTokens`, `loginSuccess`, `logout`

## Routes in App.tsx (web)
- Public: `/`, `/listings`, `/listings/:id`, `/auth/login`, `/auth/register`, `/auth/callback`
- Dashboard (auth-gated): `/dashboard`, `/dashboard/listings`, `/dashboard/listings/new`, `/dashboard/offers`, `/dashboard/escrow`, `/dashboard/kyc`, `/dashboard/documents`, `/dashboard/notifications`, `/dashboard/profile`
- `DashboardLayout` redirects to `/auth/login` if no user in auth store

## Auth Callback Page
- `/auth/callback` reads `?access=TOKEN&refresh=TOKEN` from URL
- Calls `authApi.getMe()` after storing tokens, then `loginSuccess()` and redirects to `/dashboard`

## Notification Bell
- Both `Navbar.tsx` and `DashboardNav.tsx` poll `/api/notifications?limit=1` every 30s
- Use `unreadCount` from response to show badge
- Shared React Query key: `["notif-count"]`

## Listing Videos Relation Fix
- `lib/db/src/schema/listings.ts` needed `listingVideosRelations` (inverse of `listingsRelations.videos: many(listingVideos)`)
- Without it, Drizzle throws "not enough information to infer relation" at query time

## Design System Classes
- `btn-primary`, `btn-outline`, `input-field`, `badge` — defined in `index.css`
- `font-display` = Cormorant Garamond (serif display)
- Colors: `kunda-*` (green), `sand-*` (warm gold)
