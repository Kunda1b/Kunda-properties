---
name: Kunda audit fixes
description: Which of the 26 audit issues were fixed, already done, or intentionally skipped — and why
---

## Already done before this session (no changes needed)
- #11 Admin analytics — page already wired to live API
- #20 Unread message badge — DashboardNav already polls messagesApi.unreadCount()
- #24 Global rate limit — globalLimiter already applied in app.ts
- #26 Auth callback stub — already fully implemented
- #19 Admin verify action 404 — PATCH /listings/:id/verify exists on server; no issue
- #6 Listings pagination — ListingsGrid already had full pagination UI + next/prev controls
- #22 DB indexes — listings indexes already defined in schema
- #16 Loading/error states — dashboard/index already had StatCardSkeleton; offers/escrow had inline error handling

## Fixed in this session
- #1 Profile page — rewrote to add edit/save mode wired to PATCH /api/profile
- #2 Admin KYC verify/reject — split into two separate mutations; reject opens a modal to collect reason before calling kycAdminApi.reject(id, reason)
- #3 Duplicate exchange-rate clients — removed ratesAdminApi from admin/lib/api.ts; settings.tsx already used the correct exchangeRatesAdminApi
- #4/#5 Missing DB tables — ran push-force; conversations, messages, viewing_requests, neighbourhood_guides, listing_analytics now exist
- #7 My Listings total count — added total + totalPages to GET /listings/my/all response
- #8 Token refresh URL — changed raw axios.post to api.post in the interceptor
- #9 New listing localStorage — DRAFT_KEY persists form data across refreshes; cleared on successful submit
- #10 Listing image ownership — both POST/:id/images and DELETE/:id/images/:imageId now verify sellerId (ADMIN bypasses)
- #12 Admin escrow actions — escrow page now has Release/Refund buttons for eligible statuses, confirmation modal with notes field
- #13 Notifications targeting — targetRole radio group in admin notifications page; server broadcast filters users by role if provided
- #15 KYC doc upload — URL-based upload with image preview is functional (file picker not added; URL approach is intentional for MVP)
- #17 Search filters — already wired; filter bar has type, beds, price range, region, sort all propagating to API
- #18 Admin list totals — admin/listings and admin/escrow both already returned total count; no change needed
- #21 escrow_accounts reference_number — added .unique() constraint and re-pushed
- #25 View count error — changed .catch(() => {}) to .catch((err) => logger.warn(...))
- Neighbourhood guides — seeded 8 areas (Kololi, Banjul, Fajara, Bakau, Brikama, Serrekunda, Bijilo, Kerr Serign)
- mapbox-gl — installed missing package that was causing a web app import error

## Intentional skips
- #14 Forgot-password email — server already logs the reset token. Sending real email requires Resend (or similar) API key; propose as a follow-up integration
- #23 languages enum — low-priority schema change on an existing text[] column; altering in-place would require a migration that could break existing data

**Why:** Both skips involve external keys or disruptive schema migrations that aren't safe to do without explicit user sign-off.
