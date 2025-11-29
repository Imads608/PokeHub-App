# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY nx.json tsconfig.base.json ./

# Copy all source code
COPY apps ./apps
COPY packages ./packages

# Install dependencies
RUN npm install

# Build the API
RUN npx nx build pokehub-api --configuration=production

# Runtime stage
FROM node:20-alpine AS runtime

WORKDIR /app/pokehub-api

# Copy built application
COPY --from=builder /app/dist/apps/pokehub-api ./

# Install only production dependencies
RUN npm install --only=production

EXPOSE 3000

CMD ["node", "main.js"]
