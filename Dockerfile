FROM node:6.7

# Node/NPM deps
RUN apt-get update && apt-get install -y build-essential libssl-dev git python unzip
# For Electron
# RUN apt-get update && apt-get install -y libgtk2.0-0 libgconf-2-4 libasound2 libxtst6 libxss1 libnss3 xvfb

RUN npm -s -g install gulp@3.9.1 yarnpkg forever

# Create a new directory for a custom font
RUN mkdir /usr/share/fonts/titilliumweb
WORKDIR /usr/share/fonts/titilliumweb
# Download and unzip the font
RUN wget https://fonts.google.com/download?family=Titillium%20Web -O titilliumweb.zip
RUN unzip titilliumweb.zip
# Refresh font cache
RUN fc-cache -f -v

# Creates workdir
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
ADD package.json yarn.lock ./
RUN yarn
# Copy package sources
ADD . .

# Compile app
RUN gulp build

ENV NODE_ENV production
EXPOSE 3000

# We use a starting script since Heroku can't manage ENTRYPOINT correctly
RUN chmod +x ./entrypoint.sh
CMD ["./entrypoint.sh"]
