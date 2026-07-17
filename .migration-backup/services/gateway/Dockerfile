FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat curl
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY services/gateway/package.json ./services/gateway/
RUN pnpm install --filter @kunda/gateway... --no-frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY packages/shared-types ./packages/shared-types
COPY services/gateway ./services/gateway
COPY tsconfig.json ./
WORKDIR /app/services/gateway
RUN pnpm run build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/services/gateway/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 CMD curl -f http://localhost:4000/health || exit 1
CMD ["node", "dist/index.js"]
