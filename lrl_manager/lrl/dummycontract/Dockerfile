FROM node:18
WORKDIR /src
COPY package.json package.json
RUN npm install -g nodemon
COPY .env .env
COPY build/src/dummycontract .
COPY /build/src/common .
CMD [ "nodemon", "server/index.js" ]