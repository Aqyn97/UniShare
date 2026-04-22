# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

COPY . .

# VITE_API_URL must be passed at build time via Railway build variable
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: serve with nginx ─────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/app.conf

COPY --from=builder /app/dist /usr/share/nginx/html

# Railway injects PORT; nginx listens on it via envsubst
ENV PORT=80

EXPOSE 80

# Replace $PORT placeholder in nginx config at container start, then run nginx
CMD ["/bin/sh", "-c", "envsubst '$PORT' < /etc/nginx/conf.d/app.conf > /tmp/app.conf && cp /tmp/app.conf /etc/nginx/conf.d/app.conf && nginx -g 'daemon off;'"]
