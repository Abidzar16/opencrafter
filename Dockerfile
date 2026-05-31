FROM node:22-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

# --- nginx stage ---

FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-entrypoint.sh /docker-entrypoint.d/50-proxy-toggle.sh

RUN chmod +x /docker-entrypoint.d/50-proxy-toggle.sh

EXPOSE 80
