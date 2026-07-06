FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat curl
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY packages/database/package.json ./packages/database/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY services/listings/package.json ./services/listings/
RUN pnpm install --filter @kunda/listings-service... --no-frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY packages/database ./packages/database
COPY packages/shared-types ./packages/shared-types
COPY services/listings ./services/listings
COPY tsconfig.json ./
RUN cd packages/database && npx prisma generate
WORKDIR /app/services/listings
RUN pnpm run build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/services/listings/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database/prisma ./prisma
EXPOSE 4002
ENV PORT=4002
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 CMD curl -f http://localhost:4002/health || exit 1
CMD ["node", "dist/index.js"]
