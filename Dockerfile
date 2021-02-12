# The Dockerfile uses multi-stages and targets for different environments
#     Usage:
# docker build -t xmex-test --target test .
# docker build -t xmex --target release .

FROM node:lts-alpine AS release
RUN apk update
RUN apk add libxml2
RUN apk add libxslt

ARG WORKDIR=/xmex
ARG USER=nobody

WORKDIR $WORKDIR
RUN chown -R $USER $WORKDIR
COPY ./release/build/service.js  ./service.js
COPY ./release/build/service.ini ./conf/

USER $USER
EXPOSE 8000
CMD node service.js ./conf/service.ini

# docker kill xmex-test
# docker build -t xmex-test --target test .
# docker run -d -p 8000:8000/tcp --rm --name xmex-test xmex-test
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
