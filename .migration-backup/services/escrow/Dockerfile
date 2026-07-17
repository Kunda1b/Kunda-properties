FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat curl
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY packages/database/package.json ./packages/database/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY services/escrow/package.json ./services/escrow/
RUN pnpm install --filter @kunda/escrow-service... --no-frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY packages/database ./packages/database
COPY packages/shared-types ./packages/shared-types
COPY services/escrow ./services/escrow
COPY tsconfig.json ./
RUN cd packages/database && npx prisma generate
WORKDIR /app/services/escrow
RUN pnpm run build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/services/escrow/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database/prisma ./prisma
EXPOSE 4003
ENV PORT=4003
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 CMD curl -f http://localhost:4003/health || exit 1
CMD ["node", "dist/index.js"]
