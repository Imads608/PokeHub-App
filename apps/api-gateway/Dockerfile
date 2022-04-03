ARG TAG=dev
#FROM traefik:${TAG}
# docker build --build-arg "TAG=2.2.8" -t my-app:$TAG

FROM app-base-image:${TAG} AS builder
WORKDIR /app/builder
COPY . .
RUN npx nx build api-gateway --configuration=production

FROM node:lts-alpine3.10 as final
WORKDIR /app
COPY --from=builder /app/builder/dist/apps/api-gateway .
RUN npm install --only=production
CMD ["node", "./main.js"]
