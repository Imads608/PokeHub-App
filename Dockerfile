ARG TAG=v0.1
ARG REPO=dev

FROM node:alpine as app-base

WORKDIR /app/base
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY .eslintignore .eslintignore
COPY .eslintrc.json .eslintrc.json
COPY jest.preset.js jest.preset.js
COPY nx.json nx.json
COPY tsconfig.base.json tsconfig.base.json
COPY jest.config.ts jest.config.ts
COPY tailwind.config.js tailwind.config.js
COPY tsconfig.base.json tsconfig.base.json
COPY packages packages
RUN npm install
