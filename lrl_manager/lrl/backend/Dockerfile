FROM node:20-slim
WORKDIR /src
COPY package.json package.json
RUN npm install -g nodemon pnpm
# Install system dependencies required for WebRTC (Minimal)
RUN apt-get update && apt-get install -y \
  libnss3 \
  libxrandr2 \
  libxcomposite1 \
  libxcursor1 \
  libxi6 \
  && rm -rf /var/lib/apt/lists/*
COPY ../packages packages
RUN pnpm install -P
COPY build/src/ .
CMD [ "nodemon", "src/index.js" ]