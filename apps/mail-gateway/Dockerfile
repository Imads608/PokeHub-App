ARG TAG=dev

FROM app-base-image:${TAG} AS builder
WORKDIR /app/builder
COPY . .
RUN npx nx build mail-gateway --configuration=production

FROM node:lts-alpine as final
WORKDIR /app
COPY --from=builder /app/builder/dist/apps/mail-gateway .
RUN npm install --only=production
CMD ["node", "./main.js"]
