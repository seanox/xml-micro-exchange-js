FROM node:lts
CMD apt-get update
CMD apt-get install libxml2
WORKDIR /xmex
COPY ./sources/service-latest.js ./service.js
COPY ./sources/service.ini .
EXPOSE 8000
CMD node service.js
