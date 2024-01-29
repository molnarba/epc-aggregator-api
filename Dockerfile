#
# Author: Thomas Weckert (thomas.weckert@ecube.de)
#
# https://docs.docker.com/develop/develop-images/multistage-build/
# https://nodejs.org/de/docs/guides/nodejs-docker-webapp/#creating-a-dockerfile
#
# Build with: docker build -t registry.gitlab.com/${GITLAB_PROJECT_NAMESPACE}/aggregator-backend .
#

#
# base image
#
FROM node:18-alpine AS base
# allows to identify Docker images by label: docker images --filter "label=intermediate=true"
LABEL intermediate=true
COPY ./package*.json /app/
COPY ./.npmrc /app/
COPY ./config /config

#
# build dependencies image
#
FROM base AS dependencies
LABEL intermediate=true
WORKDIR /app
# install and cache Node.JS, load project dependencies
RUN npm cache clean --force \
    && apk add python3 make gcc g++ musl-dev \
    && npm i -g @nestjs/cli \
    && npm ci
# copy app sources
COPY . .
# generate build
RUN npm run generate:aggregator \
    && nest build

#
# test image
#
FROM dependencies AS test
LABEL intermediate=true
COPY . .
RUN npm run start \
    && npm run test:api

#
# release image
#
FROM base AS release
LABEL intermediate=false
WORKDIR /app
ENV NODE_ENV production
ENV PORT 3000
EXPOSE $PORT
RUN npm i -g pino-gelf
# used for health check
RUN apk --no-cache add curl

# copy app dependencies
COPY --from=dependencies /app ./
COPY --from=base ./config/gelf-schema.json ./gelf-schema.json
COPY --from=base config/facet-configuration.commercetools.yml ./facet-configuration.yml
CMD ["sh", "./entrypoint.sh"]
