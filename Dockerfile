FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install dependencies
RUN cd server && npm install
RUN cd client && npm install

# Copy source files
COPY server ./server
COPY client ./client

# Build both client and server
RUN cd client && npm run build
RUN cd server && npm run build

# Production runner image
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY package.json ./
COPY --from=builder /app/server/package.json ./server/
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

# Volume mount point for SQLite database persistence
VOLUME ["/app/server/data"]

EXPOSE 3001

CMD ["node", "server/dist/index.js"]
