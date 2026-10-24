# Production Multi-Stage Container for ScopeGuard Cockpit
# Built for Google Cloud Run deployment (GitLab Transcend +0.2 bonus)

# Stage 1: Build the Vite production assets and CLI
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Minimal static production server
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config for SPA routing and Cloud Run PORT binding
RUN echo 'server {' > /etc/nginx/conf.d/default.conf && \
    echo '  listen 8080;' >> /etc/nginx/conf.d/default.conf && \
    echo '  server_name localhost;' >> /etc/nginx/conf.d/default.conf && \
    echo '  location / {' >> /etc/nginx/conf.d/default.conf && \
    echo '    root /usr/share/nginx/html;' >> /etc/nginx/conf.d/default.conf && \
    echo '    index index.html;' >> /etc/nginx/conf.d/default.conf && \
    echo '    try_files $uri $uri/ /index.html;' >> /etc/nginx/conf.d/default.conf && \
    echo '  }' >> /etc/nginx/conf.d/default.conf && \
    echo '}' >> /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
