# Stage 1: Build Vite frontend & bundle the server
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Stage 2: Production environment
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
# Install only production dependencies (this includes pg and node-pg-migrate)
RUN npm install --omit=dev --legacy-peer-deps

# Copy build artifacts and migration scripts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations

# Expose server port
EXPOSE 3000
ENV NODE_ENV=production

# Run database migrations first, then start the Express server
CMD ["sh", "-c", "npx node-pg-migrate up && node dist/server.cjs"]
