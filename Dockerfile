FROM mhart/alpine-node:6.7

# System deps
RUN apk add --update --no-cache make gcc g++ git python build-base
RUN npm -s -g install gulp@3.9.1

# Creates workdir
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
ADD package.json .
RUN npm -s install
# Copy package sources
ADD . .

# Compile app
RUN gulp build

ENV NODE_ENV production
CMD ["node", "dist/server/app.js"]
