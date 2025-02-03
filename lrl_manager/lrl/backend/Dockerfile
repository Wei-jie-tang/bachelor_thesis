FROM node:18
WORKDIR /src
COPY package.json package.json
RUN npm install -g nodemon pnpm
COPY ../packages packages
RUN pnpm install -P
COPY build/src/ .
CMD [ "nodemon", "src/index.js" ]