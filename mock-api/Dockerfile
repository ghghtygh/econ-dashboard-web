FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js cache.js ./
COPY adapters ./adapters
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
