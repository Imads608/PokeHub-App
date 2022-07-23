ARG TAG=dev

FROM app-base-image:${TAG} AS builder
WORKDIR /app/builder
COPY . .
RUN npx nx build user-socket-service --configuration=production

FROM node:lts-alpine3.10 AS final
WORKDIR /app
COPY --from=builder /app/builder/dist/apps/user-socket-service .
RUN npm install --only=production
CMD ["node", "./main.js"]
