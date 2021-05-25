# The Dockerfile uses multi-stages and targets for different environments
#     Usage:
# docker build -t xmex:test --target test .
# docker build -t xmex:integration --target integration .
# docker build -t xmex:release --target release .

FROM node:lts-alpine AS release
RUN apk update
RUN apk add libxml2
RUN apk add libxslt

ARG WORKDIR=/xmex
ARG USER=nobody

WORKDIR $WORKDIR
COPY ./sources/service-build.js ./service.js
COPY ./sources/service.ini      ./conf/service.ini
RUN mkdir ./data
RUN mkdir ./docs
RUN mkdir ./temp
RUN chown -R $USER $WORKDIR

USER $USER
EXPOSE 8000
CMD node service.js ./conf/service.ini



# Integration is the release version with test mode enabled.
# This is used for the integration test before a release.
# Integration uses the release build with trace outputs.
# In addition, it creates trace-cumulate.http for the final smoke test.

# docker kill xmex-integration
# docker build -t xmex:integration --target integration .
# docker run -d -p 8000:8000/tcp --rm --name xmex-integration xmex:integration
#     after that manual start of ./test/cumulated.http in IntelliJ / WebStorm
# docker exec -it xmex-integration sh
# docker logs xmex-integration
# docker cp xmex-integration:/xmex/trace.log ./sources/trace-docker.log
# docker cp xmex-integration:/xmex/trace-cumulate.http ./sources/trace-cumulate.http
# docker kill xmex-integration
FROM node:lts-alpine AS integration
RUN apk update
RUN apk add libxml2
RUN apk add libxslt

ARG WORKDIR=/xmex
ARG USER=nobody

WORKDIR $WORKDIR
COPY ./sources/service-build-test.js ./service.js
COPY ./sources/trace-cumulate.js     ./trace-cumulate.js
COPY ./sources/service.ini           ./conf/
RUN chown -R $USER $WORKDIR

USER $USER
EXPOSE 8000
CMD node service.js ./conf/service.ini



# docker kill xmex-test
# docker build -t xmex:test --target test .
# docker run -d -p 8000:8000/tcp --rm --name xmex-test xmex:test
#     after that manual start of ./test/cumulated.http in IntelliJ / WebStorm
# docker exec -it xmex-test sh
# docker logs xmex-test
# docker cp xmex-test:/xmex/trace.log ./sources/trace-docker.log
# docker kill xmex-test
FROM node:lts-alpine AS test
RUN apk update
RUN apk add libxml2
RUN apk add libxslt

ARG WORKDIR=/xmex
ARG USER=nobody

WORKDIR $WORKDIR
RUN chown -R $USER $WORKDIR
COPY ./package.json .
RUN npm install
COPY ./sources/service.js  .
COPY ./sources/service.ini .

USER $USER
EXPOSE 8000
CMD node service.js
