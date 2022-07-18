ARG TAG=dev
#FROM traefik:${TAG}
# docker build --build-arg "TAG=2.2.8" -t my-app:$TAG

FROM app-base-image:${TAG} AS builder
WORKDIR /app/builder
COPY . .
RUN npx nx build next-app --configuration=production

FROM node:14.18 as final
WORKDIR /app
COPY --from=builder /app/builder/dist/apps/next-app .
RUN npm install --only=production
CMD ["npx", "next", "start"]
