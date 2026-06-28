# ── Build stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# ── Runtime stage (Nginx) ──────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Copier le build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier la config Nginx avec proxy API vers Java
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 5173;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/xml image/svg+xml;
    gzip_min_length 1000;

    # SPA — toutes les routes vers index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API vers Java Spring Boot
    location /api/ {
        proxy_pass http://backend-java:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache static
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]
