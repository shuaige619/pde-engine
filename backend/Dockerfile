# ==========================================
# PDE Engine Backend Dockerfile
# Multi-stage build for optimized production image
# ==========================================

# ---------- Base Stage ----------
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache wget
COPY package.json ./
COPY prisma ./prisma/

# ---------- Dependencies Stage ----------
FROM base AS dependencies
RUN npm install

# ---------- Development Stage ----------
FROM base AS development
ENV NODE_ENV=development
ENV PORT=3000
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---------- Build Stage ----------
FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ---------- Production Stage ----------
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN apk add --no-cache wget curl
COPY package.json ./
COPY prisma ./prisma/
RUN npm install --omit=dev && npx prisma generate
COPY --from=build /app/dist ./dist
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=30s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
USER node
CMD ["node", "dist/index.js"]
