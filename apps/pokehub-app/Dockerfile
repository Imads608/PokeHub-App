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

WORKDIR /app/pokehub

# Copy built application
COPY --from=builder /app/dist/apps/pokehub-app .

# Install only production dependencies
RUN npm install --only=production

EXPOSE 3000

CMD ["npx", "next", "start"]
