# Simple audio mixing microservice for Railway/Render
# This can be deployed separately and called from your main Vercel app

FROM node:18-alpine

# Install ffmpeg
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
