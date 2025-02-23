ARG NODE_VERSION=20.18.0-alpine

FROM node:${NODE_VERSION} AS builder

WORKDIR /opt/app
COPY common/deploy ./

ENTRYPOINT [ "node", "--watch" ]

EXPOSE 8080
