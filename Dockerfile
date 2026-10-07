# ---- deps ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build ----
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# `npm run build` ejecuta `prisma generate` y `next build` (standalone).
RUN npm run build && npm run db:seed:bundle

# ---- cli ----
# CLI de Prisma (migraciones) con sus dependencias, aparte del bundle de Next.
FROM node:22-bookworm-slim AS cli
WORKDIR /cli
COPY package.json ./
RUN npm init -y >/dev/null \
  && npm install --omit=dev --no-audit --no-fund "prisma@$(node -p "require('./package.json').devDependencies.prisma")" "dotenv@$(node -p "require('./package.json').devDependencies.dotenv")"

# ---- runtime ----
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && apt-get clean \
  && groupadd -r nodejs && useradd -r -g nodejs -d /app nextjs
# Web (salida standalone de Next)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Migraciones y seed: esquema + CLI de Prisma (superpuesto a node_modules del standalone) + seed empaquetado
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/.seed ./.seed
COPY --from=cli --chown=nextjs:nodejs /cli/node_modules ./node_modules
COPY deploy/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh && mkdir -p /app/data/uploads && chown -R nextjs:nodejs /app/data
ENV DATA_DIR=/app/data
USER nextjs
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
