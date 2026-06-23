# ====================================================================
# HotspotPay — Frontend Dockerfile
# Build multi-stage : pnpm install → Vite build → Nginx serve
# ====================================================================

# ── Stage 1 : Build ───────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copier les fichiers de dépendances
COPY package.json pnpm-lock.yaml ./

# Installer les dépendances (frozen lockfile = reproductible)
RUN pnpm install --frozen-lockfile

# Copier le code source
COPY . .

# Build production
RUN pnpm run build

# ── Stage 2 : Serveur Nginx ───────────────────────────────────────
FROM nginx:stable-alpine

# Copier le build React
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuration Nginx : SPA routing (fallback vers index.html)
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://backend-java:8080; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
