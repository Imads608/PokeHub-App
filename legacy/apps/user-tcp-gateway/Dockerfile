ARG TAG=dev

FROM app-base-image:${TAG} AS builder
WORKDIR /app/builder
COPY . .
RUN npx nx build user-tcp-gateway --configuration=production

FROM node:lts-alpine AS final
WORKDIR /app
COPY --from=builder /app/builder/dist/apps/user-tcp-gateway .
RUN npm install --only=production
CMD ["node", "./main.js"]
