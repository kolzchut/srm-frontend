FROM node:18-slim as build

WORKDIR /app

COPY package*json /app/
RUN apt-get update
RUN apt-get install -y ca-certificates
RUN npm install -g npm@7
RUN npm install

COPY . /app/

ARG ENV_NAME
RUN echo "Building with configuration ${ENV_NAME}" && npm run -- ng build --configuration ${ENV_NAME} && npm run -- ng run srm:server:${ENV_NAME}
ARG SENTRY_AUTH_TOKEN
RUN test -z "${SENTRY_AUTH_TOKEN}" || SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN} npm run sentry:sourcemaps


FROM node:18-slim

WORKDIR /app

COPY package*json /app/
RUN npm install -g npm@7
RUN npm install

COPY  --from=build /app/dist dist

ENTRYPOINT [ "node", "/app/dist/srm/server/main.js" ]
