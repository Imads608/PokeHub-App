# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY nx.json tsconfig.base.json ./

# Copy config files needed for lint, test, and build
COPY .eslintrc.json jest.preset.js jest.config.ts tailwind.config.js ./

# Copy all source code
COPY apps ./apps
COPY packages ./packages

# Install dependencies
RUN npm install

# Build arguments for Next.js
ARG NEXT_PUBLIC_POKEHUB_API_URL
ENV NEXT_PUBLIC_POKEHUB_API_URL=${NEXT_PUBLIC_POKEHUB_API_URL}
ENV POKEHUB_API_URL=${NEXT_PUBLIC_POKEHUB_API_URL}

# Build the app
RUN npx nx build pokehub-app --configuration=production

# Runtime stage
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy standalone output (minimal dependencies traced by Next.js)
COPY --from=builder /app/dist/apps/pokehub-app/.next/standalone ./

# Copy static files to where Next.js expects them in the standalone structure
COPY --from=builder /app/dist/apps/pokehub-app/.next/static ./dist/apps/pokehub-app/.next/static
COPY --from=builder /app/dist/apps/pokehub-app/public ./apps/pokehub-app/public

EXPOSE 3000

# Start the standalone server
CMD ["node", "apps/pokehub-app/server.js"]
