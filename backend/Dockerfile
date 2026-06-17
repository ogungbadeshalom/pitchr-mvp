FROM node:20-alpine AS builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --include=dev
COPY backend/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/src ./src
EXPOSE 5001
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
