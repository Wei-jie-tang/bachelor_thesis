
FROM node:18
WORKDIR /usr/src/app
COPY package*.json ./

RUN npm install && apt-get update && apt-get install -y openssl 
COPY . .
EXPOSE 3500
CMD ["node", "tokenGenerator.js"]

