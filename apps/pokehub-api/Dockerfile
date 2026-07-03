# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY nx.json tsconfig.base.json ./

# Copy all source code
COPY apps ./apps
COPY packages ./packages
# tools/ holds the local Nx plugin (@pokehub/workspace-plugin) registered in
# nx.json; every nx command loads it, so it must be in the build context.
COPY tools ./tools

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
