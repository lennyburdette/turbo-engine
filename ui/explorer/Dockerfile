# --- Build stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm.
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy package files for dependency caching.
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# Copy source and build.
COPY . .
RUN pnpm build

# --- Runtime stage ---
FROM nginx:1.27-alpine

# Copy built assets to nginx.
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA fallback: route all paths to index.html.
RUN printf 'server {\n\
  listen 3001;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location / {\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
  location /healthz {\n\
    access_log off;\n\
    return 200 "ok";\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 3001

CMD ["nginx", "-g", "daemon off;"]
