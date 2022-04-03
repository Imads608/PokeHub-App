ARG TAG=dev

FROM app-base-image:${TAG} AS builder
WORKDIR /app/builder
COPY . .
RUN npx nx build chat-tcp-gateway --configuration=production

FROM node:lts-alpine3.10 as final
WORKDIR /app
COPY --from=builder /app/builder/dist/apps/chat-tcp-gateway .
RUN npm install --only=production
CMD ["node", "./main.js"]
