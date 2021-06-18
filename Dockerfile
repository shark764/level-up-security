FROM node:14.15.4-alpine3.12

COPY . /usr/src/security/
WORKDIR /usr/src/security
RUN ["yarn", "install"]


COPY . /usr/src/security

RUN yarn build 

WORKDIR /usr/src/security/dist


CMD [ "node", "app.js" ]