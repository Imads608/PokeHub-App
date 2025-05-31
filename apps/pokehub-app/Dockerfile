ARG TAG=dev

FROM pokehub.azurecr.io/pokehub-base:${TAG} as app-base

# NOTE: the environments from this dockerfile are being used by the app over
# environment variables

FROM app-base AS app-build
ENV NX_DAEMON=false
# ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
# ENV GOOGLE_TAG_ID=${GOOGLE_TAG_ID}

WORKDIR /app/base
COPY . ./apps/pokehub-app
RUN npx nx build pokehub-app --configuration=production --skip-nx-cache

FROM node:alpine as app-runtime
WORKDIR /app/pokehub
COPY --from=app-build /app/base/dist/apps/pokehub-app .
#RUN npm install --only=production

CMD ["npm", "run", "start"]
#CMD ["npx", "next", "start"]
