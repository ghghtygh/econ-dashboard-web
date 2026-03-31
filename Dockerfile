# ---- Build Stage ----
FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_APP_ENV=production
ENV VITE_APP_ENV=$VITE_APP_ENV
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --mode $VITE_APP_ENV

# ---- Runtime Stage ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# nginx:alpine 이미지는 /etc/nginx/templates/ 디렉터리를 자동으로 envsubst 처리 후
# /etc/nginx/conf.d/ 에 위치시킵니다. API_HOST / API_PORT 환경변수로 프록시 주소를 설정합니다.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80
