FROM node:lts-buster-slim as build

WORKDIR /app

COPY package*json /app/
RUN npm install -g npm@7
RUN npm install

COPY . /app/

RUN npm run ng build && npm run ng run srm:server

FROM node:lts-buster-slim

WORKDIR /app

COPY package*json /app/
RUN npm install -g npm@7
RUN npm install

COPY  --from=build /app/dist dist

ENTRYPOINT [ "node", "/app/dist/srm/server/main.js" ]
