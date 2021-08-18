FROM node:14.15.4-alpine3.12

COPY . /usr/src/security/
WORKDIR /usr/src/security
COPY package*.json ./
RUN ["npm", "install"]


#COPY . .
RUN ["npm", "run", "build"]