FROM mhart/alpine-node:6.2.2

# Creates workdir
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Copy package source
ADD . /usr/src/app/
# System deps
RUN apk add --update git
RUN npm -s -g install gulp@3.9.1

# Install app dependencies
RUN npm -s install

# Build package
RUN gulp build
WORKDIR /usr/src/app

ENV NODE_ENV production
CMD ["node", "dist/server/app.js"]
