FROM node:14.15.4-alpine3.12 as build-stage

RUN mkdir -p /usr/src/security
WORKDIR /usr/src/security
COPY package*.json /usr/src/security/
RUN ["npm", "install"]
COPY . /usr/src/security/
RUN ["npm", "run", "build"]


FROM node:14.16.1-alpine3.13 as run-stage

COPY --from=build-stage /usr/src/security /usr/src/security
WORKDIR /usr/src/security
CMD [ "npm", "start" ]