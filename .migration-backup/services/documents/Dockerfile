FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat curl
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY packages/database/package.json ./packages/database/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY services/documents/package.json ./services/documents/
RUN pnpm install --filter @kunda/documents-service... --no-frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY packages/database ./packages/database
COPY packages/shared-types ./packages/shared-types
COPY services/documents ./services/documents
COPY tsconfig.json ./
RUN cd packages/database && npx prisma generate
WORKDIR /app/services/documents
RUN pnpm run build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/services/documents/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database/prisma ./prisma
EXPOSE 4004
ENV PORT=4004
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 CMD curl -f http://localhost:4004/health || exit 1
CMD ["node", "dist/index.js"]
