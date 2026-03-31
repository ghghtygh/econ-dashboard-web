# ---- Build Stage ----
FROM node:22-alpine AS build
ARG BUILD_ENV=production
ENV VITE_APP_ENV=${BUILD_ENV}
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --mode ${BUILD_ENV}

# ---- Runtime Stage ----
FROM nginx:alpine
ARG BUILD_ENV=production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template nginx.conf.qa.template /tmp/
RUN mkdir -p /etc/nginx/templates && \
    if [ "${BUILD_ENV}" = "qa" ]; then \
      cp /tmp/nginx.conf.qa.template /etc/nginx/templates/default.conf.template; \
    else \
      cp /tmp/nginx.conf.template /etc/nginx/templates/default.conf.template; \
    fi
ENV API_HOST=api
ENV API_PORT=8080

EXPOSE 80
