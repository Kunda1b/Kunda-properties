FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/admin/package.json ./apps/admin/
RUN pnpm install --filter @kunda/admin... --no-frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY packages/shared-types ./packages/shared-types
COPY apps/admin ./apps/admin
WORKDIR /app/apps/admin
RUN pnpm run build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/apps/admin/.next/standalone ./
COPY --from=builder /app/apps/admin/.next/static ./apps/admin/.next/static
EXPOSE 3001
ENV PORT=3001
CMD ["node", "apps/admin/server.js"]
