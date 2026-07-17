---
name: Kunda port decisions
description: Architecture and CSS decisions made when porting Kunda Properties (Vercel Turborepo → Replit pnpm workspace)
---

## Routing
- Web app at `/` (previewPath `/`), admin at `/admin/` (previewPath `/admin/`)
- Screenshot tool: pass `path` RELATIVE to previewPath — admin login is `path: "/login"` not `/admin/login`
- Wouter router in admin uses `base={import.meta.env.BASE_URL.replace(/\/$/, "")}`
- `router.push(...)` → `const [, setLocation] = useLocation(); setLocation("/path")`
- `usePathname()` → `useLocation()[0]`

## Tailwind v4 theme
- Custom colors live in `@theme inline` as `--color-kunda-*` / `--color-sand-*` CSS variables
- ALL shade steps used in `@apply` directives MUST be defined in `@theme inline` — missing a shade (e.g. `kunda-500`) causes a Vite build error: "Cannot apply unknown utility class"
- Font families: `--font-display: 'Playfair Display'`; add Google Font link to `index.html`

## API / backend
- No backend microservices ported yet — 6 Express services remain in `.migration-backup/services/`
- Frontend API calls use relative base `""` so `/api/*` routes through Replit proxy to api-server artifact
- `VITE_API_URL` env var overrides the base URL for external API

## Admin app specifics
- `react-hot-toast` used for toasts (not shadcn Toaster)
- `recharts` installed for analytics charts
- Admin store (`useAdminStore`) uses `localStorage` key `kunda-admin-auth`

**Why:** Straight port, no OpenAPI codegen — axios calls api-server directly, same pattern as the original Next.js app calling the gateway at port 4000.
