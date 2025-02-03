
FROM node:18
WORKDIR /app

RUN npm uninstall -g corepack
RUN npm install -g corepack
# Enable Corepack and install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package*.json /app/

RUN pnpm install --recursive
RUN npm install typescript --save-dev

RUN apt-get update && apt-get install -y \
    sudo \
    openssl \
    docker.io \
    curl \
    && curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose \
    && chmod +x /usr/local/bin/docker-compose \
    && apt-get clean
COPY . .

WORKDIR /app/lrl
RUN rm pnpm-lock.yaml && pnpm install --no-frozen-lockfile 
WORKDIR /app
EXPOSE 3600
CMD ["node", "tokenReceiver.js"]
