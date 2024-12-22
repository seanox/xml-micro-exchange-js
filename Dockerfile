FROM openjdk:17-jdk-alpine AS build-environment

ARG ANT_VERSION=1.10.14
ARG ANT_RELEASE=apache-ant-$ANT_VERSION
ARG ANT_BINARY=$ANT_RELEASE-bin.tar.gz
ARG ANT_BINARY_URL=https://dlcdn.apache.org/ant/binaries/$ANT_BINARY

RUN apk update \
    && apk upgrade \
    && apk add wget git tar \
    && apk add --no-cache nodejs-current npm

RUN mkdir -p /opt
RUN wget $ANT_BINARY_URL -P /opt

RUN tar -zxvf /opt/$ANT_BINARY -C /opt
RUN mv /opt/$ANT_RELEASE /opt/ant
RUN rm -f /opt/$ANT_BINARY

ENV ANT_HOME=/opt/ant
ENV PATH="${PATH}:${ANT_HOME}/bin"



FROM build-environment AS build

ARG GIT_REPO_TAG=1.4.0
ARG GIT_REPO_NAME=xml-micro-exchange-js
ARG GIT_REPO_URL=https://github.com/seanox
ARG WORKSPACE=/workspace
ARG RELEASE_NAME=seanox-xmex
ARG BUILD_TIMESTAMP=00000000-00000000

# Should prevent the caching of this layer/stage
RUN echo $BUILD_TIMESTAMP > /tmp/cachebust

WORKDIR $WORKSPACE
RUN git clone --branch $GIT_REPO_TAG $GIT_REPO_URL/$GIT_REPO_NAME.git

# Optionally, the local sources from the host are used if necessary
# COPY . $WORKSPACE/$GIT_REPO_NAME

WORKDIR $WORKSPACE/$GIT_REPO_NAME
RUN ant -f development/build.xml release \
    && mkdir release/$RELEASE_NAME \
    && unzip release/$RELEASE_NAME-latest.zip -d release/$RELEASE_NAME



FROM node:lts-alpine AS runtime

ARG GIT_REPO_NAME=xml-micro-exchange-js
ARG WORKSPACE=/workspace
ARG RELEASE_NAME=seanox-xmex
ARG RELEASE_DIR=$WORKSPACE/$GIT_REPO_NAME/release/$RELEASE_NAME
ARG APPLICATION_DIR=/usr/local/xmex
ARG USER=nobody

ENV XMEX_DEBUG_MODE=""
ENV XMEX_CONNECTION_ADDRESS=""
ENV XMEX_CONNECTION_PORT=""
ENV XMEX_CONNECTION_CONTEXT=""
ENV XMEX_CONNECTION_CERTIFICATE=""
ENV XMEX_CONNECTION_SECRET=""
ENV XMEX_CONTENT_DIRECTORY=""
ENV XMEX_CONTENT_DEFAULT=""
ENV XMEX_CONTENT_REDIRECT=""
ENV XMEX_STORAGE_DIRECTORY=""
ENV XMEX_STORAGE_SPACE=""
ENV XMEX_STORAGE_EXPIRATION=""
ENV XMEX_STORAGE_QUANTITY=""
ENV XMEX_STORAGE_REVISION_TYPE=""
ENV XMEX_LIBXML_DIRECTORY="/usr/bin"

RUN apk update \
    && apk upgrade \
    && apk add libxml2 libxslt

RUN mkdir -p $APPLICATION_DIR/data
COPY --from=build $RELEASE_DIR $APPLICATION_DIR
RUN chown -R $USER $APPLICATION_DIR

EXPOSE 80
WORKDIR /usr/local/xmex
CMD node service.js

# For Docker image development only
# CMD [ "sh", "-c", "tail -f /dev/null" ]
