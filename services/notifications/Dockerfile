FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat curl
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY packages/database/package.json ./packages/database/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY services/notifications/package.json ./services/notifications/
RUN pnpm install --filter @kunda/notifications-service... --no-frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY packages/database ./packages/database
COPY packages/shared-types ./packages/shared-types
COPY services/notifications ./services/notifications
COPY tsconfig.json ./
RUN cd packages/database && npx prisma generate
WORKDIR /app/services/notifications
RUN pnpm run build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/services/notifications/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database/prisma ./prisma
EXPOSE 4005
ENV PORT=4005
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 CMD curl -f http://localhost:4005/health || exit 1
CMD ["node", "dist/index.js"]
