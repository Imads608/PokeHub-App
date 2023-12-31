ARG TAG=dev

FROM app-base-image:${TAG} AS builder
WORKDIR /app/builder
COPY . .
RUN npx nx build user-rest-gateway --configuration=production

FROM node:lts-alpine as final
WORKDIR /app
COPY --from=builder /app/builder/dist/apps/user-rest-gateway .
RUN npm install --only=production
CMD ["node", "./main.js"]
