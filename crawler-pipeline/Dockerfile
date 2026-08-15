# ============================================================
# Dockerfile cho Crawler Pipeline (HTTP-First, No-Browser)
# Build: docker build -t crawler-pipeline .
# Run:   docker compose up -d
# ============================================================

# --- Stage 1: Base image với Node.js 18 ---
FROM node:18-bookworm-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

# Tạo thư mục làm việc
WORKDIR /app

# --- Stage 2: Cài dependencies (cache layer) ---
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- Stage 3: Copy source code ---
COPY src/ ./src/
COPY tsconfig.json ./

# Tạo thư mục output
RUN mkdir -p /app/output

# --- Runtime config ---
ENV NODE_ENV=production

# Entry point: chạy queue worker (polling task từ Supabase)
CMD ["npx", "tsx", "src/index.ts", "crawl"]
