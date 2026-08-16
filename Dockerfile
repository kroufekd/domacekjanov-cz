FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
COPY web/package.json ./web/package.json
COPY studio/package.json ./studio/package.json
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY web ./web
WORKDIR /app/web
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/web/public ./web/public
COPY --from=builder --chown=nextjs:nodejs /app/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/web/.next/static ./web/.next/static

# Obsah webu leží na připojeném svazku. Adresář musí v image existovat a patřit
# běžícímu uživateli - Docker z něj při prvním připojení převezme vlastnictví,
# jinak by kontejner pod uid 1001 do svazku nesměl zapisovat.
ENV CONTENT_DIR=/data
RUN mkdir -p /data/media /data/history && chown -R nextjs:nodejs /data
VOLUME /data

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "web/server.js"]
