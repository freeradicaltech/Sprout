# --- Build stage ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

# --- Runtime stage ---
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/build ./build
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
VOLUME ["/data"]
ENV DATABASE_URL="file:/data/sprout.db"
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "build"]
