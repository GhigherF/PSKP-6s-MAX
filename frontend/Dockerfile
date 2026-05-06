# frontend/Dockerfile — многоэтапная сборка React
# Этап 1: сборка бандла
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build

# Этап 2: отдача статики через NGINX
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
# Конфиг для SPA (все маршруты → index.html)
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
